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

const safetyChecks = async (msg, secondID, col, bot) => {
	
	if (secondID === -1) {
		bot.createMessage(msg.channel.id, f(reply.generic.invalidID, msg.author.username, msg.content.split(' ')[1]))
		return false
	}

	if (secondID === msg.author.id) {
		bot.createMessage(msg.channel.id, f(reply.generic.cannotDoToSelf, msg.author.username))
		return false
	}

	let isBot = await fns.isUserBot(secondID, bot)
	if (isBot){
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
		let isInList = col.findOne({user: msg.author.id, following: secondID})
		if (isInList !== null) {
			bot.createMessage(msg.channel.id, f(reply.follow.already, msg.author.username), second)
			let beSure = await col.findOneAndUpdate({user: userid}, {$addToSet: {following: value}})
			return
		}

		//you blocked them!
		let isBlocked = await col.findOne({user: msg.author.id, blocked: secondID})
		if (isBlocked) {
			bot.createMessage(msg.channel.id, f(reply.follow.followeeBlocked, msg.author.username, second))
			return
		}

		//they blocked you!
		let theyBlocked = await col.findOne({user:secondID, blocked: msg.author.id})
		if (theyBlocked) {
			bot.createMessage(msg.channel.id, f(reply.follow.followeeBlocked, second, msg.author.username))
			return
		}

    	// if not following
    	let addToFollowing = await col.findOneAndUpdate(msg.author.id, 'following', followid)
    	let addToFollowers = await col.findOneAndUpdate(followid, 'followers', msg.author.id)
    	if (addToFollowers.result.ok === 1 && addToFollowing.result.ok) {
    		fns.log(f(reply.follow.logError), bot)
    		bot.createMessage(msg.channel.id, f(reply.follow.success), msg.author.username, second)
    	} else {
    		fns.log(f(reply.general.logError, rem.lastErrorObject), bot)
    		bot.createMessage(msg.channel.id, f())
    	}
    } catch (err) {
    	fns.log(f(reply.generic.logError, err), bot)
    }
}

exports.unfollow = async(msg, bot) => {
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