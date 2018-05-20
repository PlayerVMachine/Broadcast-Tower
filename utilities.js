const util = require('util')

// const filter = require('swearjar')
const config = require('./config.json')
const reply = require('./proto_messages.json')

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