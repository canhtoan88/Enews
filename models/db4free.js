const mysql = require('mysql');
const config = require('config');

// For Google Cloud SQL
const connection = mysql.createConnection({
	//socketPath  : '/cloudsql/enews-237900:us-east1:enews-mysql',
	host 		: config.get('mysql.host'),
	user 		: config.get('mysql.user'),
	password 	: config.get('mysql.password'),
	database 	: config.get('mysql.database')
})

connection.connect();

module.exports = connection;