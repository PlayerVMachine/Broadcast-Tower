//npm requires
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
const url = f('mongodb://%s:%s@192.168.1.210:27017/broadcast_tower?authMechanism=%s', user, password, authMechanism);

//new user query
exports.newUser = (msg, dmChan, bot) => {
	MongoClient.connect(url, (err, client) => {
		try {
			assert.equal(null, err);
			logger.info("Connected to database");

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

						logger.info('User ' + msg.author.id + ' created successfully');
						bot.createMessage(msg.channel.id, 'Your account is all set up! Use `b.edit` to complete your profile!');
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

exports.setTagline = (msg, tagline, bot) => {
	MongoClient.connect(url, (err, client) => {
		try {
			assert.equal(null, err);
			logger.info('Connected to database');

			const col = client.db(config.db).collection('Users');

			col.updateOne({user:msg.author.id}, {$set: {tagline:tagline}}, (err, res) =>{
				try {
					assert.equal(null, err);
					assert.equal(1, res.matchedCount);
					assert.equal(1, res.modifiedCount);

					logger.info('Tagline for ' + msg.author.id + ' updated successfully');
					bot.createMessage(msg.channel.id, 'Tagline updated: ' + tagline);
				} catch (e) {
					logger.error(e);
				}
			});

		} catch (e) {
			logger.error(e);
		}

		client.close();
		logger.info('Connection closed');
	});
}

exports.setBio = (msg, bio, bot) => {
	MongoClient.connect(url, (err, client) => {
		try {
			assert.equal(null, err);
			logger.info('Connected to database');

			const col = client.db(config.db).collection('Users');

			col.updateOne({user:msg.author.id}, {$set: {bio:bio}}, (err, res) =>{
				try {
					assert.equal(null, err);
					assert.equal(1, res.matchedCount);
					assert.equal(1, res.modifiedCount);

					logger.info('Bio for ' + msg.author.id + ' updated successfully');
					bot.createMessage(msg.channel.id, 'Bio updated: ' + bio);
				} catch (e) {
					logger.error(e);
				}
			});

		} catch (e) {
			logger.error(e);
		}

		client.close();
		logger.info('Connection closed');
	});
}

exports.setMature = (msg, flag, bot) => {
	MongoClient.connect(url, (err, client) => {
		try {
			assert.equal(null, err);
			logger.info('Connected to database');

			const col = client.db(config.db).collection('Users');

			col.updateOne({user:msg.author.id}, {$set: {mature:flag}}, (err, res) =>{
				try {
					assert.equal(null, err);
					assert.equal(1, res.matchedCount);
					assert.equal(1, res.modifiedCount);

					logger.info('Mature for ' + msg.author.id + ' updated successfully');
					bot.createMessage(msg.channel.id, 'Mature set to: ' + flag);
				} catch (e) {
					logger.error(e);
				}
			});

		} catch (e) {
			logger.error(e);
		}

		client.close();
		logger.info('Connection closed');
	});
}

exports.setDND = (msg, flag, bot) => {
	MongoClient.connect(url, (err, client) => {
		try {
			assert.equal(null, err);
			logger.info('Connected to database');

			const col = client.db(config.db).collection('Users');

			col.updateOne({user:msg.author.id}, {$set: {dnd:flag}}, (err, res) =>{
				try {
					assert.equal(null, err);
					assert.equal(1, res.matchedCount);
					assert.equal(1, res.modifiedCount);

					logger.info('DND for ' + msg.author.id + ' updated successfully');
					bot.createMessage(msg.channel.id, 'DND set to: ' + flag);
				} catch (e) {
					logger.error(e);
				}
			});

		} catch (e) {
			logger.error(e);
		}

		client.close();
		logger.info('Connection closed');
	});
}

exports.addToFollowing = async (msg, user, bot) => {
	MongoClient.connect(url, async (err, client) => {
		try {
			assert.equal(null, err);
			logger.info('Connected to database');

			const col = client.db(config.db).collection('Users');

			let followed = await col.findOneAndUpdate({user:msg.author.id}, {$addToSet: {following:user}});
			assert.equal(1, followed.ok);

			let added = await col.findOneAndUpdate({user:user}, {$addToSet: {followers:msg.author.id}});
			assert.equal(1, added.ok);

			bot.createMessage(msg.channel.id, 'Followed user successfully');
			logger.info(msg.author.id + ' followed ' + user);
		} catch (e) {
			logger.error(e);
		}

		client.close();
		logger.info('Connection closed');
	});
}

exports.unfollow = async (msg, user, bot) => {
	ongoClient.connect(url, async (err, client) => {
		try {
			assert.equal(null, err);
			logger.info('Connected to database');

			const col = client.db(config.db).collection('Users');

			let followed = await col.findOneAndUpdate({user:msg.author.id}, {$pull: {following:user}});
			assert.equal(1, followed.ok);

			let added = await col.findOneAndUpdate({user:user}, {$pull: {followers:msg.author.id}});
			assert.equal(1, added.ok);

			bot.createMessage(msg.channel.id, 'Followed user successfully');
			logger.info(msg.author.id + ' followed ' + user);
		} catch (e) {
			logger.error(e);
		}

		client.close();
		logger.info('Connection closed');
	});
}

exports.blockUser = async (msg, user, bot) => {
	MongoClient.connect(url, async (err, client) => {
		try {
			assert.equal(null, error);
			logger.info('Connected to database');

			const col = client.db(config.db).collection('Users');

			let blocked = await col.findOneAndUpdate({user:msg.author.id}, {$addToSet: {blocked:user}});
			assert.equal(1, blocked.ok);

		} catch (e) {
			logger.error(e);
		}
	});
}