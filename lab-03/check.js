const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.db');

db.all('SELECT * FROM book ORDER BY id', (err, rows) => {
  if (err) {
    console.log(err.message);
  } else {
    console.table(rows);
    console.log('Total rows:', rows.length);
  }
  db.close();
});