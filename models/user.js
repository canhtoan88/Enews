const mysql = require('mysql');
const config = require('config');

const connection = mysql.createConnection({
	host: config.get('mysql.host'),
	user: config.get('mysql.user'),
	password: config.get('mysql.password'),
	database: config.get('mysql.database')
})

connection.connect();

module.exports = connection;