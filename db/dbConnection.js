const mysql = require("mysql");

let connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "thalg",
  port: "3306",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("DB CONNECTED");
});


module.exports = { connection };