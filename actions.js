// npm requires
const f = require('util').format
const pc = require('swearjar')
const crypto = require('crypto')

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

exports.block = async(msg, args, bot, client) => {
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
		const postCol = client.db(config).collection('Posts')
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

		//msg id for searching
		let rndBytes = crypto.randomBytes(4)
		let msgid = rndBytes.toString('hex')

		let embed = {
    		embed: {
    			title: 'New broadcast from: ' + msg.author.username, // Title of the embed
      			description: message,
      			author: { name: msg.author.username, icon_url: msg.author.avatarURL },
      			color: color,
      			footer: { text: 'Author id: ' + msg.author.id + ' message id: ' + msgid}
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

			let recordPost = await postCol.insertOne({
					source: msg.author.id,
    				content: embed,
    				msgid: msgid
    				recipients: usee.followers,
    				lastUpdated: new Date()
    			})

			for (i = 0; i < followers.length; i++) {
				let recipient = await col.findOne({user: followers[i]})

				let packet = {
    				content: embed,
    				destination: recipient.sendTo,
    				source: msg.author.id,
    				type: 'post',
				}

				q.push(packet)
			}
			if (followers.length > 0) {

				let packet = {
    				content: f(reply.post.sentConfirm, message),
    				destination: usee.sendTo,
    				type: 'system',
				}				

				q.push(packet)
			}
		}, 5000, remMessage.id)

	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}

exports.reply = async (msg, args, bot, q, client) => {
	try {
		const col = client.db(config.db).collection('Users')
		
		let usee = await col.findOne({user: msg.author.id})

		//get a message
		let message = undefined
		let messages = await msg.channel.getMessages(50, msg.id)
		for (i in messages) {
			if (messages[i].embeds.length > 0) {
				if (messages[i].embeds[0].footer !== undefined) {
					let foot = messages[i].embeds[0].footer.text.split(' ')
					if(foot.includes(args[0])) {
						message = messages[i]
						break
					}
				}
			}
		}

		if (message === undefined) {
			bot.createMessage(msg.channel.id, reply.reply.notMsg)
			return
		}

		let foot = messages[i].embeds[0].footer.text.split(' ')
		let senderid = foot[2]
		let sender = await col.findOne({user:senderid})

		if (sender.blocked.includes(usee.user)) {
			bot.createMessage(msg.channel.id, reply.reply.theyBlocked)
			return
		}

		if (usee.blocked.includes(sender.user)) {
			bot.createMessage(msg.channel.id, reply.reply.youBlocked)
			return
		}

		if (!sender.followers.includes(usee.user)) {
			bot.createMessage(msg.channel.id, reply.reply.notFollowed)
			return			
		}
		
		let replyFollowers = sender.followers
		replyFollowers.push(senderid)

		let replyMsg = args.shift()
		let color = parseInt(config.color, 16)
		if (usee.premium < 0) {
			color = parseInt(usee.eColor, 16)
		}

		if (message.embeds[0].description.indexOf(message.embeds[0].author.name) !== -1) {
			replyMessage = f('%s\n', message.embeds[0].description) +
				f('**%s**: %s', msg.author.username, args.join(' '))
		} else if (message.embeds[0].description.indexOf(msg.author.username) !== -1) {
			replyMessage = f('%s\n', message.embeds[0].description) +
				f('**%s**: %s', msg.author.username, args.join(' '))
		} else {
			replyMessage = f('**%s**: %s\n', message.embeds[0].author.name, message.embeds[0].description) +
				f('**%s**: %s', msg.author.username, args.join(' '))
		}

		let lines = replyMessage.split('\n')
		let replyNames = []
		for (i = 0; i < lines.length; i++) {
			let name = lines[i].split(' ')[0]
			if (!replyNames.includes(name))
				replyNames.push(name.slice(2, name.length-3))
		}

		let embed = {
    		embed: {
    			title: 'New reply from: ' + msg.author.username,
      			description: replyMessage,
      			author: { name: msg.author.username, icon_url: msg.author.avatarURL },
      			color: color,
      			footer: { text: 'Author id: ' + msg.author.id + ' message id: ' + foot[foot.length -1]}
    		}
    	}

    	for (i = 0; i < replyFollowers.length; i++) {
				let recipient = await col.findOne({user: replyFollowers[i]})

				let packet = {
				    content: embed,
				    destination: recipient.sendTo,
				    source: msg.author.id,
				    type: 'reply',
				    participants: replyNames
				}

				q.push(packet)
			}

	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}

exports.report = async (msg, args, bot, client) => {
	try {
		const col = client.db(config.db).collection('Users')
		let usee = await col.findOne({user: msg.author.id})

		//get a message
		let message = undefined
		let messages = await msg.channel.getMessages(50, msg.id)
		for (i in messages) {
			if (messages[i].embeds.length > 0) {
				if (messages[i].embeds[0].footer !== undefined) {
					let foot = messages[i].embeds[0].footer.text.split(' ')
					if(foot.includes(args[0])) {
						message = messages[i]
						break
					}
				}
			}
		}

		if (message === undefined) {
			bot.createMessage(msg.channel.id, reply.report.notMsg)
			return
		}

		args.shift()
		let embed = message.embeds[0]

		msg.channel.addMessageReaction(message.id, '🚓')
		bot.createMessage('447987469678280705', {embed})
		bot.createMessage('447987469678280705', args.join(' '))
		bot.createMessage(msg.channel.id, reply.report.submitted)

	} catch (err) {
		console.log(err)
		bot.createMessage(config.logChannelID, err.message)
		bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
	}
}
