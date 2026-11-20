const db = require('../config/db');

// MySQL full-text search (MATCH ... AGAINST) needs the ft_jobs_search index,
// which some MySQL-compatible databases (e.g. TiDB) cannot create. Queries use
// it when present and fall back to LIKE matching otherwise.
let fulltextCheck;

function hasJobsFulltext() {
  if (!fulltextCheck) {
    fulltextCheck = db
      .query(
        `SELECT COUNT(*) AS n FROM information_schema.statistics
          WHERE table_schema = DATABASE() AND table_name = 'jobs' AND index_name = 'ft_jobs_search'`
      )
      .then(([[row]]) => Number(row.n) > 0)
      .catch(() => {
        fulltextCheck = undefined; // retry on the next request
        return false;
      });
  }
  return fulltextCheck;
}

/** Escape LIKE wildcards in user input and wrap it for a "contains" match. */
function likeContains(text) {
  return `%${String(text).replace(/[\\%_]/g, '\\$&')}%`;
}

module.exports = { hasJobsFulltext, likeContains };
