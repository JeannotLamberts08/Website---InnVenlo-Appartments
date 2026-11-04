import pg from 'pg';

// DATE-kolommen als 'YYYY-MM-DD' teruggeven (geen tijdzone-verschuivingen)
pg.types.setTypeParser(1082, (v) => v);
// BIGINT (count(*)) als getal
pg.types.setTypeParser(20, (v) => Number(v));

export function createPool(databaseUrl) {
  // Sessietijdzone vast op Nederlandse tijd (CURRENT_DATE e.d.)
  return new pg.Pool({ connectionString: databaseUrl, max: 10, options: '-c timezone=Europe/Amsterdam' });
}

// Voer fn uit binnen één transactie; rollback bij elke fout.
export async function tx(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
