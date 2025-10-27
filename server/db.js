const mysql = require('mysql2/promise');

const pool = mysql.createPool({
host: 'localhost',
user: 'root',
password: 'password', 
database: 'Plant-Pal', 
port: 3306,
connectionLimit: 10
});

module.exports = pool;
