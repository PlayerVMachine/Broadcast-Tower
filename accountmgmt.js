// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const util = require('util')

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')
const fns = require('./utilities.js')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'

const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

exports.create = async (msg, bot) => {
	try {
		
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: userid})
		if (found === null) {

			let dmChannel = await msg.author.getDMChannel()

			const userdata = {
				user: msg.author.id,
				status: 'active',
				tagline: '',
				bio: '',
				following: [],
				followers: [],
				blocked: [],
				sendTo: dmChannel.id,
				private: false,
				mature: false,
				dnd: false,
				joined: new Date(),
				eColor: config.color,
				premium: false
			}

			let created = await co.insertOne(userdata)

			if (created.insertedCount === 1) { 
				bot.createMessage(msg.channel.id, util.format(reply.create.accountCreated, msg.author.username))
				fns.log(util.format(reply.create.logSuccess, msg.author.mention), bot)
			} else { 
				bot.createMessage(msg.channel.id, util.format(reply.create.accountNotCreated, msg.author.username))
				fns.log(util.format(reply.create.logError, msg.author.mention), bot)
			}
		} else {
			bot.createMessage(msg.channel.id, util.format(reply.create.alreadyHasAccount, msg.author.username))
		}

	} catch (err) {
		fns.log(`\`\`\`diff\n-` + err + `\`\`\``, bot)
	}
}

exports.delete = async (msg, bot) => {
	try {

	} catch (err) {
		fns.log(`\`\`\`diff\n-` + err + `\`\`\``, bot)
	}
}