function paginate(query, { page = 1, limit = 20 }) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (p - 1) * l;

  return {
    query: `${query} LIMIT ? OFFSET ?`,
    values: [l, offset],
    page: p,
    limit: l,
  };
}

function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

module.exports = { paginate, paginationMeta };
