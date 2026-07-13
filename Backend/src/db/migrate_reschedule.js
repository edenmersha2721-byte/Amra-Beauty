import { pool, query } from '../config/db.js';

const run = async () => {
  try {
    console.log('Applying reschedule migration…');
    await query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_date DATE');
    await query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_time TIME');
    console.log('✅ Reschedule columns ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
