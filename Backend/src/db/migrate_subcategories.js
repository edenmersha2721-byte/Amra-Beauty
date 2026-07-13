import { pool, query } from '../config/db.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const run = async () => {
  try {
    console.log('Applying subcategory migration…');

    await query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id          SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name        VARCHAR(80) NOT NULL,
        slug        VARCHAR(90) NOT NULL,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (category_id, slug)
      )
    `);
    await query('CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id)');
    await query('ALTER TABLE services ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL');
    await query('CREATE INDEX IF NOT EXISTS idx_services_subcategory ON services(subcategory_id)');
    console.log('  ✓ subcategories table + services.subcategory_id ready');

    // Seed Makeup subcategories (including Graduation)
    const cat = await query("SELECT id FROM categories WHERE slug = 'makeup'");
    if (cat.rowCount) {
      const catId = cat.rows[0].id;
      const names = ['Simple', 'Bridal', 'Birthday', 'Creative', 'Graduation'];
      for (const name of names) {
        await query(
          `INSERT INTO subcategories (category_id, name, slug)
           VALUES ($1, $2, $3)
           ON CONFLICT (category_id, slug) DO NOTHING`,
          [catId, name, slugify(name)]
        );
      }
      console.log(`  ✓ Makeup subcategories seeded: ${names.join(', ')}`);

      // Best-effort: attach existing makeup services to a matching subcategory by name.
      const subs = await query('SELECT id, name FROM subcategories WHERE category_id = $1', [catId]);
      const svcs = await query('SELECT id, name FROM services WHERE category_id = $1', [catId]);
      let mapped = 0;
      for (const s of svcs.rows) {
        const match = subs.rows.find((sub) => s.name.toLowerCase().includes(sub.name.toLowerCase()));
        if (match) {
          const r = await query(
            'UPDATE services SET subcategory_id = $1 WHERE id = $2 AND subcategory_id IS NULL',
            [match.id, s.id]
          );
          mapped += r.rowCount;
        }
      }
      console.log(`  ✓ auto-mapped ${mapped} makeup service(s) to a subcategory`);
    } else {
      console.log('  • No "makeup" category found — skipped seeding subcategories');
    }

    console.log('✅ Subcategory migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
