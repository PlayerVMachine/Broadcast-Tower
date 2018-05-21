// npm requires
const f = require('util').format
const pc = require('swearjar')

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')

//regex
const nonPrintingChars = new RegExp(/[\x00-\x09\x0B\x0C\x0E-\x1F\u200B]/g)
const matchUserMention = new RegExp('<@[0-9]{18}>')
const matchUserString = new RegExp('^[0-9]{18}')

//check if input is a user id or mention
const isID = (arg) => {
	if (matchUserString.test(arg)) { 
		return arg 
	} else if (matchUserMention.test(arg)) { 
		return arg.substr(2, 18) 
	} else { 
		return -1 
	}
}

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
		let second = await bot.users.get(secondID)
		bot.createMessage(msg.channel.id, f(reply.generic.UserNoAccount, msg.author.username, second.username))
		return false
	}

  //checks passed
  return true
}

exports.follow = async(msg, args, bot, client) => {
	try {
		const col = client.db(config.db).collection('Users')

		//get user data
		let usee = await col.findOne({user: msg.author.id})
		
		//check for undesirable conditions
		let secondID = isID(args[0])
		let safe = await safetyChecks(msg, secondID, col, bot)
		if (!safe)
			return	//something was wrong with the input and the user was told

		//grab the second person's username
		let second = await bot.users.get(secondID)

		//already following
		let isInList = usee.following.includes(secondID)
		if (isInList) {
			bot.createMessage(msg.channel.id, f(reply.follow.already, msg.author.username, second.username))
			let beSure = await col.findOneAndUpdate({user: secondID}, {$addToSet: {following: msg.author.id}})
			return
		}

		//you blocked them!
		let isBlocked = usee.blocked.includes(secondID)
		if (isBlocked) {
			bot.createMessage(msg.channel.id, f(reply.follow.followeeBlocked, msg.author.username, second.username))
			return
		}

		//they blocked you!
		let theyBlocked = await col.findOne({user:secondID, blocked: msg.author.id})
		if (theyBlocked !== null) {
			bot.createMessage(msg.channel.id, f(reply.follow.followeeBlocked, second, msg.author.username))
			return
		}

		//follow a user whose account is private
		let secondUsee = await col.findOne({user: secondID})
		if (secondUsee.private) {
			bot.createMessage(msg.channel.id, f(reply.follow.sent, msg.author.username, second.username))
			let folReq = await bot.createMessage(secondUsee.sendTo, f(reply.follow.request, msg.author.username))
			bot.addMessageReaction(secondUsee.sendTo, folReq.id, '❌')
			bot.addMessageReaction(secondUsee.sendTo, folReq.id, '✅')

			const folRes = async (message, emoji, userID) => {
				if (userID !== secondID)
					return

				if (emoji.name === '❌') {
					bot.editMessage(message.channel.id, folReq.id, f(reply.follow.privDeny, msg.author.username))
					bot.createMessage(usee.sendTo, f(reply.follow.denied, msg.author.username, second.username))
				} else if (emoji.name === '✅') {
					let addToFollowing = await col.findOneAndUpdate({user: msg.author.id}, {$addToSet: {following: secondID}})
					let addToFollowers = await col.findOneAndUpdate({user: secondID}, {$addToSet: {followers: msg.author.id}})
					if (addToFollowers.ok === 1 && addToFollowing.ok) {
						bot.createMessage(usee.sendTo, f(reply.follow.success, msg.author.username, second.username))
						bot.editMessage(message.channel.id, folReq.id, f(reply.follow.privAck, msg.author.username))
					}
				}
				bot.removeListener('messageReactionAdd', folRes)
			}

			bot.on('messageReactionAdd', folRes)
			return
		}

		//follow a user whose account is public
		let addToFollowing = await col.findOneAndUpdate({user: msg.author.id}, {$addToSet: {following: secondID}})
		let addToFollowers = await col.findOneAndUpdate({user: secondID}, {$addToSet: {followers: msg.author.id}})
		if (addToFollowers.ok === 1 && addToFollowing.ok) {
			bot.createMessage(msg.channel.id, f(reply.follow.success, msg.author.username, second.username))
		} else {
			bot.createMessage(msg.channel.id, f(reply.follow.error, msg.author.username, second.username))
		}
	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}

exports.unfollow = async(msg, args, bot, client) => {
	try {
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		
		//check for undesirable conditions
		let secondID = isID(args[0])
		let safe = await safetyChecks(msg, secondID, col, bot)
		if (!safe)
			return	//something was wrong with the input and the user was told

		//grab their username
		let second = bot.users.get(secondID)

		//check if they've been blocked
		let isInBlocked = await col.findOne({user: secondID, blocked: msg.author.id})
		if (isInBlocked !== null) {
			bot.createMessage(msg.channel.id, f(reply.unfollow.blocked, msg.author.username, second.username))
			return
		}

		//is not in list
		let isInList = usee.following.includes(secondID)
		if (!isInList) {
			bot.createMessage(msg.channel.id, f(reply.unfollow.notFollowing, msg.author.username, second.username))
			let beSure = await col.findOneAndUpdate({user: secondID}, {$pull: {followers: msg.author.id}})
			return
		}

		//unfollow
		let remFromFollowing = await col.findOneAndUpdate({user: msg.author.id}, {$pull: {following: secondID}})
		let remFromFollowers = await col.findOneAndUpdate({user: secondID}, {$pull: {followers: msg.author.id}})
		if (remFromFollowers.ok === 1 && remFromFollowing.ok) {
			bot.createMessage(msg.channel.id, f(reply.unfollow.success, msg.author.username, second.username))
		} else {
			bot.createMessage(msg.channel.id, f(reply.unfollow.error, msg.author.username, second.username))
		}
	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}

exports.block = async(msg, args, bot, cleint) => {
	try {
		const col = client.db(config.db).collection('Users')

		let usee = await col.findOne({user: msg.author.id})

		//check for undesirable conditions
		let secondID = isID(args[0])
		let safe = await safetyChecks(msg, secondID, col, bot)
		if (!safe)
			return	//something was wrong with the input and the user was told

		//grab their username
		let second = await bot.users.get(secondID)

		//is in list
		let isInList = usee.blocked.includes(secondID)
		if (isInList) {
			bot.createMessage(msg.channel.id, f(reply.block.already, msg.author.username, second.username))
			let beSure = await col.findOneAndUpdate({user: secondID}, {$pull: {followers: msg.author.id}})
			let beSurex2 = await col.findOneAndUpdate({user: msg.author.id}, {$pull: {following: secondID}})
			return
		}

		//block them
		let blocked = await col.findOneAndUpdate({user: msg.author.id}, {$addToSet: {blocked: secondID}})
		let remFromFollowers = await col.findOneAndUpdate({user: secondID}, {$pull: {followers: msg.author.id, following: msg.author.id}})
		let remFromFollowing = await col.findOneAndUpdate({user: msg.author.id}, {$pull: {following: secondID, followers: secondID}})
		if (blocked.ok === 1 && remFromFollowing.ok === 1 && remFromFollowers.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.block.success, msg.author.username, second.username))
		} else {
			bot.createMessage(msg.channel.id, f(reply.block.error, msg.author.username, second.username))
		}
	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}

exports.unblock = async(msg, args, bot, client) => {
	try {
		const col = client.db(config.db).collection('Users')

		let usee = await col.findOne({user: msg.author.id})

		//check for undesirable conditions
		let secondID = isID(args[0])
		let safe = await safetyChecks(msg, secondID, col, bot)
		if (!safe)
			return	//something was wrong with the input and the user was told

		//grab their username
		let second = await bot.users.get(secondID)

		//is in list
		let isInList = usee.blocked.includes(secondID)
		if (!isInList) {
			bot.createMessage(msg.channel.id, f(reply.unblock.notBlocked, msg.author.username, second.username))
			return
		}

		//unblock them
		let remFromBlocked = await col.findOneAndUpdate({user: msg.author.id}, {$pull: {blocked: secondID}})
		if (remFromBlocked.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.unblock.success, msg.author.username, second.username))
		} else {
			bot.createMessage(msg.channel.id, f(reply.unblock.error, msg.author.username, second.uaername))
		}
	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}

exports.post = async (msg, args, bot, q, client) => {
	try {
		const col = client.db(config.db).collection('Users')
		var medit

		let usee = await col.findOne({user: msg.author.id})

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

		let sender = await col.findOne({user: msg.author.id})
		let followers = sender.followers
		let resChannel = sender.sendTo

		let color = parseInt(config.color, 16)
		if (usee.premium < 0) {
			color = parseInt(usee.eColor, 16)
		}

		let embed = {
    		embed: {
    			title: 'New broadcast from: ' + msg.author.username, // Title of the embed
      			description: message,
      			author: { name: msg.author.username, icon_url: msg.author.avatarURL },
      			color: color,
      			footer: { text: 'Author id: ' + msg.author.id }
    		}
    	}

		const callback = async (message, emoji, userID) => {
			if(userID === msg.author.id &&  emoji.name === '❌') {
				try {
					bot.editMessage(msg.channel.id, remMessage.id, 'transmission cancelled')
				} catch (e) {
					//no message to delete
				}
				bot.removeListener('messageReactionAdd', callback)
				clearTimeout(medit)
			}
		}

		let remMessage = await bot.createMessage(msg.channel.id, 'Your post is scheduled to broadcast in 5s, react with :x: to cancel')
		bot.addMessageReaction(msg.channel.id, remMessage.id, '❌')
		bot.on('messageReactionAdd', callback)

		medit = setTimeout(async (remID) => {
			//remove ability to cancel
			bot.removeListener('messageReactionAdd', callback)
			bot.deleteMessage(msg.channel.id, remID, 'Timeout expired')

			for (i = 0; i < followers.length; i++) {
				let recipient = await col.findOne({user: followers[i]})
				channelID = recipient.sendTo
				q.push({channelID:channelID, msg:embed, recipient:recipient.user})
			}
			if (followers.length > 0)
				q.push({channelID:resChannel, msg:f(reply.post.sentConfirm, message), recipient:''})
		}, 5000, remMessage.id)

	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}

exports.reply = async (msg, args, bot, client) => {
	try {
		const col = client.db(config.db).collection('Users')

		if (args.length === 0) {
			let messages = await msg.channel.getMessages(3)
			bot.createMessage(msg.channel.id, messages[0].id + ' ' + messages[1].id + ' ' + messages[2].id)
			return
		}

		//get a message
		let message = await msg.channel.getMessage(args[0])

		if (message.embeds.length === 0 || message === undefined) {
			bot.createMessage(msg.channel.id, `Sorry either that's not a message id or there's no post in that message.`)
			return
		}

		let senderid = message.embeds[0].footer.text.slice(11)
		let sender = await col.findOne({user:senderid})
		let replyFollowers = sender.followers
		replyFollowers.push(senderid)

		let replyMsg = args.shift()
		let color = parseInt(config.color, 16)
		if (usee.premium < 0) {
			color = parseInt(usee.eColor, 16)
		}

		message = f('**%s**: %s\n', message.embeds[0].author.name, message.embeds[0].description) +
			f('**%s**: %s', msg.author.username, args.join(' '))

		let embed = {
    		embed: {
    			title: 'New reply from: ' + msg.author.username, // Title of the embed
      			description: message,
      			author: { name: msg.author.username, icon_url: msg.author.avatarURL },
      			color: color,
      			footer: { text: 'Author id: ' + msg.author.id  }
    		}
    	}

    	for (i = 0; i < replyFollowers.length; i++) {
				let recipient = await col.findOne({user: replyFollowers[i]})
				channelID = recipient.sendTo
				q.push({channelID:channelID, msg:embed, recipient:recipient.user})
			}
		if (followers.length > 0)
			q.push({channelID:resChannel, msg:f(reply.post.sentConfirm, message), recipient:''})


	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}
