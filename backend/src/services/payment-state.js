/*
 * Single source of truth for payment status changes made by the escrow
 * service. Every change is a conditional UPDATE (WHERE status = <from>) and
 * must affect exactly one row; anything else means another worker or a
 * webhook got there first, and the caller must not carry on as if it had
 * succeeded.
 *
 *   pending        -> held | failed
 *   held           -> releasing | refunded | disputed
 *   releasing      -> released | release_failed
 *   release_failed -> releasing          (manual retry after fixing the cause)
 *   failed         -> pending            (customer retries the card)
 *   released       -> disputed
 */
const TRANSITIONS = Object.freeze({
  pending: ['held', 'failed'],
  held: ['releasing', 'refunded', 'disputed'],
  releasing: ['released', 'release_failed'],
  release_failed: ['releasing'],
  failed: ['pending'],
  released: ['disputed'],
});

class PaymentTransitionError extends Error {
  constructor(message, { paymentId, from, to } = {}) {
    super(message);
    this.name = 'PaymentTransitionError';
    this.paymentId = paymentId;
    this.from = from;
    this.to = to;
  }
}

const isLegalTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

/**
 * Move a payment from one status to another.
 * `set` is extra SQL assignments (e.g. "released_at = NOW()"), `setParams`
 * the values for any placeholders in it.
 * Returns true when the row moved; false when it was not in `from`.
 */
async function transitionPayment(conn, { id, from, to, set = '', setParams = [] }) {
  if (!isLegalTransition(from, to)) {
    throw new PaymentTransitionError(`Illegal payment transition ${from} -> ${to}`, { paymentId: id, from, to });
  }
  const [result] = await conn.query(
    `UPDATE payments SET status = ?${set ? `, ${set}` : ''} WHERE id = ? AND status = ?`,
    [to, ...setParams, id, from]
  );
  return result.affectedRows === 1;
}

/** Same as transitionPayment, but a row that did not move is an error. */
async function requireTransition(conn, change) {
  if (!(await transitionPayment(conn, change))) {
    throw new PaymentTransitionError(
      `Payment ${change.id} was not in status '${change.from}', so it could not move to '${change.to}'`,
      change
    );
  }
}

module.exports = { TRANSITIONS, PaymentTransitionError, isLegalTransition, transitionPayment, requireTransition };
