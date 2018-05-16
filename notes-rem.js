//module imports
const f = require('util').format
const MongoClient = require('mongodb').MongoClient

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

exports.noteToSelf = async (msg, args, bot) => {
	try{
		let client = await MongoClient.connect(url)
		const usersCol = client.db(config.db).collection('Users')

		let usee = await usersCol.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		let toPin = await bot.createMessage(usee.sendTo, `Note: ` + args.push(msg.attachments).join(' '))

		let pinned = await toPin.pin()

		let msgToDel = await toPin.channel.getMessages(1,undefined, toPin.id)

		let deleted = await toPin.channel.deleteMessage(msgToDel[0].id)

		bot.createMessage(msg.channel.id, `Got it boss, note made!`)
	} catch (err) {
		bot.createMessage(msg.channel.id, `Sorry boss my pencil broke`)
	} 
}

exports.getNotes = async (msg, args, bot) => {
	try{
		let client = await MongoClient.connect(url)
		const usersCol = client.db(config.db).collection('Users')

		let usee = await usersCol.findOne({user: msg.author.id})
		if (usee === null) {
			bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
			return
		}

		let dmChannel = await bot.getDMChannel(msg.author.id)

		let noteMsgs = await dmChannel.getPins()

		let notes = []
		for (m in noteMsgs) {
			date = new Date(noteMsgs[m].timestamp)
			notes.push({name: 'Note', value: f(`%s | created %s`, noteMsgs[m].content, date.toDateString()), inline:false})
		}

		if (notes.length === 0)
			notes.push({name: 'Note', 'No notes found! Create a note with b.nts!', inline:false})

		let embed = {
			embed: {
				author: {name: f(`%s's notes:`, msg.author.username), icon_url: msg.author.avatarURL}
				fields: notes,
				color: parseInt(usee.eColor, 16)
				footer: {text: `Powered by the Broadcast Tower`}
			}
		}

		bot.createMessage(msg.channel.id, embed)

	} catch (err) {
		bot.createMessage(msg.channel.id, `Sorry boss my pencil broke`)
	} 
} 