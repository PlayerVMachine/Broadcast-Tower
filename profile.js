// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const pc = require('swearjar')

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')
const fns = require('./utilities.js')
const uh = require('./updateHandler.js')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

//base edit command
exports.edit = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		let botUser = await bot.getSelf()
		let discUser = await bot.users.get(msg.author.id)

		let embed = uh.editView(usee, discUser, botUser)

		let iprofile = await bot.createMessage(msg.channel.id, embed)

		bot.on('messageCreate', const call = (editMsg) => {
			uh.updateHandler(editMsg, msg, bot, col)
			removeListener('messageCreate', call)
		})

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//base view command
exports.view = async (msg, args, bot) => {

}

//edit tagline - without big edit embed
exports.setTagline = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		//findone and update their tagline

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//view tagline
exports.getTagline = async (msg, args, bot) => {

}