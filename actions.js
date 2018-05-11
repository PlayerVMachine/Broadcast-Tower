// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const pc = require('swearjar')

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')
const fns = require('./utilities.js')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

//regex
const nonPrintingChars = new RegExp(/[\x00-\x09\x0B\x0C\x0E-\x1F\u200B]/g)
const cancel = new RegExp('^[aceln]*[^abdf-kmo-z]\\b', 'i')


const safetyChecks = async (msg, secondID, col, bot) => {
	
	if (secondID === -1) {
		bot.createMessage(msg.channel.id, f(reply.generic.invalidID, msg.author.username, msg.content.split(' ')[1]))
		return false
	}

	if (secondID === msg.author.id) {
		bot.createMessage(msg.channel.id, f(reply.generic.cannotDoToSelf, msg.author.username))
		return false
	}

	let isBot = await bot.users.get(secondID)
	if (isBot === undefined) {
		bot.createMessage(msg.channel.id, f(reply.generic.userUnknown, msg.author.username, msg.content.split(' ')[1]))
		return false
	} else if (isBot.bot){
		bot.createMessage(msg.channel.id, f(reply.generic.cannotDoToBots, msg.author.username))
		return false
	}

	let followeeHasAccount = await col.findOne({user: secondID})

	if (followeeHasAccount === 0) {
		let secondUsername = await fns.getUsername(secondID, bot)
		bot.createMessage(msg.channel.id, f(reply.generic.UserNoAccount, msg.author.username, secondUsername))
		return false
	}

  //checks passed
  return true
}

exports.follow = async(msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let found = await col.findOne({user: msg.author.id})
		if (found === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}
		
		//check for undesirable conditions
		let secondID = fns.isID(args[0])
		let safe = await safetyChecks(msg, secondID, col, bot)
		if (!safe)
			return	//something was wrong with the input and the user was told

		//grab their username
		let second = await fns.getUsername(secondID, bot)

		//already following
		let isInList = await col.findOne({user: msg.author.id, following: secondID})
		if (isInList !== null) {
			bot.createMessage(msg.channel.id, f(reply.follow.already, msg.author.username, second))
			let beSure = await col.findOneAndUpdate({user: secondID}, {$addToSet: {following: msg.author.id}})
			return
		}

		//you blocked them!
		let isBlocked = await col.findOne({user: msg.author.id, blocked: secondID})
		if (isBlocked !== null) {
			bot.createMessage(msg.channel.id, f(reply.follow.followeeBlocked, msg.author.username, second))
			return
		}

		//they blocked you!
		let theyBlocked = await col.findOne({user:secondID, blocked: msg.author.id})
		if (theyBlocked !== null) {
			bot.createMessage(msg.channel.id, f(reply.follow.followeeBlocked, second, msg.author.username))
			return
		}

    	// if not following
    	let addToFollowing = await col.findOneAndUpdate({user: msg.author.id}, {$addToSet: {following: secondID}})
    	let addToFollowers = await col.findOneAndUpdate({user: secondID}, {$addToSet: {followers: msg.author.id}})
    	if (addToFollowers.ok === 1 && addToFollowing.ok) {
    		bot.createMessage(msg.channel.id, f(reply.follow.success, msg.author.username, second))
    	} else {
    		fns.log(f(reply.general.logError, addToFollowers.lastErrorObject), bot)
    		fns.log(f(reply.general.logError, addToFollowing.lastErrorObject), bot)
    		bot.createMessage(msg.channel.id, f(reply.follow.error, msg.author.username, second))
    	}
    } catch (err) {
    	fns.log(f(reply.generic.logError, err), bot)
    }
}

exports.unfollow = async(msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let found = await col.findOne({user: msg.author.id})
		if (found === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}
		
		//check for undesirable conditions
		let secondID = fns.isID(args[0])
		let safe = await safetyChecks(msg, secondID, col, bot)
		if (!safe)
			return	//something was wrong with the input and the user was told

		//grab their username
		let second = await fns.getUsername(secondID, bot)

		//is not in list
		let isInList = await col.findOne({user: msg.author.id, following: secondID})
		if (isInList === null) {
			bot.createMessage(msg.channel.id, f(reply.unfollow.notFollowing, msg.author.username, second))
			let beSure = await col.findOneAndUpdate({user: secondID}, {$pull: {followers: msg.author.username}})
			return
		}

		//unfollow
		let remFromFollowing = await col.findOneAndUpdate({user: msg.author.id}, {$pull: {following: secondID}})
		let remFromFollowers = await col.findOneAndUpdate({user: secondID}, {$pull: {followers: msg.author.id}})
		if (remFromFollowers.ok === 1 && remFromFollowing.ok) {
			bot.createMessage(msg.channel.id, f(reply.unfollow.success, msg.author.username, second))
		} else {
			fns.log(f(reply.general.logError, remFromFollowing.lastErrorObject), bot)
			fns.log(f(reply.general.logError, remFromFollowers.lastErrorObject), bot)
			bot.createMessage(msg.channel.id, f(reply.unfollow.error, msg.author.username, second))
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

exports.block = async(msg, bot) => {
	try {
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: msg.author.id})

		if (found === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
		} else {

		}
	} catch (err) {

	}
}

exports.unblock = async(msg, bot) => {
	try {
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		let found = await col.findOne({user: msg.author.id})

		if (found === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
		} else {

		}
	} catch (err) {

	}
}

exports.post = async (msg, args, bot, q) => {
	let client = await MongoClient.connect(url)
	const col = client.db(config.db).collection('Users')
	var medit

	//check is usee is a user
	let found = await col.findOne({user: msg.author.id})
	if (found === null) {
		bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
		return
	}

	//no blank posts
	if(args.length === 0) {
		bot.createMessage(msg.channel.id, f(reply.post.noBlankPost, msg.author.username))
		return
	}

	//no non-printing characters
	let message = args.join(' ')
	if (nonPrintingChars.test(message)) {
		bot.createMessage(msg.channel.id, f(reply.post.noNonPrinting, msg.author.username))
		return
	}

	//swearjar
	let isRude = pc.profane(message)
	if (isRude) {
		bot.createMessage(msg.channel.id, f(reply.post.noProfanity, msg.author.username))
		return
	}

	let sender = await col.findOne({user: msg.author.id})
	let followers = sender.followers
	let resChannel = sender.sendTo

	let post = fns.postEmbed(message, msg.author)

	let remMessage = await bot.createMessage(msg.channel.id, 'Your post is scheduled to broadcast in 5s, type `cancel` to cancel transmission')
	bot.on('messageCreated', callback = async (message) => {
		if(message.author.id === msg.author.id && cancel.test(message.content)) {
			bot.editMessage(msg.channel.id, remMessage.id, 'transmission cancelled')
			bot.removeListener('messageCreated', callback)
			clearTimeout(medit)
			return 
		}
	})

	medit = setTimeout(async (remID) => {
		bot.removeListener('messageCreated', callback)
		bot.deleteMessage(msg.channelID, remID, 'Timeout expired')
		for (i = 0; i < followers.length; i++) {
			let recipient = await col.findOne({user: followers[i]})
			channelID = recipient.sendTo
			q.push({channelID:channelID, msg:post})
		}
		if (followers.length > 0)
			q.push({channelID:resChannel, msg:f(reply.post.sentConfirm, message)})
	}, 5000, remMessage.id)
}
