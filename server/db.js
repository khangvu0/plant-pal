import mysql from 'mysql2/promise';

// Use Railway DATABASE_URL if available, otherwise fallback to local config
const databaseUrl = process.env.DATABASE_URL;

const db = databaseUrl 
  ? mysql.createPool(databaseUrl)
  : mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'password', 
      database: 'Plant-Pal', 
      port: 3306,
      connectionLimit: 10
    });

async function verifyDatabaseConnection() {
  try {
    const connection = await db.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

export {
  db,
  verifyDatabaseConnection
};


