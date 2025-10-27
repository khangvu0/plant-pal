const mysql = require('mysql2/promise');

const pool = mysql.createPool({
host: 'localhost',
user: 'root',
password: 'password', 
database: 'Plant-Pal', 
port: 3306,
connectionLimit: 10
});

async function verifyDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

module.exports = {
  pool,
  verifyDatabaseConnection
};


