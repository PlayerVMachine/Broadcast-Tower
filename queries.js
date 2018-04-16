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

exports.test_query = function (query) {
	return new Promise ( (resolve, reject) => {
		connection = connect();

		connection.query(query, (error, results, fields) => {
			if (error) {
				console.log(error);
				reject(error);
			}

			console.log(results);
			console.log('#####################');
			disconnect(connection);

			resolve(results);
		});
	});
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

			console.log(results);
			console.log('#####################');

			disconnect(connection); //close connections

			resolve(results.affectedRows); //return number of affected rows (expects 1)
		});
	});
}

//Used to check if a user exists/return their full data
exports.get_user = function (user) {
	return new Promise ( (resolve, reject) => {
		connection = connect();

		sql = "SELECT * FROM Users WHERE User=" + user;

		connection.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error.code);
				reject(error);
			}

			console.log(results);
			console.log('###################');

			disconnect(connection);
			resolve(results);
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

			console.log(results);
			console.log('#####################');
			disconnect(connection);

			resolve(results.affectedRows);			
		});
	});
}

//set the channel to send posts to
exports.set_sendTo = function (user, sendTo) {
	return new Promise ( (resolve, reject) => {
		connection = connect();

		sql = "UPDATE Users SET SendTo = '" + sendTo + "' WHERE User = '" + user + "'";

		connection.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error);
				reject(error);
			}

			console.log(results);
			console.log('#####################');
			disconnect(connection);

			resolve(results.affectedRows);
		});
	});
}

//Get the user's sendTo channel
exports.get_sendTo = function (user) {

	sql = "SELECT SendTo FROM Users WHERE User='" + user + "'";

	sendTo = connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);

		return results;
	});

	return sendTo;
}


//change user's state
//possible states: active, banned, disabled, do-not-disturb, private
exports.set_state = function (user, state) {
	
	sql = "UPDATE Users SET State = '" + state + "' WHERE User = " + user;

	connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);
	});
}

//Get the user's profile
exports.get_state = function (user) {

	sql = "SELECT State FROM Users WHERE User='" + user + "'";

	state = connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);

		return results;
	});

	return state;
}


//update a user's tagline
exports.set_profile = function (user, tagline) {
	
	sql = "UPDATE Users SET Tagline = '" + connection.escape(tagline) + "' WHERE User = " + user;

	connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);
	});
}

//Get the user's tagline
exports.get_tagline = function (user) {

	sql = "SELECT Tagline FROM Users WHERE User='" + user + "'";

	tagline = connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);

		return results;
	});

	return tagline;
}


//update a user's profile
exports.set_profile = function (user, profile) {
	
	sql = "UPDATE Users SET Profile = '" + connection.escape(profile) + "' WHERE User = " + user;

	connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);
	});
}

//Get the user's profile
exports.get_profile = function (user) {

	sql = "SELECT Profile FROM Users WHERE User='" + user + "'";

	profile = connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);

		return results;
	});

	return profile;
}

//add a post from the user
exports.log_post = function (user, post) {
	
	date = new Date();
	sql = "INSERT INTO Posts VALUES ( '" + user + "', '" + connection.escape(post) + "', '" + date + "')";

	connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);
	});
}


//remove a post from a user
exports.del_post = function (post) {

	sql = "DELETE FROM Posts WHERE Post='" + connection.escape(post) + "'";

	connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);
	});
}

//Get the  list of users the user is following
exports.get_following = function (user) {

	sql = "SELECT Following FROM Users WHERE User='" + user + "'";

	following = connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);

		return results;
	});

	return following;
}

//Get the  list of users following the user
exports.get_followers = function (user) {

	sql = "SELECT Followers FROM Users WHERE User='" + user + "'";

	followers = connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);

		return results;
	});

	return followers;
}

//Set the  list of users the user is following
exports.set_following = function (user, following) {

	sql = "UPDATE Users SET Following ='" + following + "' WHERE User ='" + user + "'";

	connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);
	});
}

//Set the  list of users following the user
exports.set_followers = function (user, followers) {

	sql = "UPDATE Users SET Followers ='" + followers + "' WHERE User ='" + user + "'";

	connection.query(sql, (error, results, fields) => {
		if (error) console.log(error);

		console.log(results);
		console.log('---------------------');
		console.log(fields);
	});
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

