//npm/node requires
const MongoClient = require('mongodb').MongoClient;
const f = require('util').format;
const assert = require('assert');
const logger = require('winston');

//project files required
const config = require('./config.json');
const util = require('./helper.js');

//mongodb login
const user = encodeURIComponent(config.user);
const password = encodeURIComponent(config.pass);
const authMechanism = 'DEFAULT';

// Connection URL
const url = f('mongodb://%s:%s@localhost:27017/broadcast_tower?authMechanism=%s', user, password, authMechanism);

//new user query
exports.newUser = (msg, dmChan, bot) => {
	MongoClient.connect(url, function(err, client) {
		try {
		assert.equal(null, err);
		logger.info("Connected to db");

		const db = client.db(config.db);

		const doc = { 
			user: msg.author.id,
			status: "active",
			tagline:"",
			bio:"",
			following:[],
			followers:[],
			blocked:[],
			sendTo: dmChan,
			mature: false,
			dnd: false,
			joined: new Date(),
			eColor: config.color,
			premium: false};

			db.collection('Users').insertOne(doc, (err, res) => {
				try {
					assert.equal(null, err);
    				assert.equal(1, res.insertedCount);

    				logger.info('User created successfully');
    				bot.createMessage();
    			} catch (e) {
    				logger.error(e);
    			}
			});

		} catch (e) {
			logger.error(e)
		}
		client.close();
		logger.info('Connection closed');
	});
}