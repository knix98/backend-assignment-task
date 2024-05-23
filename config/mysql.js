const mysql = require('mysql');

// Configure the pool connection details
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
});

// Function to execute a SQL query
function queryDatabase(sql, args) {
  return new Promise((resolve, reject) => {
    pool.query(sql, args, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

module.exports = { db_query: queryDatabase };