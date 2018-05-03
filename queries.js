//npm requires
const MongoClient = require('mongodb').MongoClient;
const f = require('util').format;
const assert = require('assert');
const log = require('winston');

//project files required
const config = require('./config.json');

//mongodb login
const user = encodeURIComponent(config.user);
const password = encodeURIComponent(config.pass);
const authMechanism = 'DEFAULT';

// Connection URL
const url = f('mongodb://%s:%s@127.0.0.1:27017/broadcast_tower?authMechanism=%s', user, password, authMechanism);

exports.createUser = async (userid, dmChannel) => {
	try {
		let client = await MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		const doc = { 
			user: userid,
			status: 'active',
			tagline:'',
			bio:'',
			following:[],
			followers:[],
			blocked:[],
			sendTo: dmChannel,
			mature: false,
			dnd: false,
			joined: new Date(),
			eColor: config.color,
			premium: false
		};

		let created = await col.insertOne(doc);
		if (1 === created.insertedCount) {
			client.close();
			log.info('Connection closed');
			return 1;
		} else {
			client.close();
			log.info('Connection closed');
			return 0;
		}

	} catch (e) {
		log.error(e);
		return -1;
	}
}

//function to delete User
exports.deleteUser = async (userid) => {
	try {
		let client = await MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let deleted = await col.findOneAndDelete({user:userid});
		if (1 === deleted.ok) {
			client.close();
			log.info('Connection closed');
			return 1;
		} else {
			client.close();
			log.info('Connection closed');
			return 0;
		}

	} catch (e) {
		log.error(e);
		return -1;
	}
}

//works for status, tagline, bio, sendTo, mature, dnd, eColor, premium
exports.setField = async (userid, field, value) => {
	try {
		let client = MongoClient.connect(url);
		assert.equal(null, err);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let valSet = await col.findOneAndUpdate({user:userid}, {$set: {[field]:value}});
		if (1 === valSet.ok) {
			client.close();
			log.info('Connection closed');
			return 1;
		} else {
			client.close();
			log.info('Connection closed');
			return 0;
		}

	} catch (e) {
		log.error(e);
		emitter.emit(failure);
	}
}

//append to followers, following, blocked
exports.pushUserToList = (userid, list, value) => {
	try {
		let client = MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let pushed = await col.findOneAndUpdate({user:userid}, {$addToSet: {[list]:value}});

		if (1 === pushed.ok) {
			client.close();
			log.info('Connection closed');
			return 1;
		} else {
			client.close();
			log.info('Connection closed');
			return 0;
		}

	} catch (e) {
		log.error(e);
		return -1;
	}
}

//remove from followers, following, blocked
exports.pullUserFromList = (userid, list, value) => {
	try {
		let client = await MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let pulled = await col.findOneAndUpdate({user:userid}, {$pull: {[list]:value}});
		if (1 == pulled.ok) {
			client.close();
			log.info('Connection closed');
			return 1;
		} else {
			client.close();
			log.info('Connection closed');
			return 0;
		}

	} catch (e) {
		log.error(e);
		return -1;
	}
}

//function to check if user exists
exports.userExists = (userid) => {
	try {
		let client = await MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let found = await col.findOne({user:userid});

		if (userid === found.user) {
			client.close();
			log.info('Connection closed');
			return 1;
		} else {
			client.close();
			log.info('Connection closed');
			return 0;
		}

	} catch (e) {
		log.error(e);
		return -1;
	}
}

//function to check if id is in ffb lists
exports.userInList = (userid, list, value) => {
	try {
		let client = await MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let found = await col.findOne({user:userid, [list]:value});
		if (userid === found.user) {
			client.close();
			log.info('Connection closed');
			return 1;
		} else {
			client.close();
			log.info('Connection closed');
			return 0;
		}

	} catch (e) {
		log.error(e);
		return -1;
	}
}

//function to return any document values, can I pass values to the emitter?
exports.getFields = (userid, field, emitter) => {
	try {
		let client = await MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let found = await col.findOne({user:userid});
		if (userid === found.user){
			if (field === 'all')
				return found; //returns an object must call fields
			else
				return found[field];
		} else {
			return 0;
		}

	} catch (e) {
		log.error(e);
		return -1
	}
}

exports.qeval = (code) => {
	try {
		let client = MongoClient.connect(url);
		log.info('Connected to database');

		const col = client.db(config.db).collection('Users');

		let evaled = await eval(code);

		if (typeof evaled !== "string")
			evaled = require("util").inspect(evaled);

		client.close();
		log.info('Connection closed');

		return evaled;
	} catch (err) {
		return `\`ERROR\` \`\`\`xl\n${err}\n\`\`\``;
	}
}