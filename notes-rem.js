//module imports
const f = require('util').format
const MongoClient = require('mongodb').MongoClient

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

exports.noteToSelf = async (msg, args, bot) => {
	let client = await MongoClient.connect(url)
	const usersCol = client.db(config.db).collection('Users')

	let usee = await usersCol.findOne({user: msg.author.id})
	if (usee === null) {
		bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
		return
	}

	let toPin = await bot.createMessage(usee.sendTo, `Note: ` + args.join(' '), msg.attachments)

	let pinned = await toPin.pin()

	let msgToDel = await toPin.channel.getMessages(1,undefined, toPin.id)

	let deleted = await toPin.channel.deleteMessage(msgToDel[0].id)

	bot.createMessage(msg.channel.id, `Got it boss, note made!`)
}