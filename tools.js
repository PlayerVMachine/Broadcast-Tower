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


exports.help = async (msg, args, bot) => {
	try {
		let cmds = []
		for (var cmd in bot.commands) {
			if (!bot.commands[cmd].hidden)
				cmds.push(bot.commands[cmd].label)
		}

		let botUser = await bot.getSelf()

		let commandList = []
		if (args.length === 0) {
			for (var cmd in bot.commands) {
				var name = f(reply.generic.bold, bot.commands[cmd].label.charAt(0).toUpperCase + bot.commands[cmd].label.slice(1))
				commandList.push(f(reply.help.listFormat, name, bot.commands[cmd].description))
			}

			let embed = {
				embed: {
					author: {name: botUser.username + `'s command list`, icon_url: botUser.avatarURL},
					description: commandList.join('\n'),
					color: parseInt(config.color, 16)
				}
			}

			bot.createMessage(msg.channel.id, embed)
		}


	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}