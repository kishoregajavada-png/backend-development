
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const initializeDB = require('./db');

const app = express();

app.use(express.json());

const JWT_SECRET = 'MY_SECRET_KEY';

let db = null;

// Start the server
const startServer = async () => {
  try {
    db = await initializeDB();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

// User Registration API
app.post('/register/', async (request, response) => {
  const { username, name, password } = request.body;

  if (!username || !name || !password) {
    return response.status(400).send({
      message: 'All fields are required',
    });
  }

  try {
    const existingUser = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return response.status(400).send({
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      'INSERT INTO users (username, name, password) VALUES (?, ?, ?)',
      [username, name, hashedPassword]
    );

    response.status(201).send({
      message: 'User created successfully',
    });
  } catch (error) {
    response.status(500).send({
      message: error.message,
    });
  }
});

// User Login API
app.post('/login/', async (request, response) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return response.status(400).send({
      message: 'Username and password are required',
    });
  }

  try {
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return response.status(400).send({
        message: 'Invalid user',
      });
    }

    const isPasswordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatched) {
      return response.status(400).send({
        message: 'Invalid password',
      });
    }

    const payload = {
      username: username,
    };

    const jwtToken = jwt.sign(payload, JWT_SECRET);

    response.send({
      jwt_token: jwtToken,
    });
  } catch (error) {
    response.status(500).send({
      message: error.message,
    });
  }
});

// Authentication Middleware
const authenticateToken = (request, response, next) => {
  const authHeader = request.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return response.status(401).send({
      message: 'Access token required',
    });
  }

  jwt.verify(token, JWT_SECRET, (error, user) => {
    if (error) {
      return response.status(403).send({
        message: 'Invalid token',
      });
    }

    request.user = user;
    next();
  });
};

// Protected API
app.get('/protected/', authenticateToken, (request, response) => {
  response.send({
    message: 'Protected API accessed successfully',
    user: request.user,
  });
});

// Start Server
startServer();
