import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('teamwork.db', (err) => {
  if (err) {
    return console.log(err.message);
  }
  console.log('Connected to database')
});

module.exports = db;