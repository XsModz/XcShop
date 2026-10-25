import { query } from '../telegram.js';
import { escapeHtml } from '../validators.js';

export async function getAllCategoriesForInstance(instanceId, hidden = false) {
  const result = await query(
    `SELECT * FROM categories WHERE instance_id = $1 AND is_hidden = $2 ORDER BY name ASC`,
    [instanceId, hidden]
  );
  return result.rows;
}

export async function getCategoryById(instanceId, id) {
  const result = await query(
    `SELECT * FROM categories WHERE instance_id = $1 AND id = $2`,
    [instanceId, id]
  );
  return result.rows[0] ?? null;
}

export async function getCategoryFileCount(instanceId, categoryId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM files WHERE instance_id = $1 AND category_id = $2 AND is_hidden = FALSE`,
    [instanceId, categoryId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function upsertCategory(instanceId, name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new Error('Category name cannot be empty');
  }

  const result = await query(
    `INSERT INTO categories (instance_id, name)
     VALUES ($1, $2)
     ON CONFLICT (instance_id, name) DO NOTHING
     RETURNING *`,
    [instanceId, trimmed]
  );

  return result.rows[0] ?? null;
}

export async function renameCategory(instanceId, categoryId, newName) {
  const trimmed = String(newName ?? '').trim();
  if (!trimmed) {
    throw new Error('Category name cannot be empty');
  }

  const result = await query(
    `UPDATE categories
     SET name = $1,
         updated_at = NOW()
     WHERE instance_id = $2 AND id = $3
     RETURNING *`,
    [trimmed, instanceId, categoryId]
  );
  return result.rows[0] ?? null;
}

export async function hideCategory(instanceId, categoryId) {
  const result = await query(
    `UPDATE categories
     SET is_hidden = TRUE,
         updated_at = NOW()
     WHERE instance_id = $1 AND id = $2
     RETURNING *`,
    [instanceId, categoryId]
  );
  return result.rows[0] ?? null;
}

export async function showCategory(instanceId, categoryId) {
  const result = await query(
    `UPDATE categories
     SET is_hidden = FALSE,
         updated_at = NOW()
     WHERE instance_id = $1 AND id = $2
     RETURNING *`,
    [instanceId, categoryId]
  );
  return result.rows[0] ?? null;
}

export async function deleteCategory(instanceId, categoryId) {
  const result = await query(
    `DELETE FROM categories
     WHERE instance_id = $1 AND id = $2
     RETURNING *`,
    [instanceId, categoryId]
  );
  return result.rows[0] ?? null;
}

export async function getCategoriesWithCounts(instanceId) {
  const result = await query(
    `SELECT c.*, COUNT(f.id)::int AS file_count
     FROM categories c
     LEFT JOIN files f ON f.instance_id = c.instance_id AND f.category_id = c.id AND f.is_hidden = FALSE
     WHERE c.instance_id = $1
     GROUP BY c.id
     ORDER BY c.name ASC`,
    [instanceId]
  );
  return result.rows;
}

export default {
  getAllCategoriesForInstance,
  getCategoryById,
  getCategoryFileCount,
  upsertCategory,
  renameCategory,
  hideCategory,
  showCategory,
  deleteCategory,
  getCategoriesWithCounts
};
