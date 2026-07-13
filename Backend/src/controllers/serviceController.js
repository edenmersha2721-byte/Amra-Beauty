import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { requireFields, toBool } from '../utils/validate.js';

const SELECT_WITH_CATEGORY = `
  SELECT s.*,
         c.name AS category_name, c.slug AS category_slug,
         sc.name AS subcategory_name, sc.slug AS subcategory_slug
  FROM services s
  LEFT JOIN categories c ON c.id = s.category_id
  LEFT JOIN subcategories sc ON sc.id = s.subcategory_id
`;

// GET /api/services  ?category=slug&featured=true&active=true&search=
export const listServices = asyncHandler(async (req, res) => {
  const { category, featured, active, search } = req.query;
  const where = [];
  const params = [];

  if (active === 'true') where.push('s.is_active = TRUE');
  if (featured === 'true') where.push('s.is_featured = TRUE');
  if (category) {
    params.push(category);
    where.push(`c.slug = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(s.name ILIKE $${params.length} OR s.description ILIKE $${params.length})`);
  }

  const sql = `${SELECT_WITH_CATEGORY}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY s.is_featured DESC, s.created_at DESC`;
  const { rows } = await query(sql, params);
  res.json({ success: true, count: rows.length, data: rows });
});

// GET /api/services/:id
export const getService = asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_WITH_CATEGORY} WHERE s.id = $1`, [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Service not found');
  res.json({ success: true, data: rows[0] });
});

// POST /api/services (admin)
export const createService = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'price', 'duration_minutes']);
  const { name, description, category_id, subcategory_id, price, duration_minutes, image_url, image_pos_y, image_zoom } = req.body;
  const { rows } = await query(
    `INSERT INTO services (name, description, category_id, subcategory_id, price, duration_minutes, image_url, image_pos_y, image_zoom, is_featured, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      name.trim(),
      description || null,
      category_id || null,
      subcategory_id || null,
      Number(price),
      Number(duration_minutes),
      image_url || null,
      image_pos_y != null && image_pos_y !== '' ? Number(image_pos_y) : 50,
      image_zoom != null && image_zoom !== '' ? Number(image_zoom) : 1,
      toBool(req.body.is_featured) ?? false,
      toBool(req.body.is_active) ?? true,
    ]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

// PUT /api/services/:id (admin)
export const updateService = asyncHandler(async (req, res) => {
  const { name, description, category_id, price, duration_minutes, image_url, image_pos_y, image_zoom } = req.body;
  // subcategory_id is set directly (so it can also be cleared) when present in the body.
  const hasSub = Object.prototype.hasOwnProperty.call(req.body, 'subcategory_id');
  const subId = req.body.subcategory_id ? Number(req.body.subcategory_id) : null;
  const { rows } = await query(
    `UPDATE services SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       category_id = COALESCE($3, category_id),
       price = COALESCE($4, price),
       duration_minutes = COALESCE($5, duration_minutes),
       image_url = COALESCE($6, image_url),
       is_featured = COALESCE($7, is_featured),
       is_active = COALESCE($8, is_active),
       image_pos_y = COALESCE($9, image_pos_y),
       image_zoom = COALESCE($10, image_zoom),
       subcategory_id = CASE WHEN $11 THEN $12 ELSE subcategory_id END,
       updated_at = NOW()
     WHERE id = $13 RETURNING *`,
    [
      name || null,
      description ?? null,
      category_id ?? null,
      price != null && price !== '' ? Number(price) : null,
      duration_minutes != null && duration_minutes !== '' ? Number(duration_minutes) : null,
      image_url ?? null,
      toBool(req.body.is_featured) ?? null,
      toBool(req.body.is_active) ?? null,
      image_pos_y != null && image_pos_y !== '' ? Number(image_pos_y) : null,
      image_zoom != null && image_zoom !== '' ? Number(image_zoom) : null,
      hasSub,
      subId,
      req.params.id,
    ]
  );
  if (!rows[0]) throw ApiError.notFound('Service not found');
  res.json({ success: true, data: rows[0] });
});

// DELETE /api/services/:id (admin)
export const deleteService = asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM services WHERE id = $1', [req.params.id]);
  if (!rowCount) throw ApiError.notFound('Service not found');
  res.json({ success: true, message: 'Service deleted' });
});
