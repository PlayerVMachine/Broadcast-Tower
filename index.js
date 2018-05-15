//module imports
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const Eris = require('eris')
const Queue = require('better-queue')
const util = require('util')
const express = require('express')
const bodyParser = require('body-parser')

//project module imports
const config = require('./config.json')
const fns = require('./utilities.js') // useful functions
const reply = require('./proto_messages.json')
const amgmt = require('./accountmgmt.js')
const act = require('./actions.js')
const prof = require('./profile.js')
const tools = require('./tools.js')
const twitch = require('./twitch-handler.js')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

//express app
const app = express()

const nonPrintingChars = new RegExp(/[\x00-\x09\x0B\x0C\x0E-\x1F\u200B]/g)

//cd function
const delAfterCD = (message) => {
	setTimeout(async (message) => {
		let messages = await bot.getMessages(message.channel.id,5,undefined,message.id)
		for (var msg in messages) {
			if (messages[msg].content === f(reply.generic.cooldownMessage, message.command.cooldown/1000))
				bot.deleteMessage(messages[msg].channel.id, messages[msg].id, 'timeout expired')
		}
	}, 2000, message)
	return f(reply.generic.cooldownMessage, message.command.cooldown/1000)
}

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
		cooldownMessage: delAfterCD
	}
})

//
var longQ

//Define Message queue
const q = new Queue(async function (data, cb) {
	//db connection
	let client = await MongoClient.connect(url)
	const col = client.db(config.db).collection('Users')

	//get recipient
	let user = await col.findOne({user: data.recipient})
	if(user === null) {
		bot.createMessage(data.channelID, data.msg)
		cb(null)
	} else if (user.dnd) {
		longQ.push(data)
		cb(null)
	} else if (!user.dnd) {
		bot.createMessage(data.channelID, data.msg)
		cb(null)
	}
}, {
	afterProcessDelay:1000
})

//put messages that hit dnd here to wait a long time
longQ = new Queue(function (data, cb) {
	q.push(data)
	cb(null)
}, {
	afterProcessDelay:1800000 //30 minutes
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
	usage: reply.create.usage
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
	//edit
	prof.edit(msg, edit, bot)
}, {
	cooldown: 2000,
	description: 'todo',
	fullDescription: 'todo',
	usage:'todo'
})


const editTagline = edit.registerSubcommand('tagline', async (msg, args) => {
	//
	prof.setTagline(msg, args, bot)
}, {
	aliases: ['-t'],
	cooldown: 5000,
	description: reply.tagline.description,
	fullDescription: reply.tagline.fullDescription,
	usage: reply.tagline.usage
})

const editBio = edit.registerSubcommand('bio', async (msg, args) => {
	//
	prof.setBio(msg, args, bot)
}, {
	aliases: ['-b'],
	cooldown: 5000,
	description: reply.bio.description,
	fullDescription: reply.bio.fullDescription,
	usage: reply.bio.usage
})

const editMature = edit.registerSubcommand('mature', async (msg, args) => {
	//
	prof.setMature(msg, args, bot)
}, {
	aliases: ['-m'],
	cooldown: 5000,
	description: reply.mature.description,
	fullDescription: reply.mature.fullDescription,
	usage: reply.mature.usage
})

const editDND = edit.registerSubcommand('dnd', async (msg, args) => {
	//
	prof.setDND(msg, args, bot)
}, {
	aliases: ['-d'],
	cooldown: 5000,
	description: reply.dnd.description,
	fullDescription: reply.dnd.fullDescription,
	usage: reply.dnd.usage
})

const editColor = edit.registerSubcommand('color', async (msg, args) => {
	//
	prof.setColor(msg, args, bot)
}, {
	aliases: ['-c'],
	cooldown: 2000,
	description: reply.color.description,
	fullDescription: reply.color.fullDescription,
	usage: reply.color.usage
})

const editPrivate = edit.registerSubcommand('private', async (msg, args) => {
	//
	prof.setPrivate(msg, args, bot)
}, {
	aliases: ['-p'],
	cooldown: 2000,
	description: reply.private.description,
	fullDescription: reply.private.fullDescription,
	usage: reply.private.usage
})

const view = bot.registerCommand('view', async (msg, args) => {
	//
	prof.view(msg, args, bot)
}, {
	aliases: ['profile', 'vw'],
	cooldown: 5000,
	description: reply.view.description,
	fullDescription: reply.view.fullDescription,
	usage: reply.view.usage
})

const list = bot.registerCommand('list', async (msg, args) => {
	//
	prof.list(msg, args, bot)
}, {
	aliases: ['ls', 'li'],
	cooldown: 2000,
	description: reply.list.description,
	fullDescription: reply.list.fullDescription,
	usage: reply.list.usage
})

const clearDMs = bot.registerCommand('clean', async (msg, args) => {
	//
	tools.clean(msg, args, bot)
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

const help = bot.registerCommand('help', (msg, args) => {
	//
	tools.help(msg, args, bot)
}, {
	cooldown: 5000,
	description: reply.help.description,
	fullDescription: reply.help.fullDescription,
	usage: reply.help.usage
})

const twitchSub = bot.registerCommand('tsub', async (msg, args) => {
	twitch.twitchStreamSub(msg, args, bot)
})

const twitchUnSub = bot.registerCommand('tunsub', async (msg, args) => {
	twitch.twitchStreamUnSub(msg, args, bot)
})


////////////////////////////////////////////////////////////////////
//EXPRESS WEBHOOK HANDLER                                        //
//////////////////////////////////////////////////////////////////

// parse application/json
var jsonParser = bodyParser.json()

//reply with the challenge to confirm subscription
app.get('/twitch', jsonParser, (req, res) => {
	console.log('challenge accepted')
	if(req.query['hub.challenge'] != null)
		res.status(200).send(req.query['hub.challenge'])
})

//dm users that are following
app.post('/twitch', jsonParser, async (req, res) => {
	let client = await MongoClient.connect(url)
	const twitchCol = client.db(config.db).collection('TwitchStream') //DB in form of twitch streamid, usersSubbed
	const usersCol = client.db(config.db).collection('Users') //Tower's users
	console.log('we recieved a POST')
	//get the stream data
	if (req.body.data.length !== 0) {
		console.log('the length was not 0')
		let streamData = req.body.data[0]
		let streamer = await twitchApi.getTwitchUserById(streamData.id)
		let streamSubList = await twitchCol.findOne({StreamerID: streamer.id})
		let thumbnailURL = streamData.thumbnail_url.replace('{width}', '256').replace('{height}', '256')

		let embed = {
			embed: {
				description: '**Title:** ' + streamData.title,
				color: parseInt('0x6441A4', 16),
				url: f('[Check out the stream!](https://www.twitch.tv/%s)', streamer.display_name),
				author: {name: 'Twitch Stream Notification', icon_url: 'https://www.twitch.tv/p/assets/uploads/glitch_474x356.png'},
				thumbnail: {url:thumbnailURL, height:256, width:256},
				footer: {text:'Part of the Broadcast Tower Integration Network'}
			}
		}

		console.log(embed)
		
		for (var usr in streamSubList.followers) {
			let user = await usersCol.findOne({_id:streamSubList.followers[usr]})
			q.push({channelID:user.sendTo, msg:embed, recipient:user.user})
		}
	}
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))



//actually connect
bot.connect()