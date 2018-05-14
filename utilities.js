const util = require('util')

// const filter = require('swearjar')
const config = require('./config.json')
const reply = require('./proto_messages.json')

// match user mentions and id strings
const matchUserMention = new RegExp('<@[0-9]{18}>')
const matchUserString = new RegExp('^[0-9]{18}')

// checks if arg is an id or mention and returns the id if so, if not returns -1
exports.isID = (arg) => {
  if (matchUserString.test(arg)) { return arg } else if (matchUserMention.test(arg)) { return arg.substr(2, 18) } else { return -1 }
}

exports.getUserObj = async (userid, bot) => {
  let user = await bot.users.get(userid)
  return user
}

exports.postEmbed = (msg, user) => {
  var embed = {
    embed: {
      title: 'New broadcast from: ' + user.username, // Title of the embed
      description: msg,
      author: { // Author property
        name: user.username,
        icon_url: user.avatarURL
      },
      color: parseInt(config.color, 16),
      footer: { // Footer text
        text: 'Report abuse to Hal'
      }
    }
  }

  return embed
}

exports.rand4Digit = () => {
  var min = Math.ceil(1000)
  var max = Math.floor(9999)
  return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
}

exports.log = (message, bot) => {
  let date = new Date().toLocaleString('en-GB', { timeZone: 'America/New_York' })
  console.log(util.format(date, message))
  bot.createMessage(config.logChannelID, util.format(date, message))
}