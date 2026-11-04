// Logboek van belangrijke (beheer)acties. Bevat bewust geen volledige persoonsgegevens.
export async function audit(db, { admin = null, actor, action, entity = null, entityId = null, details = {}, ip = null }) {
  await db.query(
    'INSERT INTO audit_log (admin_id, actor, action, entity, entity_id, details, ip) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [admin?.id ?? null, actor || (admin ? admin.email : 'systeem'), action, entity, entityId == null ? null : String(entityId), JSON.stringify(details), ip],
  );
}
