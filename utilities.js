const util = require('util')

// const filter = require('swearjar')
const config = require('./config.json')
const db = require('./queries.js')
const reply = require('./proto_messages.json')

// match user mentions and id strings
const matchUserMention = new RegExp('<@[0-9]{18}>')
const matchUserString = new RegExp('^[0-9]{18}')

// checks if arg is an id or mention and returns the id if so, if not returns -1
exports.isID = (arg) => {
  if (matchUserString.test(arg)) { return arg } else if (matchUserMention.test(arg)) { return arg.substr(2, 18) } else { return -1 }
}

exports.codeblockify = (data) => {
  if (typeof (data) === 'object') { return '```\n' + JSON.stringify(data) + '\n```' } else { return '```\n' + data + '\n```' }
}

exports.getUserObj = async (userid, bot) => {
  let user = await bot.users.get(userid)
  return user
}

exports.getUsername = async (userid, bot) => {
  let user = await bot.users.get(userid)
  return user.username 
}

exports.isUserBot = async (userid, bot) => {
  let user = await bot.users.get(userid)
  return user.bot
}

exports.userHasAccount = async (msg, bot) => {
  let hasAccount = await db.userExists(msg.author.id);
  if (hasAccount === 0) {
    bot.createMessage(msg.channel.id, util.format(reply.generic.useeNoAccount, msg.author.username))
    return false
  }
  return true
}

exports.safetyChecks = async (msg, bot) => {
  let hasAccount = await db.userExists(msg.author.id);
  if (hasAccount === 0) {
    bot.createMessage(msg.channel.id, util.format(reply.generic.useeNoAccount, msg.author.username))
    return false
  }

  var secondID = module.exports.isID(msg.content.split(' ')[1])
  if (followid === -1) {
    bot.createMessage(msg.channel.id, util.format(reply.generic.invalidID, msg.author.username, msg.content.split(' ')[1]))
    return false
  }

  if (secondID === msg.author.id) {
    bot.createMessage(msg.channel.id, util.format(reply.generic.cannotDoToSelf, msg.author.username))
    return false
  }

  let isBot = await module.exports.isUserBot(secondID, bot)
  if (isBot){
    bot.createMessage(msg.channel.id, util.format(reply.generic.cannotDoToBots, msg.author.username))
    return false
  }

  let followeeHasAccount = await db.userExists(secondID)
  let secondUsername = await module.exports.getUsername(secondID, bot)
  if (followeeHasAccount === 0) {
    bot.createMessage(msg.channel.id, util.format(reply.generic.UserNoAccount, msg.author.username, secondUsername))
    return false
  }

  //checks passed
  return true
}

exports.sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

exports.profileEmbed = async (doc, bot) => {
  let user = await module.exports.getUserObj(doc.user, bot)

  if(doc.tagline === '')
    doc.tagline = 'not set'

  var embed = {
    embed: {
      description: doc.bio,
      author: { // Author property
        name: user.username,
        icon_url: user.avatarURL
      },
      color: doc.eColor, // Color, a base-10 integer
      fields: [ // Array of field objects
        {
          name: 'Tagline: ', // Field title
          value: doc.tagline, // Field
          inline: false // Whether you want multiple fields in same line
        },
        {
          name: 'Followers: ',
          value: doc.followers.length,
          inline: true
        },
        {
          name: 'Following: ',
          value: doc.following.length,
          inline: true
        }
      ],
      footer: { // Footer text
        text: 'Broadcast Tower User Profile'
      }
    }
  }

  return embed
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
      color: config.color,
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

exports.log = (bot, message) => {
  let date = new Date().toLocaleString('en-GB', { timeZone: 'America/New_York' })
  console.log(util.format(date, message))
  bot.createMessage(config.logChannelID, util.format(date, message))
}

const loopCmd = async (bot) => {
  var helpString = ''
  for (var command in bot.commands)
    if (!bot.commands[command].hidden)
      helpString.concat('**' + bot.commands[command].label + ':** ' + bot.commands[command].description +'\n')
  return helpString
}

exports.help = async (msg, cmd, bot) => {
  let botUser = await bot.getSelf()
  if (cmd === 'all') {
    var helpTitle = 'Broadcast Tower Command List'
    let helpString = await loopCmd(bot)
  } else {
    var helpTitle = 'Help for: ' + bot.commands[cmd].label
    var helpString = util.format(reply.help.singleCmdDesc, bot.commands[cmd].aliases, bot.commands[cmd].fullDescription, bot.commands[cmd].cooldown/1000, bot.commands[cmd].usage)
  }

  var embed = {
    embed: {
      title: helpTitle,
      description: helpString,
      author: {
        name: botUser.username,
        icon_url: botUser.avatarURL
      },
      color: config.color,
      footer: {
        text: 'Broadcast Tower Help Station'
      }
    }
  }

  bot.createMessage(msg.channel.id, embed)
}
