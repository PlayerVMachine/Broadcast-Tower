//module imports
const Eris = require('eris');
const Queue = require('better-queue');

//project module imports
const config = require('./config.json')
const fns = require('./utilities.js') // useful functions
const db = require('./queries.js') // database queries
const commands = require('./commands.js'); //actual bot commands moduled for tidiness
const nonPrintingChars = new RegExp(/[\x00-\x09\x0B\x0C\x0E-\x1F\u200B]/g)


//comand client
const bot = new Eris.CommandClient(config.BOT_TOKEN, {
	defaultImageSize:256
}, {
	description:'Discord bot providing social media functions',
	name:'Broadcast Tower',
	owner:'PlayerVMachine#6223',
	prefix: ['b.', '🅱']
})

//Define Message queue
var q = new Queue(function (data, cb) {
  bot.createMessage(data.channelID, data.msg)
  cb(null, data.fin)
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
	caseInsensitive:true,
	cooldown: 5000,
	cooldownMessage: 'The Signal is strong, patience is key.',
	description:'No one asks how the bot is only ping',
	usage:'duh'
})

const createAccount = bot.registerCommand('create', async (msg, args) => {
	let hasAccount = await db.userExists(msg.author.id);

	if (hasAccount === 0 ) {	
		commands.create(msg, bot)
	} else if (hasAccount === 1) {
		return 'Woah you already have a broadcast station!'
	} else {
		return msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.'
	}

}, {
	aliases: ['signup', 'join', 'register'],
	cooldown: 10000,
	cooldownMessage: 'The Signal is strong, patience is key.',
	description:'Create an account with the Tower to start broadcasting',
	usage:'b.create'
})

const deleteAccount = bot.registerCommand('close', async (msg, args) => {
	let hasAccount = await db.userExists(msg.author.id);

	if (hasAccount === 1 ) {	
		commands.delete(msg, bot)
	} else if (hasAccount === 0) {
		return `Woah you don't have a broadcast station to close!`
	} else {
		return msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.'
	}

}, {
	aliases: ['delete', 'rm', 'del'],
	cooldown: 10000,
	cooldownMessage: 'The Signal is strong, patience is key.',
	description:'Close your account and end your transmissions',
	usage:'b.close'
})

const followUser = bot.registerCommand('follow', async (msg, args) => {
	let hasAccount = await db.userExists(msg.author.id);
	if (hasAccount === 0)
		return `Woah you don't have a broadcast station!`

	var followid = fns.isID(args[0])
	if (followid === -1)
		return 'Please enter a valid user mention or user id'

	if (followid === msg.author.id)
		return 'Cannot tune into your own boradcasts!'

	let isBot = await fns.isUserBot(followid, bot)
	if (isBot)
		return 'Cannot tune into broadcasts from bots!'

	let followeeHasAccount = await db.userExists(followid);
	if (followeeHasAccount === 0)
		return args[0] + ' does not have a broadcast station!'	

	if (hasAccount === 1 && followeeHasAccount)
		commands.follow(msg, followid ,bot)
	else
		return msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.'

}, {
	aliases: ['fol'],
	argsRequired: true,
	cooldown: 2000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'Follow a user to recieve their broadcasts',
	usage:'b.follow `@user` or b.follow `userid`'
})

const unfollowUser = bot.registerCommand('unfollow', async (msg, args) => {
	let hasAccount = await db.userExists(msg.author.id);
	if (hasAccount === 0)
		return `Woah you don't have a broadcast station!`

	var unfollowid = fns.isID(args[0])
	if (unfollowid === -1)
		return 'Please enter a valid user mention or user id'

	if (unfollowid === msg.author.id)
		return 'Cannot unfollow your self!'

	let isBot = await fns.isUserBot(unfollowid, bot)
	if (isBot)
		return 'Cannot follow/unfollow bots!'

	let unfolloweeHasAccount = await db.userExists(unfollowid);
	if (unfolloweeHasAccount === 0)
		return args[0] + ' does not have a broadcast station!'

	if (hasAccount === 1 && unfolloweeHasAccount === 1)
		commands.unfollow(msg, unfollowid ,bot)
	else
		return msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.'

}, {
	aliases: ['unfol', 'uf'],
	argsRequired: true,
	cooldown: 2000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'Unfollow a user to stop recieving their broadcasts',
	usage:'b.unfollow `@user` or b.unfollow `userid`'
})

const blockUser = bot.registerCommand('block', async (msg, args) => {
	let hasAccount = await db.userExists(msg.author.id);
	if (hasAccount === 0)
		return `Woah you don't have a broadcast station!`

	var blockid = fns.isID(args[0])
	if (blockid === -1)
		return 'Please enter a valid user mention or user id'

	if (blockid === msg.author.id)
		return 'Cannot block your self! Just like your shadow'

	let isBot = await fns.isUserBot(blockid, bot)
	if (isBot)
		return 'Cannot block bots!'

	let blockeeHasAccount = await db.userExists(blockid);
	if (blockeeHasAccount === 0)
		return args[0] + ' does not have a broadcast station!'

	if (hasAccount === 1 && blockeeHasAccount === 1)
		commands.block(msg, blockid ,bot)
	else
		return msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.'

}, {
	aliases: ['bl'],
	argsRequired: true,
	cooldown: 2000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'Block a user to prevent the from recieving your broadcasts and you recieving theirs broadcasts',
	usage:'b.block `@user` or b.block `userid`'
})

const unBlockUser = bot.registerCommand('unblock', async (msg, args) => {
	var unblockid = fns.isID(args[0])
	if (unblockid === -1)
		return 'Please enter a valid user mention or user id'

	if (unblockid === msg.author.id)
		return 'Cannot unblock your self! Just like your shadow'

	let unblockeeHasAccount = await db.userExists(unblockid);
	if (unblockeeHasAccount === 0)
		return args[0] + ' does not have a broadcast station!'

	let isBot = await fns.isUserBot(unblockid, bot)
	if (isBot)
		return 'Cannot unblock bots!'

	let hasAccount = await db.userExists(msg.author.id);

	if (hasAccount === 1 && unblockeeHasAccount === 1) {
		commands.unblock(msg, unblockid ,bot)
	} else if (hasAccount === 0) {
		return `Woah you don't have a broadcast station!`
	} else {
		return msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.'
	}

}, {
	aliases: ['unb'],
	argsRequired:true,
	cooldown: 2000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'unblock a user to follow them/let them follow you',
	usage:'b.block `@user` or b.block `userid`'
})

const editTagline = bot.registerCommand('tagline', async (msg, args) => {
	var text = args.join(' ')
	if (text.length < 140) {
		let setTagline = await commands.setTagline(msg, text, bot)
	} else {
		bot.createMessage(msg.channel.id, 'Sorry your tagline is too long (maximum is 140 characters)')
	}
}, {
	aliases: ['tl'],
	cooldown: 5000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'Allows you to set your profile tagline (maximum 140 characters)',
	usage:'b.tagline text'
})

const editBio = bot.registerCommand('bio', async (msg, args) => {
	var text = args.join(' ')
	if (text.length < 400) {
		let setBio = await commands.setBio(msg, text, bot)
	} else {
		bot.createMessage(msg.channel.id, 'Sorry your bio is too long (maximum is 400 characters)')
	}
}, {
	aliases: ['b'],
	cooldown: 5000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'Allows you to set your profile bio (maximum 400 characters)',
	usage:'b.bio text'
})

const editMature = bot.registerCommand('mature', async (msg, args) => {
	let setMature = await commands.toggleMature(msg, bot)
}, {
	aliases: ['rating', 'm'],
	cooldown: 5000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'Toggle mature setting (off disables most profanity checking)',
	usage:'b.mature'
})

const seeProfile = bot.registerCommand('profile', async (msg, args) => {
	if (args.length === 0)
		var profileID = msg.author.id 
	else
		var profileID = fns.isID(args[0])

	let profile = await commands.viewProfile(msg, profileID, bot)
}, {
	aliases: ['prof', 'pf'],
	cooldown: 20000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'View a users profile or your own',
	usage:'b.profile or b.profile `@user` or `userid`'
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
	} else
		return 'List must be one of: followers, following, blocked'

}, {

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

})

const post = bot.registerCommand('post', async (msg, args) => {
	if(args.length === 0)
		return 'No blank posts plskthx'

	let followers = await db.getFields(msg.author.id, 'followers')
	let resChannel = await db.getFields(msg.author.id, 'sendTo')
	var message = args.join(' ')
	if (nonPrintingChars.test(message))
		return 'Heck off with your non printing characters'

	var post = fns.postEmbed(message, msg.author)

	for (i = 0; i < followers.length; i++) {
		let channelID = await db.getFields(followers[i], 'sendTo')
		if (i !== followers.length - 1) {
			q.push({channelID:channelID, msg:post, fin:''})
		} else {
			q.push({channelID:channelID, msg:post, fin:resChannel}).on('finish', (resChannel) => {
				bot.createMessage(resChannel, 'Sent the following post to your followers: ' + message)
			})
		}
	}
}, {
	aliases: ['cast', 'c'],
	cooldown: 10000,
	cooldownMessage:'The Signal is strong, patience is key.',
	description:'Broadcast a message to your followers.',
	usage:'b.post Follow the signal'
})

//actually connect
bot.connect()