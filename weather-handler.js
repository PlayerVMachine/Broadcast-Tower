const weather = require('weather-js');


exports.getWeather = (msg, args, bot) => {
  try {
    if (args.length === 0) {
      bot.createMessage(msg.channel.id, 'please enter a location and degree type')
      return
    }

    let command = args.join(' ')
    let location = command.split('-d')[0].trim()

    let degree = 'C'
    if (command.split('-d')[1] !== undefined) {
      let degree = command.split('-d')[1].trim()
    }

    weather.find({search: location, degreeType: degree}, (err, result) => {
      if(err) {
        console.log(err)
        return
      }

      let toSend = "**Current Weather in "
      + result[0].location.name + "**\`\`\`Temperature: "
      + result[0].current.temperature + result[0].location.degreetype
      + "\nFeels like: " + result[0].current.feelslike
      + result[0].location.degreetype + "\nSky: "
      + result[0].current.skytext + "\nWind: "
      + result[0].current.winddisplay + "\`\`\`";

      bot.createMessage(msg.channel.id, toSend)
    })
  } catch (e) {
    console.log(e)
  }
}