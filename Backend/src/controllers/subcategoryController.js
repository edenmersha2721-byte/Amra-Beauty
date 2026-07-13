import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { requireFields, toBool } from '../utils/validate.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const SELECT_FULL = `
  SELECT sc.*, c.slug AS category_slug, c.name AS category_name,
         COUNT(s.id) FILTER (WHERE s.is_active) AS service_count
  FROM subcategories sc
  LEFT JOIN categories c ON c.id = sc.category_id
  LEFT JOIN services s ON s.subcategory_id = sc.id
`;

// GET /api/subcategories  ?category_id=&active=true
export const listSubcategories = asyncHandler(async (req, res) => {
  const { category_id, active } = req.query;
  const where = [];
  const params = [];
  if (active === 'true') where.push('sc.is_active = TRUE');
  if (category_id) {
    params.push(category_id);
    where.push(`sc.category_id = $${params.length}`);
  }
  const sql = `${SELECT_FULL}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY sc.id, c.slug, c.name
    ORDER BY sc.name ASC`;
  const { rows } = await query(sql, params);
  res.json({ success: true, count: rows.length, data: rows });
});

// POST /api/subcategories (admin)
export const createSubcategory = asyncHandler(async (req, res) => {
  requireFields(req.body, ['category_id', 'name']);
  const { category_id, name } = req.body;

  const cat = await query('SELECT id FROM categories WHERE id = $1', [category_id]);
  if (!cat.rowCount) throw ApiError.badRequest('Category not found');

  const slug = slugify(name);
  if (!slug) throw ApiError.badRequest('Please provide a valid name');

  const dup = await query(
    'SELECT id FROM subcategories WHERE category_id = $1 AND slug = $2',
    [category_id, slug]
  );
  if (dup.rowCount) throw ApiError.badRequest('A subcategory with this name already exists in this category');

  const { rows } = await query(
    `INSERT INTO subcategories (category_id, name, slug, is_active)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [category_id, name.trim(), slug, toBool(req.body.is_active) ?? true]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

// DELETE /api/subcategories/:id (admin)
export const deleteSubcategory = asyncHandler(async (req, res) => {
  // Services keep existing (subcategory_id set to NULL via FK ON DELETE SET NULL)
  const { rowCount } = await query('DELETE FROM subcategories WHERE id = $1', [req.params.id]);
  if (!rowCount) throw ApiError.notFound('Subcategory not found');
  res.json({ success: true, message: 'Subcategory deleted' });
});
