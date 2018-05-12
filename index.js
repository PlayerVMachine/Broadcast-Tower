//module imports
const Eris = require('eris')
const Queue = require('better-queue')
const util = require('util')

//project module imports
const config = require('./config.json')
const fns = require('./utilities.js') // useful functions
const db = require('./queries.js') // database queries
const commands = require('./commands.js'); //actual bot commands moduled for tidiness
const reply = require('./proto_messages.json')
const amgmt = require('./accountmgmt.js')
const act = require('./actions.js')
const prof = require('./profile.js')

const nonPrintingChars = new RegExp(/[\x00-\x09\x0B\x0C\x0E-\x1F\u200B]/g)


//comand client
const bot = new Eris.CommandClient(config.BOT_TOKEN, {
	defaultImageSize:256
}, {
	defaultHelpCommand: false,
	description:'Discord bot providing social media functions',
	name:'Broadcast Tower',
	owner:'PlayerVMachine#6223',
	prefix: ['b.', '🅱'],
	defaultCommandOptions: {
		cooldownMessage:reply.generic.cooldownMessage
	}
})

//Define Message queue
var q = new Queue(function (data, cb) {
	bot.createMessage(data.channelID, data.msg)
	cb(null, result)
}, {
	afterProcessDelay:1000
})

//ready
bot.on("ready", () => { // When the bot is ready
    console.log("The Tower of Power is online!") // Log "Ready!"
});

////////////////////////
//Bot commands!      //
//////////////////////

const ping = bot.registerCommand('ping', 'Pong!', {
	caseInsensitive: true,
	cooldown: 5000,
	description: reply.ping.description,
	fullDescription: reply.ping.fullDescription,
	usage: reply.ping.usage
})

const createAccount = bot.registerCommand('create', async (msg, args) => {
	//call the function to create an account if one doesn't exist already
	amgmt.create(msg, bot)
}, {
	aliases: ['signup', 'join', 'register'],
	cooldown: 10000,
	description: reply.create.description,
	fullDescription: reply.create.fullDescription,
	usage: reply.create.description
})

const deleteAccount = bot.registerCommand('close', async (msg, args) => {
	//call the function to close an account if one doesn't exist already
	amgmt.close(msg, bot)
}, {
	aliases: ['delete', 'rm', 'del'],
	cooldown: 10000,
	description: reply.close.description,
	fullDescription: reply.close.fullDescription,
	usage: reply.close.usage
})

const followUser = bot.registerCommand('follow', async (msg, args) => { 
	//call function to follow a user
	act.follow(msg, args, bot)
}, {
	aliases: ['fol'],
	argsRequired: true,
	cooldown: 2000,
	description: reply.follow.description,
	fullDescription: reply.follow.fullDescription,
	usage: reply.follow.usage
})

const unfollowUser = bot.registerCommand('unfollow', async (msg, args) => {
	//command to unfollow user
	act.unfollow(msg, args ,bot)
}, {
	aliases: ['unfol', 'uf'],
	argsRequired: true,
	cooldown: 2000,
	description: reply.unfollow.description,
	fullDescription: reply.unfollow.fullDescription,
	usage: reply.unfollow.usage
})

const blockUser = bot.registerCommand('block', async (msg, args) => {
	//block a user
	act.block(msg, args, bot)
}, {
	aliases: ['bl'],
	argsRequired: true,
	cooldown: 2000,
	description: reply.block.description,
	fullDescription: reply.block.fullDescription,
	usage: reply.block.usage
})

const unBlockUser = bot.registerCommand('unblock', async (msg, args) => {
	//unblock a user
	act.unblock(msg, args, bot)
}, {
	aliases: ['unb'],
	argsRequired:true,
	cooldown: 2000,
	description: reply.unblock.description,
	fullDescription: reply.unblock.fullDescription,
	usage:reply.unblock.usage
})

const edit = bot.registerCommand('edit', (msg, args) => {
	prof.edit(msg, edit, bot)
})


const editTagline = edit.registerSubcommand('tagline', async (msg, args) => {
	prof.setTagline(msg, args, bot)
}, {
	aliases: ['tl'],
	cooldown: 5000,
	description: reply.tagline.description,
	fullDescription: reply.tagline.fullDescription,
	usage: reply.tagline.usage
})

const editBio = edit.registerSubcommand('bio', async (msg, args) => {
	prof.setBio(msg, args, bot)
}, {
	aliases: ['b'],
	cooldown: 5000,
	description: reply.bio.description,
	fullDescription: reply.bio.fullDescription,
	usage: reply.bio.usage
})


const editMature = bot.registerCommand('mature', async (msg, args) => {
	let isUser = await fns.userHasAccount(msg, bot)
	if (res) {
		let setMature = await commands.toggleMature(msg, bot)
	}
}, {
	aliases: ['rating', 'm'],
	cooldown: 5000,
	description: reply.mature.description,
	fullDescription: reply.mature.fullDescription,
	usage: reply.mature.usage
})

const seeProfile = bot.registerCommand('profile', async (msg, args) => {
	if (args.length === 0) {
		let isUser = await fns.userHasAccount(msg, bot)
		if (res)
			var profileID = msg.author.id 
	} else {
		let res = await fns.safetyChecks(msg, bot)
		if (res)
			var profileID = fns.isID(args[0])
	}

	let profile = await commands.viewProfile(msg, profileID, bot)
}, {
	aliases: ['prof', 'pf'],
	cooldown: 20000,
	description: reply.profile.description,
	fullDescription: reply.profile.fullDescription,
	usage: reply.profile.usage
})

const list = bot.registerCommand('list', async (msg, args) => {
	var list = args[0].toLowerCase()
	if (list === 'blocked') {
		let userList = await commands.listUsers(msg, list, bot)
		bot.createMessage(msg.channel.id, userList)
	} else if (list === 'followers') {
		let userList = await commands.listUsers(msg, list, bot)
		bot.createMessage(msg.channel.id, userList)
	} else if (list === 'following') {
		let userList = await commands.listUsers(msg, list, bot)
		bot.createMessage(msg.channel.id, userList)
	} else {
		return util.format(reply.list.notAList, msg.author.username)
	}

}, {
	aliases: ['ls', 'li'],
	cooldown: 5000,
	description: reply.list.description,
	fullDescription: reply.list.fullDescription,
	usage: reply.list.usage
})

const clearDMs = bot.registerCommand('clean', async (msg, args) => {
	let dmchannel = await msg.author.getDMChannel();
	if (msg.channel.id !== dmchannel.id)
		return 'The tower only purges messages in DMs'

	let messages = await msg.channel.getMessages();

	for (i = 0; i < 50; i++)
		try {
			if(messages[i].author.id !== msg.author.id)
				msg.channel.deleteMessage(messages[i].id)
		} catch (e) {
			console.log(e.message)
		}
	}, {
		aliases: ['cls', 'clear'],
		cooldown: 20000,
		description: reply.clearDMs.description,
		fullDescription: reply.clearDMs.fullDescription,
		usage: reply.clearDMs.usage
	})

const post = bot.registerCommand('post', async (msg, args) => {
	//function to send posts
	act.post(msg, args, bot, q)
}, {
	aliases: ['cast', 'send'],
	cooldown: 5000,
	description: reply.post.description,
	fullDescription: reply.post.fullDescription,
	usage: reply.post.usage
})

const bEval = bot.registerCommand('eval', async (msg, args) => {
	commands.beval(msg, args.join(' '), bot)
}, {
	requirements: {
		userIDs: [config.creator]
	},
	hidden: true
})

const help = bot.registerCommand('help', (msg, args) => {
	if (bot.commands[args[0]] !== undefined)
		fns.help(msg, args[0], bot)
	else
		fns.help(msg, 'all', bot)
}, {
	cooldown: 5000,
	description: reply.help.description,
	fullDescription: reply.help.fullDescription,
	usage: reply.help.usage
})

////////////////////////////////////////////////////
//Event Listener for Stream Notification         //
//////////////////////////////////////////////////
/*bot.on('presenceUpdate', async (other, oldPresence) => {
	if (other.id !== undefined) {
		let isUser = await db.userExists(other.id)

		if (isUser) {
			let followers = await db.getFields(other.id, 'followers')
			let resChannel = await db.getFields(other.id, 'sendTo')

			var post = fns.postEmbed('Now playing! ' + other.game.name, other.user)

			for (i = 0; i < followers.length; i++) {
				let channelID = await db.getFields(followers[i], 'sendTo')
				if (i !== followers.length - 1) {
					q.push({channelID:channelID, msg:post, fin:''})
				} else {
					q.push({channelID:channelID, msg:post, fin:resChannel}).on('finish', (resChannel) => {
						//bot.createMessage(resChannel, util.format(reply.post.sentConfirm, message))
					})
				}
			}
		}
	}
})*/


//actually connect
bot.connect()