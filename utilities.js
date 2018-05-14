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

exports.codeblockify = (data) => {
  if (typeof (data) === 'object') { return '```\n' + JSON.stringify(data) + '\n```' } else { return '```\n' + data + '\n```' }
}

exports.getUserObj = async (userid, bot) => {
  let user = await bot.users.get(userid)
  return user
}

exports.sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
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

function HelpEmbed (title, helpString, botUser) {
  this.embed = {}
  this.embed.title = title
  this.embed.description = helpString
  this.embed.author = {name: botUser.username, icon_url: botUser.avatarURL}
  this.embed.color = parseInt(config.color, 16)
  this.embed.footer = {text: 'Broadcast Tower Help Station'}
}

exports.help = async (msg, cmd, bot) => {
  let botUser = await bot.getSelf()
  helpString = ''
  if (cmd === 'all') {
    var helpTitle = 'Broadcast Tower Command List'
    for (var command in bot.commands) {
      if (!bot.commands[command].hidden) {
        helpString += '**' + bot.commands[command].label + ':** ' + bot.commands[command].description +'\n'
      }
    }

    var embed = new HelpEmbed(helpTitle, helpString, botUser)
  } else {
    var helpTitle = 'Help for: ' + bot.commands[cmd].label
    var helpString = util.format(reply.help.singleCmdDesc, bot.commands[cmd].aliases, bot.commands[cmd].fullDescription, bot.commands[cmd].cooldown/1000, bot.commands[cmd].usage)
    var embed = new HelpEmbed(helpTitle, helpString, botUser)
  }

  bot.createMessage(msg.channel.id, embed)
}
