const mysql = require('mysql');
const config = require('config');

// For Google Cloud SQL
const connection = mysql.createConnection({
	//socketPath  : '/cloudsql/enews-237900:us-east1:enews-mysql',
	host 		: config.get('mysqlLocal.host'),
	user 		: config.get('mysqlLocal.user'),
	password 	: config.get('mysqlLocal.password'),
	database 	: config.get('mysqlLocal.database')
})

connection.connect();

module.exports = connection;