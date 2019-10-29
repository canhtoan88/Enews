const mysql = require('mysql');
const config = require('config');

const connetDB = async (user, password) => {
	const connection = await mysql.createConnection({
		host: config.get('mysql.host'),
		user: user,
		password: password,
		database: config.get('mysql.database')
	})

	connection.connect();
	return connection;
}

module.exports = connetDB;