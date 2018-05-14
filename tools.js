// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)


exports.help = (msg, args, bot) {
	try {
		//let cmds = []
		//for (var cmd in bot.commands)

		bot.createMessage(msg.channel.id, )

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}