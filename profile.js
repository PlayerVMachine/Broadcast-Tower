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

const editView = async (btUser, discUser, botUser) => {
	let tagline = 'Not set'
	let bio = 'Not set'
	let mature = 'Profanity `not` allowed'
	let private = 'Privacy set to `public`'
	let dnd = 'Do not disturb set to `off`'
	let color = 'Embed color: ' + btUser.eColor
	let avatar = await discUser.dynamicAvatarURL('gif', 512)

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
			color: config.color,
			thumbnail: {url: avatar, width: 512, height:512},
			author: {name: botUser.username, icon_url: botUser.avatarURL},
			fields: [
				{name: 'Tagline: ', value: tagline, inline: false},
				{name: 'Bio: ', value: bio, inline: false},
				{name: 'Mature: ', value: mature, inline: false},
				{name: 'Private: ', value: private, inline: true},
				{name: 'DND: ', value:dnd, inline: true},
				{name: 'Color', value: color, inline: false},
				{name: 'Following: ', value:btUser.following.length, inline: true},
				{name: 'Followers: ', value:btUser.followers.length, inline: true},
				{name: 'Blocked: ', value:btUser.blocked.length, inline: true}
			],
			footer: {text: 'prepared by ' + botUser.mention}
		}
	}

	return embed

}

//base edit command
exports.edit = async (msg, bot) => {
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

		embed = editView(usee, discUser, botUser)

		bot.createMessage(msg.channel.id, embed)


	} catch (err) {
		fns.log(f(reply.generic.logError, err), bot)
	}
}

//base view command
exports.view = async (msg, args, bot) => {

}

//edit tagline
exports.setTagline = async (msg, args, bot) => {

}

//view tagline
exports.getTagline = async (msg, args, bot) => {

}