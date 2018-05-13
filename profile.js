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
const isHex = new RegExp(/^#[0-9A-F]{6}$/, 'i')

const editView = (btUser, discUser, botUser) => {
	let tagline = 'Not set'
	let bio = 'Not set'
	let mature = 'Profanity `not` allowed'
	let private = 'Privacy set to `public`'
	let dnd = 'Do not disturb set to `off`'
	let color = 'Embed color: ' + btUser.eColor

	if (btUser.tagline.length !== 0)
		tagline = btUser.tagline
	if (btUser.bio.length !== 0)
		bio = btUser.bio
	if (btUser.mature)
		mature = 'Profanity `is` allowed'
	if (btUser.dnd)
		dnd = 'Do Not disturb set to `on`'

	var embed = {
		embed: {
			title: discUser.username + `'s account details.`,
			description: 'Current settings:',
			color: parseInt(btUser.eColor, 16),
			thumbnail: {url: discUser.avatarURL, width: 256, height:256},
			author: {name: discUser.username, icon_url: discUser.avatarURL},
			fields: [
			{name: 'Tagline: ', value: tagline, inline: false},
			{name: 'Bio: ', value: bio, inline: false},
			{name: 'Mature: ', value: mature, inline: true},
			{name: 'Private: ', value: private, inline: true},
			{name: 'DND: ', value:dnd, inline: true},
			{name: 'Color', value: color, inline: true},
			{name: 'Following: ', value:btUser.following.length, inline: true},
			{name: 'Followers: ', value:btUser.followers.length, inline: true},
			{name: 'Blocked: ', value:btUser.blocked.length, inline: true}
			],
			footer: {text: 'prepared by ' + botUser.username}
		}
	}

	return embed
}

const viewView = (btUser, discUser, botUser) => {
	let tagline = 'Not set'
	let bio = 'Not set'
	let mature = 'no'
	let private = '`public`'
	let dnd = '`off`'
	let color = btUser.eColor

	if (btUser.tagline.length !== 0)
		tagline = btUser.tagline
	if (btUser.bio.length !== 0)
		bio = btUser.bio
	if (btUser.mature)
		mature = '`yes`'
	if (btUser.dnd)
		dnd = '`on`'
	if (btUser.private)
		private = '`private`'

	var embed = {
		embed: {
			title: discUser.username + `'s Braodcast Station.`,
			color: parseInt(btUser.eColor, 16),
			thumbnail: {url: discUser.avatarURL, width: 256, height:256},
			author: {name: discUser.username, icon_url: discUser.avatarURL},
			fields: [
			{name: 'Tagline: ', value: tagline, inline: false},
			{name: 'Bio: ', value: bio, inline: false},
			{name: 'Profanity: ', value: mature, inline: true},
			{name: 'Private: ', value: private, inline: true},
			{name: 'DND: ', value:dnd, inline: true},
			{name: 'Color', value: '#' + color.slice(2), inline: true},
			{name: 'Following: ', value:btUser.following.length, inline: true},
			{name: 'Followers: ', value:btUser.followers.length, inline: true},
			],
			footer: {text: 'prepared by ' + botUser.username}
		}
	}

	return embed
}

//base edit command
exports.edit = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		let botUser = await bot.getSelf()
		let discUser = await bot.users.get(msg.author.id)

		let embed = editView(usee, discUser, botUser)

		bot.createMessage(msg.channel.id, embed)

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//base view command
exports.view = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		let botUser = await bot.getSelf()

		if (args.length === 0) {
			let discUser = await bot.users.get(msg.author.id)
			let embed = viewView(usee, discUser, botUser)
			bot.createMessage(msg.channel.id, embed)
			return
		}

		let secondID = fns.isID(args[0])
		if (secondID === -1) {
			bot.createMessage(msg.channel.id, f(reply.view.unexpected, msg.author.id, args[0]))
			return
		}

		let discUser = await bot.users.get(secondID)
		let user = await col.findOne({user: secondID})
		if (user === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.userNoAccount, msg.author.username, discUser.username))
			return
		}

		let embed = viewView(user, discUser, botUser)
		bot.createMessage(msg.channel.id, embed)
		return

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//edit tagline
exports.setTagline = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		if (args.length === 0) {
			bot.createMessage(msg.channel.id, f(reply.tagline.current, msg.author.username, usee.tagline))
			return
		}

		let newTagline = args.join(' ')
		if (newTagline.length > 140) {
			bot.createMessage(msg.channel.id, f(reply.tagline.isTooLong, msg.author.username))
			return
		}

		if (pc.profane(newTagline)) {
			bot.createMessage(msg.channel.id, f(reply.tagline.isProfane, msg.author.username))
			return
		}

		//findone and update their tagline
		let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {tagline:newTagline}})
		if (update.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.tagline.success, msg.author.username, newTagline))
		} else {
			fns.log(f(reply.generic.logError, err), bot)
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//edit tagline
exports.setTagline = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		if (args.length === 0) {
			bot.createMessage(msg.channel.id, f(reply.tagline.current, msg.author.username, usee.tagline))
			return
		}

		let newTagline = args.join(' ')
		if (newTagline.length > 140) {
			bot.createMessage(msg.channel.id, f(reply.tagline.isTooLong, msg.author.username))
			return
		}

		if (pc.profane(newTagline)) {
			bot.createMessage(msg.channel.id, f(reply.tagline.isProfane, msg.author.username))
			return
		}

		//findone and update their tagline
		let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {tagline:newTagline}})
		if (update.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.tagline.success, msg.author.username, newTagline))
		} else {
			fns.log(f(reply.generic.logError, err), bot)
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//edit bio
exports.setBio = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		if (args.length === 0) {
			bot.createMessage(msg.channel.id, f(reply.bio.current, msg.author.username, usee.bio))
			return
		}

		let newBio = args.join(' ')
		if (newBio.length > 400) {
			bot.createMessage(msg.channel.id, f(reply.bio.isTooLong, msg.author.username))
			return
		}

		if (pc.profane(newBio)) {
			bot.createMessage(msg.channel.id, f(reply.bio.isProfane, msg.author.username))
			return
		}

		//findone and update their tagline
		let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {bio:newBio}})
		if (update.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.bio.success, msg.author.username, newBio))
		} else {
			fns.log(f(reply.generic.logError, err), bot)
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//set Mature
exports.setMature = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		if (usee.mature)
			var profanity = 'yes'
		else
			var profanity = 'no'

		if (args.length === 0) {
			bot.createMessage(msg.channel.id, f(reply.mature.current, msg.author.username, profanity))
			return
		}

		if (args[0].toLowerCase().startsWith('y')) {
			var setProfane = true
		} else if (args[0].toLowerCase().startsWith('n')) {
			var setProfane = false
		} else {
			bot.createMessage(msg.channel.id, f(reply.mature.unexpected, msg.author.username, args[0]))
			return
		}

		//findone and update their tagline
		let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {mature:setProfane}})
		if (update.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.mature.success, msg.author.username, args[0]))
		} else {
			fns.log(f(reply.generic.logError, err), bot)
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//set dnd
exports.setDND = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		if (usee.dnd)
			var dndSetTo = 'yes'
		else
			var dndSetTo = 'no'

		if (args.length === 0) {
			bot.createMessage(msg.channel.id, f(reply.dnd.current, msg.author.username, dndSetTo))
			return
		}

		if (args[0].toLowerCase().startsWith('y')) {
			var setdnd = true
		} else if (args[0].toLowerCase().startsWith('n')) {
			var setdnd = false
		} else {
			bot.createMessage(msg.channel.id, f(reply.dnd.unexpected, msg.author.username, args[0]))
			return
		}

		//findone and update their tagline
		let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {dnd:setdnd}})
		if (update.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.dnd.success, msg.author.username, args[0]))
		} else {
			fns.log(f(reply.generic.logError, err), bot)
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//set Private
exports.setPrivate = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		if (usee.private)
			var priv = 'yes'
		else
			var priv = 'no'

		if (args.length === 0) {
			bot.createMessage(msg.channel.id, f(reply.private.current, msg.author.username, priv))
			return
		}

		if (args[0].toLowerCase().startsWith('y')) {
			var setPriv = true
		} else if (args[0].toLowerCase().startsWith('n')) {
			var setPriv = false
		} else {
			bot.createMessage(msg.channel.id, f(reply.private.unexpected, msg.author.username, args[0]))
			return
		}

		//findone and update their tagline
		let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {private:setPriv}})
		if (update.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.private.success, msg.author.username, args[0]))
		} else {
			fns.log(f(reply.generic.logError, err), bot)
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//edit embed colour
exports.setColor = async (msg, args, bot) => {
	try {
		//database
		let client = await MongoClient.connect(url)
		const col = client.db(config.db).collection('Users')

		//check is usee is a user
		let usee = await col.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		if (args.length === 0) {
			bot.createMessage(msg.channel.id, f(reply.color.current, msg.author.username, usee.eColor))
			return
		}

		if (isHex.test(args[0])) {
			var color = '0x' + args[0].slice(1)
		} else {
			bot.createMessage(msg.channel.id, f(reply.color.unexpected, msg.author.username, args[0]))
			return
		}

		//findone and update their tagline
		let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {eColor:color}})
		if (update.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.color.success, msg.author.username, args[0]))
		} else {
			fns.log(f(reply.generic.logError, err), bot)
		}

	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}