const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, nom, email, telephone, items, total, created_at FROM commandes", (err, rows) => {
  if (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close(() => process.exit(0));
});
