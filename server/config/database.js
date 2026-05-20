// config/database.js
// MySQL connection pool — pre-configured for XAMPP
// XAMPP root user has NO password by default, so DB_PASSWORD is blank

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',   // blank = XAMPP default
  database:           process.env.DB_NAME     || 'face_attendance_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

// Test connection on startup with helpful XAMPP-specific error messages
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully (XAMPP)');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    console.log(`   DB:   ${process.env.DB_NAME || 'face_attendance_db'}`);
    conn.release();
  } catch (err) {
    console.error('\n❌ Database connection failed!');
    console.error('   Error:', err.message);
    console.error('\n🔧 XAMPP Troubleshooting:');
    console.error('   1. Open XAMPP Control Panel — make sure MySQL is STARTED (green)');
    console.error('   2. Open phpMyAdmin → confirm database "face_attendance_db" exists');
    console.error('   3. If you set a MySQL root password, put it in server/.env as DB_PASSWORD=yourpassword');
    console.error('   4. Make sure XAMPP MySQL port is 3306\n');
    process.exit(1);
  }
};

testConnection();

module.exports = pool;
