const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'books.db');
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, (error) => {
      if (error) {
        console.log(`Server Error: ${error.message}`);
        process.exit(1);
      }
      console.log('Server running at http://localhost:3000/');
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Checks the request body. Returns an error message, or null if the body is valid.
const validateBook = (body) => {
  const { title, author, price, pages } = body || {};

  if (typeof title !== 'string' || title.trim() === '') {
    return 'title is required and must be a non-empty text';
  }
  if (typeof author !== 'string' || author.trim() === '') {
    return 'author is required and must be a non-empty text';
  }
  if (price === undefined || price === null || price === '') {
    return 'price is required';
  }
  if (typeof price === 'boolean' || Number.isNaN(Number(price))) {
    return 'price must be a number';
  }
  if (Number(price) < 0) {
    return 'price cannot be negative';
  }
  if (pages !== undefined && pages !== null && Number.isNaN(Number(pages))) {
    return 'pages must be a number';
  }
  return null;
};

// GET all books (with search, price range, sort and pagination)
app.get('/books/', async (req, res) => {
  const {
    search_q = '',
    min_price = 0,
    max_price = 1000000,
    order_by = 'id',
    order = 'ASC',
    limit = 10,
    offset = 0,
  } = req.query;

  // Column names cannot be passed as ? values, so we allow only known columns
  const allowedColumns = ['id', 'title', 'author', 'price', 'pages'];
  const sortColumn = allowedColumns.includes(order_by) ? order_by : 'id';
  const sortOrder = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const books = await db.all(
    `SELECT * FROM book
     WHERE title LIKE ?
       AND price BETWEEN ? AND ?
     ORDER BY ${sortColumn} ${sortOrder}
     LIMIT ? OFFSET ?`,
    [
      `%${search_q}%`,
      Number(min_price),
      Number(max_price),
      Number(limit),
      Number(offset),
    ]
  );
  res.status(200).json(books);
});

// GET one book
app.get('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;
  const book = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.status(200).json(book);
});

// POST add a book
app.post('/books/', async (req, res) => {
  const errorMessage = validateBook(req.body);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const { title, author, price, pages } = req.body;
  const result = await db.run(
    'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)',
    [title.trim(), author.trim(), Number(price), pages === undefined ? null : Number(pages)]
  );
  res.status(201).json({ message: 'Book added', bookId: result.lastID });
});

// PUT update a book
app.put('/books/:bookId/', async (req, res) => {
  const errorMessage = validateBook(req.body);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const { bookId } = req.params;
  const { title, author, price, pages } = req.body;
  const result = await db.run(
    'UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?',
    [title.trim(), author.trim(), Number(price), pages === undefined ? null : Number(pages), bookId]
  );
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.status(200).json({ message: 'Book updated' });
});

// DELETE a book
app.delete('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;
  const result = await db.run('DELETE FROM book WHERE id = ?', [bookId]);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.status(200).json({ message: 'Book deleted' });
});