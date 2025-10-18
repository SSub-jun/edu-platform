import { Client } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://edu:edu@localhost:5432/edudb';
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const res = await client.query('SELECT version() as version, current_database() as db, now() as now');
    const row = res.rows[0];
    console.log(`[SQL] version=${row.version}`);
    console.log(`[SQL] db=${row.db} now=${row.now.toISOString ? row.now.toISOString() : row.now}`);
    console.log('SMOKE SQL OK');
    process.exit(0);
  } catch (e) {
    console.error('SMOKE SQL FAIL', e);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();










