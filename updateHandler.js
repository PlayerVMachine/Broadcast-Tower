const f = require('util').format
const pc = require('swearjar')

const config = require('./config.json')
const reply = require('./proto_messages.json')

exports.editView = (btUser, discUser, botUser) => {
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
			color: parseInt(config.color, 16),
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

exports.updateHandler = async (editMsg, msg, iprofile, bot, col) => {
	if (editMsg.author.id !== msg.author.id)
		return

	let botUser = await bot.getSelf()
	let discUser = await bot.users.get(msg.author.id)

	if (editMsg.content.startsWith('tagline')) {
		//get just the tagline
		let newTagline = editMsg.content.slice(8)
		
		if (newTagline.length > 140) {
			bot.createMessage(msg.channel.id, f(reply.tagline.isTooLong, msg.author.username))
		} else {
			let update = await col.findOneAndUpdate({user:msg.author.id}, {$set: {tagline:newTagline}})
			let newUsee = await col.findOne({user: msg.author.id})
			let newEmbed = module.exports.editView(newUsee, discUser, botUser)
			bot.editMessage(msg.channel.id, iprofile.id, newEmbed)
			bot.removeListener('messageCreate', updateHandler)
		}
	}
}