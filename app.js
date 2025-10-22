import express from "express";
import bodyParser from "body-parser";
import pkg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pkg;

// express app
const app = express();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blog_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// register view engine
app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.redirect('/blogs');
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

// blog routes
app.get('/blogs/create', (req, res) => {
  res.render('create', { title: 'Create a new blog' });
});

app.get('/blogs', (req, res) => {
  const query = 'SELECT * FROM blogs ORDER BY created_at DESC';
  
  pool.query(query)
    .then(result => {
      res.render('index', { blogs: result.rows, title: 'All blogs' });
    })
    .catch(err => {
      console.error('Error fetching blogs:', err);
      res.status(500).send('Error fetching blogs');
    });
});

app.post('/blogs', (req, res) => {
  const { title, snippet, body } = req.body;
  const query = 'INSERT INTO blogs (title, snippet, body) VALUES ($1, $2, $3) RETURNING *';
  
  pool.query(query, [title, snippet, body])
    .then(result => {
      res.redirect('/blogs');
    })
    .catch(err => {
      console.error('Error creating blog:', err);
      res.status(500).send('Error creating blog');
    });
});

app.get('/blogs/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM blogs WHERE id = $1';
  
  pool.query(query, [id])
    .then(result => {
      if (result.rows.length === 0) {
        res.status(404).render('404', { title: '404' });
      } else {
        res.render('detail', { blog: result.rows[0], title: 'blog details' });
      }
    })
    .catch(err => {
      console.error('Error fetching blog:', err);
      res.status(500).send('Error fetching blog');
    });
});

app.delete('/blogs/:id', (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM blogs WHERE id = $1';
  
  pool.query(query, [id])
    .then(result => {
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Blog not found' });
      } else {
        res.json({ redirect: '/blogs' });
      }
    })
    .catch(err => {
      console.error('Error deleting blog:', err);
      res.status(500).json({ error: 'Error deleting blog' });
    });
});

// 404 page
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  pool.end(() => {
    console.log('Database connection pool closed');
    process.exit(0);
  });
});