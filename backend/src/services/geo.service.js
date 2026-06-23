const db = require('../config/db');

// Find providers within radius using Haversine formula
async function findNearbyProviders(lat, lng, radiusKm = 25, categorySlug = null) {
  let query = `
    SELECT u.id, u.name, u.avatar_url,
           pp.bio, pp.skills, pp.avg_rating, pp.total_jobs_done, pp.years_experience, pp.id_verified,
           pp.service_radius_km,
           (6371 * acos(
             cos(radians(?)) * cos(radians(pp.location_lat)) *
             cos(radians(pp.location_lng) - radians(?)) +
             sin(radians(?)) * sin(radians(pp.location_lat))
           )) AS distance
    FROM users u
    JOIN provider_profiles pp ON u.id = pp.user_id
    WHERE u.role = 'provider'
      AND pp.location_lat IS NOT NULL
      AND pp.location_lng IS NOT NULL
    HAVING distance <= ?
    ORDER BY pp.avg_rating DESC, distance ASC
  `;

  const params = [lat, lng, lat, radiusKm];

  const [rows] = await db.query(query, params);
  return rows;
}

// Find open jobs near a provider's location (includes jobs without coordinates)
async function findNearbyJobs(lat, lng, radiusKm = 25) {
  // Get nearby jobs with coordinates
  const [nearbyRows] = await db.query(
    `SELECT j.*, c.name as category_name,
            (6371 * acos(
              cos(radians(?)) * cos(radians(j.location_lat)) *
              cos(radians(j.location_lng) - radians(?)) +
              sin(radians(?)) * sin(radians(j.location_lat))
            )) AS distance
     FROM jobs j
     LEFT JOIN categories c ON j.category_id = c.id
     WHERE j.status = 'open'
       AND j.location_lat IS NOT NULL
       AND j.location_lng IS NOT NULL
     HAVING distance <= ?
     ORDER BY distance ASC`,
    [lat, lng, lat, radiusKm]
  );

  // Also get open jobs without coordinates (so providers always see all available work)
  const [noGeoRows] = await db.query(
    `SELECT j.*, c.name as category_name, NULL as distance
     FROM jobs j
     LEFT JOIN categories c ON j.category_id = c.id
     WHERE j.status = 'open'
       AND (j.location_lat IS NULL OR j.location_lng IS NULL)
     ORDER BY j.created_at DESC`
  );

  return [...nearbyRows, ...noGeoRows];
}

module.exports = { findNearbyProviders, findNearbyJobs };
