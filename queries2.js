var mysql = require('mysql');
var config = require('./config.json');

//Connect to the db to make queries
function connect () {
	connection = mysql.createConnection({
		host     : config.host,
		user     : config.user,
		password : config.pass,
		database : config.db
	});

	connection.connect((err) => {
		if (err) {
			console.error('error connecting to db: ' + err.stack);
			return;
		}

		console.log('connected as id: ' + connection.threadId);
	});

	return connection;
}

//close connection to the db
function disconnect (connection) {
	connection.end ((err) => {
		if (err) {
			console.error('error disconnecting from db: ' + err.stack);
			return;
		}

		console.log('connection to db closed.'); 
	});
}

//#######################################################################
//Exported Functions
//#######################################################################

//Test queries through discord 
exports.test_query = function (query) {
	//return new Promise ( (resolve, reject) => {
		connection = connect();

		return connection.query(query, (error, results, fields) => {
			if (error) {
				console.log(error);
				//reject(error);
			}

			console.log(query);
			console.log('#####################');
			disconnect(connection);
			return(results)
			//resolve(results);
		});
	//});
}

//create a 'user'
exports.new_user = function (user, sendTo) {
	return new Promise ( (resolve, reject) => {
		connection = connect(); //establish db connection

		state = "active";	//defualt user state on creation
		date = new Date().toISOString().slice(0, 19).replace('T', ' '); //matches SQL DATETIME Format

		//Query string to add a user
		sql = "INSERT INTO Users VALUES ('" + user + "', '" + state + "', '', '', '{}', '{}','" + sendTo + "', '" + date +"')";

		//make query
		connection.query(sql, (error, results, fields) => {
			if (error) { 
				console.log(error.code);
				reject(error)
			}

			console.log(sql);
			console.log('#####################');

			disconnect(connection); //close connections

			resolve(results.affectedRows); //return number of affected rows (expects 1)
		});
	});
}

//Get a property
exports.get = function (column, user, db) {
	return new Promise ( (resolve, reject) => {
		connection = connect();

		if (column === 'all')
			sql = "SELECT * FROM " + db + " WHERE User=" + user;
		else
			sql = "SELECT " + column + " FROM " + db + " WHERE User=" + user;

		connection.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error.code);
				reject(error);
			}

			console.log(sql);
			console.log('###################');

			disconnect(connection);
			resolve(results);
		});
	});
}

//set a property
exports.set = function (column, user, db, value) {
	return new Promise ( (resolve, reject) => {
		connection = connect();

		sql = "UPDATE "+ db + " SET " + column + " = '" + value + "' WHERE User = '" + user + "'";

		connection.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error);
				reject(error);
			}

			console.log(sql);
			console.log('#####################');
			disconnect(connection);

			resolve(results.affectedRows);
		});
	});
}

//remove a user
exports.del_user = function(user) {
	return new Promise ( (resolve, reject) => {
		connection = connect();

		sql = "DELETE FROM Users WHERE User='" + user + "'";

		connection.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error);
				reject(error);
			}

			console.log(sql);
			console.log('#####################');
			disconnect(connection);

			resolve(results.affectedRows);			
		});
	});
}

//add a post from the user
exports.log_post = function (user, post) {
	return new Promise ( (resolve, reject) => {

		date = new Date().toISOString().slice(0, 19).replace('T', ' '); //matches SQL DATETIME Format
		sql = "INSERT INTO Posts VALUES ( '" + user + "', '" + connection.escape(post) + "', '" + date + "')";

		connection.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error);
				reject(error)
			}

			console.log(sql);
			console.log('#####################');
			disconnect(connection);

			resolve(results.affectedRows);
		});
	});
}


//remove a post from a user
exports.del_post = function (post) {
	return new Promise ( (resolve,reject) => {

		sql = "DELETE FROM Posts WHERE Post='" + connection.escape(post) + "'";

		connection.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error);
				reject(error)
			}

			console.log(sql);
			console.log('#####################');
			disconnect(connection);

			resolve(results.affectedRows);
		});
	});
}