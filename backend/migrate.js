const { getDb } = require('./db');

async function migrate() {
  const db = await getDb();
  try {
    await db.run('ALTER TABLE announcements ADD COLUMN fee_amount INTEGER DEFAULT 0');
    console.log('Migration successful');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('Migration already applied');
    } else {
      console.error('Migration failed:', err);
    }
  }
}

migrate();
