const mysql = require('mysql');
const config = require('config');

/*const connection = mysql.createConnection({
	user: process.env.SQL_USER,
  	password: process.env.SQL_PASSWORD,
  	database: process.env.SQL_DATABASE
})
	
if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {
  	config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
}*/

const connection = mysql.createConnection({
	socketPath  : '/cloudsql/enews-237900:us-east1:enews-mysql',
	host 		: config.get('mysql.host'),
	user 		: config.get('mysql.user'),
	password 	: config.get('mysql.password'),
	database 	: config.get('mysql.database')
})

connection.connect();

module.exports = connection;