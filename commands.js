// libraries required
// const setTimeoutPromise = util.promisify(setTimeout)

// project files required
// const config = require('./config.json')   // secrets
const fns = require('./utilities.js') // useful functions
const db = require('./queries.js') // database queries

/// ///////////////////////////////
// Eval Functions               //
/// /////////////////////////////

// inserts zws character to prevent mentions
const noMention = text => {
	if (typeof (text) === 'string') { return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203)) } else { return text }
}

// lets owner evaluate code live
exports.beval = async (msg, code, bot) => {
	try {
		let evaled = await eval(code)

		if (typeof evaled !== 'string') { evaled = require('util').inspect(evaled) }

			bot.createMessage(msg.channel.id, noMention(evaled))
	} catch (err) {
		bot.createMessage(msg.channel.id, `\`ERROR\` \`\`\`xl\n${noMention(err)}\n\`\`\``)
	}
}

// lets owner evaluate queries live
exports.qeval = async (msg, code, bot) => {
	let res = await db.qeval(code)
	bot.createMessage(msg.channel.id, res)
}

//////////////////////////////////
//Command Functions            //
////////////////////////////////

exports.create = async (msg, bot) => {
	let dmChannel = await msg.author.getDMChannel()

	let res = await db.createUser(msg.author.id, dmChannel)

	if (res === 1) { 
		bot.createMessage(msg.channel.id, msg.author.username + ', your account has been created! You are ready to broadcast!')
	} else if (res === 0) { 
		bot.createMessage(msg.channel.id, msg.author.username + ', there was an error creating your account, please try again later.') 
	} else if (res === -1) { 
		bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.') 
	}
}

exports.delete = async (msg, bot) => {
	var confirm = fns.rand4Digit()
  // var completed = false
  // setTimeoutPromise(10000, completed).then((val) => {
  //  bot.removeListener('messageCreate', deleteConfirm())
  //  if (!val) {
  //    bot.createMessage(msg.channel.id, 'Command timed out, please retransmit.')
  //  }
  // })

  bot.createMessage(msg.channel.id, 'Are you sure you want to close your account? Confirm with: `' + confirm + '`, cancel with `cancel`')
  bot.on('messageCreate', async (response, msg) => {
  	if (response.author.id === msg.author.id && response.content !== confirm) {
  		bot.createMessage(msg.channel.id, 'Sorry that was not the confirmation code')
    // completed = true
} else if (response.author.id === msg.author.id && response.content === confirm.toString()) {
	let res = await db.deleteUser(msg.author.id)
      // completed = true

      if (res === 1) { bot.createMessage(msg.channel.id, msg.author.username + ', your account has been deleted! The airwaves will miss your broadcasts.') } else if (res === 0) { bot.createMessage(msg.channel.id, msg.author.username + ', there was an error deleting your account, please try again later.') } else { bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.') }
  } else if (response.author.id === msg.author.id && response.content === 'cancel') {
  	bot.createMessage(msg.channel.id, 'Account deletion cancelled.')
    // completed = true
}
})
}

exports.follow = async (msg, followid, bot) => {
  // check if user is already follwing the other user
  let isInList = await db.userInList(msg.author.id, 'following', followid)

  if (isInList === 0) {
    // if not following
    let addToFollowing = await db.pushUserToList(msg.author.id, 'following', followid)
    let addToFollowers = await db.pushUserToList(followid, 'followers', msg.author.id)

    if (addToFollowing === 1 && addToFollowers === 1) {
    	bot.createMessage(msg.channel.id, msg.author.username + ', you are now following their broadcasts!')
    } else if (addToFollowers === 0 || addToFollowing === 0) {
    	bot.createMessage(msg.channel.id, msg.author.username + ', there was an error following that user, please try again later.')
    } else {
    	bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
    }
} else if (isInList === 1) {
	bot.createMessage(msg.channel.id, msg.author.username + ', you are already following their broadcasts!')
    let addToFollowers = await db.pushUserToList(followid, 'followers', msg.author.id) // run in case this part failed
} else {
	bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
}
}

exports.unfollow = async (msg, unfollowid, bot) => {
  // check if user is already follwing the other user
  let isInList = await db.userInList(msg.author.id, 'following', unfollowid)

  if (isInList === 1) {
  	let removeFromFollowing = await db.pullUserFromList(msg.author.id, 'following', unfollowid)
  	let removeFromFollowers = await db.pullUserFromList(unfollowid, 'followers', msg.author.id)

  	if (removeFromFollowing === 1 && removeFromFollowers === 1) {
  		bot.createMessage(msg.channel.id, msg.author.username + ', you are no longer following their broadcasts!')
  	} else if (removeFromFollowers === 0 || removeFromFollowing === 0) {
  		bot.createMessage(msg.channel.id, msg.author.username + ', there was an error unfollowing that user, please try again later.')
  	} else {
  		bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
  	}
  } else if (isInList === 0) {
  	bot.createMessage(msg.channel.id, msg.author.username + ', you are not following their broadcasts!')
    let removeFromFollowers = await db.pullUserFromList(unfollowid, 'followers', msg.author.id) // run in case this part failed
} else {
	bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
}
}

exports.block = async (msg, blockid, bot) => {
	let removeFromFollowing = await db.pullUserFromList(msg.author.id, 'following', blockid)
	let removeFromFollowers = await db.pullUserFromList(blockid, 'followers', msg.author.id)
	let addToBlocked = await db.pushUserToList(msg.author.id, 'blocked', blockid)

	if (removeFromFollowers === 1 && removeFromFollowing === 1 && addToBlocked === 1) {
		bot.createMessage(msg.channel.id, msg.author.username + ', you have blocked their broadcasts! Please report suspected abuse.')
	} else if (removeFromFollowers === 0 || removeFromFollowing === 0 || addToBlocked === 0) {
		bot.createMessage(msg.channel.id, msg.author.username + ', there was an error blocking that user, please try again later.')
	} else {
		bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
	}
}

exports.unblock = async (msg, unblockid, bot) => {
	let removeFromBlocked = await db.pullUserFromList(msg.author.id, 'blocked', unblockid)

	if (removeFromBlocked === 1) {
		bot.createMessage(msg.channel.id, msg.author.username + ', you have unblocked their broadcasts! You must use `b.follow` to recieve their broadcasts again.')
	} else if (removeFromBlocked === 0) {
		bot.createMessage(msg.channel.id, msg.author.username + ', there was an error unblocking that user, please try again later.')
	} else {
		bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
	}
}

exports.setTagline = async (msg, tagline, bot) => {
	let setTaglineText = await db.setField(msg.author.id, 'tagline', tagline)

	if (setTaglineText === 1) {
		bot.createMessage(msg.channel.id, msg.author.username + ', your profile tagline has been set!')
	} else if (setTaglineText === 0) {
		bot.createMessage(msg.channel.id, msg.author.username + ', there was an error setting your tagline, please try again later.')
	} else {
		bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
	}
}

exports.setBio = async (msg, bio, bot) => {
	let setBioText = await db.setField(msg.author.id, 'bio', bio)

	if (setBioText === 1) { bot.createMessage(msg.channel.id, msg.author.username + ', your profile bio has been set!') } else if (setBioText === 0) { bot.createMessage(msg.channel.id, msg.author.username + ', there was an error setting your bio, please try again later.') } else { bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.') }
}

exports.toggleMature = async (msg, bot) => {
	let isMature = await db.getFields(msg.author.id, 'mature')
	var setMature

	if (isMature) {
		let setMature = await db.setField(msg.author.id, 'mature', false)
	} else if (!isMature) {
		let setMature = await db.setField(msg.author.id, 'mature', true)
	} else {
		bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
	}

	if (setMature === 1) {
		bot.createMessage(msg.channel.id, msg.author.username + ', your mature preference has been set!')
	} else if (setMature === 0) {
		bot.createMessage(msg.channel.id, msg.author.username + ', there was an error setting your mature preference, please try again later.')
	} else {
		bot.createMessage(msg.channel.id, msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.')
	}
}

exports.viewProfile = async (msg, profileid, bot) => {
	let profileData = db.getFields(profileid, 'all')
	var embed = fns.profileEmbed(profileData)
	bot.createMessage(msg.channel.id, embed)
}
