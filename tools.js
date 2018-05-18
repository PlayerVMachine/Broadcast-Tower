// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')
const fns = require('./utilities.js')

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

		let arg = ''
		if(args.length > 0) {
			arg = args[0].toLowerCase()
		}

		let commandList = []
		if (args.length === 0) {
			for (var cmd in bot.commands) {
				if(!bot.commands[cmd].hidden) {
					var name = f(reply.generic.bold, bot.commands[cmd].label.charAt(0).toUpperCase() + bot.commands[cmd].label.slice(1))
					commandList.push(f(reply.help.listFormat, name, bot.commands[cmd].description))
				}
			}

			let embed = {
				embed: {
					author: {name: botUser.username + `'s command list`, icon_url: botUser.avatarURL},
					description: commandList.join('\n'),
					color: parseInt(config.color, 16)
				}
			}

			bot.createMessage(msg.channel.id, embed)

		} else if (cmds.includes(arg)) {
			let aliases = ''
			if (bot.commands[arg].aliases.length > 0)
				aliases = '**Aliases:** ' + bot.commands[arg].aliases.join(', ')
			let cooldown = '**Cooldown:** ' + bot.commands[arg].cooldown / 1000 + 's'
			let subCmds = ''
			
			let list = []
			for (cmd in bot.commands[arg].subcommands)
				list.push(bot.commands[arg].subcommands[cmd].label)
			if (list.length > 0) {
				subCmds = '**Subcommands:** ' + list.join(', ')
				subCmds = subCmds.slice(0, subCmds.length)
			}
			let fullDescription = '**Description:** ' + bot.commands[arg].fullDescription
			let usage = '**Usage:** ' + bot.commands[arg].usage

			let properties = [aliases, cooldown, fullDescription, usage, subCmds]

			let embed = {
				embed: {
					author: {name: botUser.username + `'s ` + arg + ' command', icon_url: botUser.avatarURL},
					description: properties.join('\n'),
					color: parseInt(config.color, 16)
				}
			}

			bot.createMessage(msg.channel.id, embed)

		} else {
			bot.createMessage(msg.channel.id, f(reply.help.unexpected, msg.author.username, args[0]))
		}


	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

exports.clean = async (msg, args, bot) => {
	let dmchannel = await msg.author.getDMChannel();
	if (msg.channel.id !== dmchannel.id) {
		bot.createMessage(msg.channel.id, 'The tower only purges messages in DMs')
		return
	}

	let messages = await msg.channel.getMessages(10);

	let count = 0
	for (i = 0; i < 10; i++) {
		try {
			if(messages[i].author.id !== msg.author.id) {
				msg.channel.deleteMessage(messages[i].id)
				count ++
			}
		} catch (err) {
			console.log(err)
		}
	}

	bot.createMessage(msg.channel.id, f('%s messages were deleted!', count))
}