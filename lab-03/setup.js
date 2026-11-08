const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.db');

const books = [
  ['The Alchemist', 'Paulo Coelho', 299, 208],
  ['Wings of Fire', 'A. P. J. Abdul Kalam', 350, 180],
  ['Atomic Habits', 'James Clear', 499, 320],
  ['The Monk Who Sold His Ferrari', 'Robin Sharma', 250, 198],
  ['Rich Dad Poor Dad', 'Robert Kiyosaki', 399, 336],
  ['Ikigai', 'Hector Garcia', 320, 208],
  ['Think and Grow Rich', 'Napoleon Hill', 275, 238],
  ['The Power of Habit', 'Charles Duhigg', 450, 371],
  ['Deep Work', 'Cal Newport', 480, 304],
  ['Zero to One', 'Peter Thiel', 420, 224]
];

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS book');
  db.run(`CREATE TABLE book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
  )`);

  const stmt = db.prepare('INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)');
  books.forEach((b) => stmt.run(b));
  stmt.finalize();

  db.close(() => console.log('books.db created with 10 books'));
});