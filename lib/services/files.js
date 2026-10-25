import { query } from '../telegram.js';
import { escapeHtml } from '../validators.js';

export async function listFilesForInstance(instanceId, options = {}) {
  const { categoryId = null, hidden = false, tier = null, limit = 10, offset = 0 } = options;

  const conditions = ['instance_id = $1'];
  const values = [instanceId];
  let valueIndex = 2;

  if (categoryId !== null) {
    conditions.push(`category_id = $${valueIndex}`);
    values.push(categoryId);
    valueIndex += 1;
  }

  if (tier) {
    conditions.push(`tier = $${valueIndex}`);
    values.push(tier);
    valueIndex += 1;
  }

  conditions.push(`is_hidden = $${valueIndex}`);
  values.push(hidden);
  valueIndex += 1;

  const where = `WHERE ${conditions.join(' AND ')}`;

  const rows = await query(
    `SELECT * FROM files ${where} ORDER BY created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`,
    [...values, limit, offset]
  );

  return rows.rows;
}

export async function getFileById(instanceId, fileId) {
  const result = await query(
    `SELECT * FROM files WHERE instance_id = $1 AND id = $2`,
    [instanceId, fileId]
  );
  return result.rows[0] ?? null;
}

export async function createFileEntry(instanceId, fileData) {
  const result = await query(
    `INSERT INTO files (
        instance_id,
        category_id,
        title,
        description,
        tier,
        storage_message_id,
        created_by,
        is_hidden
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
      RETURNING *`,
    [
      instanceId,
      fileData.category_id,
      fileData.title,
      fileData.description ?? null,
      fileData.tier,
      fileData.storage_message_id,
      fileData.created_by
    ]
  );

  return result.rows[0];
}

export async function updateFileVisibility(instanceId, fileId, isHidden) {
  const result = await query(
    `UPDATE files
     SET is_hidden = $1,
         updated_at = NOW()
     WHERE instance_id = $2 AND id = $3
     RETURNING *`,
    [isHidden, instanceId, fileId]
  );
  return result.rows[0] ?? null;
}

export async function setFileTier(instanceId, fileId, tier) {
  const result = await query(
    `UPDATE files
     SET tier = $1,
         updated_at = NOW()
     WHERE instance_id = $2 AND id = $3
     RETURNING *`,
    [tier, instanceId, fileId]
  );
  return result.rows[0] ?? null;
}

export async function renameFile(instanceId, fileId, title) {
  const result = await query(
    `UPDATE files
     SET title = $1,
         updated_at = NOW()
     WHERE instance_id = $2 AND id = $3
     RETURNING *`,
    [title, instanceId, fileId]
  );
  return result.rows[0] ?? null;
}

export async function moveFileToCategory(instanceId, fileId, categoryId) {
  const result = await query(
    `UPDATE files
     SET category_id = $1,
         updated_at = NOW()
     WHERE instance_id = $2 AND id = $3
     RETURNING *`,
    [categoryId, instanceId, fileId]
  );
  return result.rows[0] ?? null;
}

export async function softDeleteFile(instanceId, fileId) {
  const result = await query(
    `UPDATE files
     SET is_hidden = TRUE,
         updated_at = NOW()
     WHERE instance_id = $1 AND id = $2
     RETURNING *`,
    [instanceId, fileId]
  );
  return result.rows[0] ?? null;
}

export async function deleteFile(instanceId, fileId) {
  const result = await query(
    `DELETE FROM files
     WHERE instance_id = $1 AND id = $2
     RETURNING *`,
    [instanceId, fileId]
  );
  return result.rows[0] ?? null;
}

export async function countVisibleFiles(instanceId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM files WHERE instance_id = $1 AND is_hidden = FALSE`,
    [instanceId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export default {
  listFilesForInstance,
  getFileById,
  createFileEntry,
  updateFileVisibility,
  setFileTier,
  renameFile,
  moveFileToCategory,
  softDeleteFile,
  deleteFile,
  countVisibleFiles
};
