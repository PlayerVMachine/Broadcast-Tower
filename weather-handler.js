const weather = require('weather-js');
const f = require('util').format

exports.getWeather = (msg, args, bot) => {
  try {
    if (args.length === 0) {
      bot.createMessage(msg.channel.id, 'please enter a location and degree type')
      return
    }

    let command = args.join(' ')
    let location = command.split('-d')[0].trim()

    let degree = 'F'
    if (command.split('-d')[1] !== undefined) {
      if (command.split('-d')[1].toUpperCase === 'C' || command.split('-d')[1].toUpperCase === 'F') {
        let degree = command.split('-d')[1].trim()
      }
    }

    weather.find({search: location, degreeType: degree}, (err, result) => {
      if(err) {
        bot.createMessage(msg.channel.id, err)
        return
      }

      let embed = {
        embed: {
            author: {name: f("Current Weather in %s", result[0].location.name), icon_url: result[0].current.imageUrl},
            color: parseInt('0x4286f4', 16),
            description: f("Temperature: **%s**\nFeels like: **%s**\nSky: **%s**\nWind: **%s**\n", result[0].current.temperature + result[0].location.degreetype, result[0].current.feelslike + result[0].location.degreetype, result[0].current.skytext, result[0].current.winddisplay),
            footer: {text:'Part of the Broadcast Tower Integration Network'}
        }
      }

      bot.createMessage(msg.channel.id, embed)
    })
  } catch (e) {
    console.log(e)
  }
}