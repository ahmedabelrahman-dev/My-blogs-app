# Blog Application with PostgreSQL

A simple blog application built with Node.js, Express, and PostgreSQL.

## Features

- Create, read, and delete blog posts
- PostgreSQL database integration
- EJS templating engine
- Responsive design

## Setup

### Prerequisites

- Node.js installed
- PostgreSQL installed and running

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blog_app
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3000
```

3. Setup the database:

```bash
npm run setup-db
```

4. Start the application:

```bash
npm start
```

The application will be available at `http://localhost:3000`
