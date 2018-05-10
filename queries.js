// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format

// project files required
const config = require('./config.json')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'

// Connection URL
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

// works for status, tagline, bio, sendTo, mature, dnd, eColor, premium
exports.setField = async (userid, field, value) => {
	try {
		let client = await MongoClient.connect(url)

		const col = client.db(config.db).collection('Users')

		let valSet = await col.findOneAndUpdate({user: userid}, {$set: {[field]: value}})
		if (valSet.ok === 1) {
			client.close()
			return 1
		} else {
			client.close()
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

		const col = client.db(config.db).collection('Users')

		let pushed = await col.findOneAndUpdate({user: userid}, {$addToSet: {[list]: value}})

		if (pushed.ok === 1) {
			client.close()
			return 1
		} else {
			client.close()
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

		const col = client.db(config.db).collection('Users')

		let pulled = await col.findOneAndUpdate({user: userid}, {$pull: {[list]: value}})
		if (pulled.ok === 1) {
			client.close()
			return 1
		} else {
			client.close()
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

		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: userid})

		if (found === null) {
			client.close()
			return false
		}
		else {
			client.close()
			return true
		}
	} catch (e) {
		log.error(e)
		return false
	}
}

// function to check if id is in ffb lists
exports.userInList = async (userid, list, value) => {
	try {
		let client = await MongoClient.connect(url)

		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: userid, [list]: value})
		if (found === null) {
			client.close()
			return false
		} else {
			client.close()
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

		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: userid})
		if (userid === found.user) {
			if (field === 'all') {
				client.close()
				return found
			} else {
				client.close()
				return found[field]
			}
		} else {
			client.close()
			return 0
		}
	} catch (e) {
		client.close()
		log.error(e)
		return -1
	}
}

exports.qeval = async (code) => {
	try {
		let client = MongoClient.connect(url)

		const col = client.db(config.db).collection('Users')

		let evaled = await eval(code)

		if (typeof evaled !== 'string') { 
			evaled = require('util').inspect(evaled)
		}

		client.close()

		return evaled
	} catch (err) {
		client.close()
		return `\`ERROR\` \`\`\`xl\n${err}\n\`\`\``
	}
}
