Handler = async (editMsg, msg, iprofile, bot, col) => {
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
		}
	}
}