// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const log = require('winston')

// project files required
const config = require('./config.json')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'

// Connection URL
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

exports.createUser = async (userid, dmChannelid) => {
	try {
		let client = await MongoClient.connect(url)

		const col = client.db(config.db).collection('Users')

		const userdata = {
			user: userid,
			status: 'active',
			tagline: '',
			bio: '',
			following: [],
			followers: [],
			blocked: [],
			sendTo: dmChannelid,
			mature: false,
			dnd: false,
			joined: new Date(),
			eColor: config.color,
			premium: false
		}

		let created = await col.insertOne(userdata)
		if (created.insertedCount === 1) {
			client.close()
			log.info('Connection closed')
			return 1
		} else {
			client.close()
			log.info('Connection closed')
			return 0
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

// function to delete User
exports.deleteUser = async (userid) => {
	try {
		let client = await MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let deleted = await col.findOneAndDelete({user: userid})
		if (deleted.ok === 1) {
			client.close()
			log.info('Connection closed')
			return 1
		} else {
			client.close()
			log.info('Connection closed')
			return 0
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

// works for status, tagline, bio, sendTo, mature, dnd, eColor, premium
exports.setField = async (userid, field, value) => {
	try {
		let client = await MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let valSet = await col.findOneAndUpdate({user: userid}, {$set: {[field]: value}})
		if (valSet.ok === 1) {
			client.close()
			log.info('Connection closed')
			return 1
		} else {
			client.close()
			log.info('Connection closed')
			return 0
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

// append to followers, following, blocked
exports.pushUserToList = async (userid, list, value) => {
	try {
		let client = await MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let pushed = await col.findOneAndUpdate({user: userid}, {$addToSet: {[list]: value}})

		if (pushed.ok === 1) {
			client.close()
			log.info('Connection closed')
			return 1
		} else {
			client.close()
			log.info('Connection closed')
			return 0
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

// remove from followers, following, blocked
exports.pullUserFromList = async (userid, list, value) => {
	try {
		let client = await MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let pulled = await col.findOneAndUpdate({user: userid}, {$pull: {[list]: value}})
		if (pulled.ok === 1) {
			client.close()
			log.info('Connection closed')
			return 1
		} else {
			client.close()
			log.info('Connection closed')
			return 0
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

// function to check if user exists
exports.userExists = async (userid) => {
	try {
		let client = await MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: userid})

		if (found === null) {
			client.close()
			log.info('Connection closed')
			return 0
		}
		else {
			client.close()
			log.info('Connection closed')
			return 1
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

// function to check if id is in ffb lists
exports.userInList = async (userid, list, value) => {
	try {
		let client = await MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: userid, [list]: value})
		if (found === null) {
			client.close()
			log.info('Connection closed')
			return false
		} else {
			client.close()
			log.info('Connection closed')
			return true
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

// function to return any document values, can I pass values to the emitter?
exports.getFields = async (userid, field) => {
	try {
		let client = await MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: userid})
		if (userid === found.user) {
			if (field === 'all') {
				return found
			} else {
				return found[field]
			}
		} else {
			return 0
		}
	} catch (e) {
		log.error(e)
		return -1
	}
}

exports.qeval = async (code) => {
	try {
		let client = MongoClient.connect(url)
		log.info('Connected to database')

		const col = client.db(config.db).collection('Users')

		let evaled = await eval(code)

		if (typeof evaled !== 'string') { evaled = require('util').inspect(evaled) }

			client.close()
		log.info('Connection closed')

		return evaled
	} catch (err) {
		return `\`ERROR\` \`\`\`xl\n${err}\n\`\`\``
	}
}
