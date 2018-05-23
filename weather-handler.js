const weather = require('weather-js');
const moment = require('moment-timezone')
const f = require('util').format

const config = require('./config.json')

exports.getWeather = async (msg, args, bot, client) => {
  try {
    const col = client.db(config.db).collection('Users')
    let usee = await col.findOne({user: msg.author.id})

    let location = 'Montreal, QC'
    let degree = 'F'

    if (args.length === 0) {
      if (usee === null || usee.weather.location === '') {
        bot.createMessage(msg.channel.id, 'please enter a location and degree type')
        return
      } else {
        location = usee.weather.location
        degree = usee.weather.deg
      }
    } else {
      let command = args.join(' ')
      location = command.split('-')[0].trim()

      if (command.split('-')[1] !== undefined) {
        if (command.split('-')[1].trim().toUpperCase() === 'C' || command.split('-')[1].trim().toUpperCase() === 'F') {
          degree = command.split('-')[1].trim().toUpperCase()
        } else {
          degree ='F'
        }
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
            description: f("Temperature: **%s**\nFeels like: **%s**\nSky: **%s**\nWind: **%s**\n", result[0].current.temperature + degree, result[0].current.feelslike + degree, result[0].current.skytext, result[0].current.winddisplay),
            footer: {text:'Part of the Broadcast Tower Integration Network'}
        }
      }

      bot.createMessage(msg.channel.id, embed)
    })
  } catch (err) {
    console.log(err)
    bot.createMessage(config.logChannelID, err.message)
    bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
  }
}

exports.getForecast = async (msg, args, bot, client) => {
  try {
    const col = client.db(config.db).collection('Users')
    let usee = await col.findOne({user: msg.author.id})

    let location = 'Montreal, QC'
    let degree = 'F'

    if (args.length === 0) {
      if (usee === null || usee.weather.location === '') {
        bot.createMessage(msg.channel.id, 'please enter a location and degree type')
        return
      } else {
        location = usee.weather.location
        degree = usee.weather.deg
      }
    } else {
      let command = args.join(' ')
      location = command.split('-')[0].trim()

      if (command.split('-')[1] !== undefined) {
        if (command.split('-')[1].trim().toUpperCase() === 'C' || command.split('-')[1].trim().toUpperCase() === 'F') {
          degree = command.split('-')[1].trim().toUpperCase()
        } else {
          degree ='F'
        }
      }
    }

    weather.find({search: location, degreeType: degree}, (err, result) => {
      if(err) {
        bot.createMessage(msg.channel.id, err)
        return
      }

      let fields = []
      for (i = 2; i < 5; i++) {
        let precip = result[0].forecast[i].precip + '%'
        if (result[0].forecast[i].precip === '')
          precip = '0%'
          

        fields.push({name:result[0].forecast[i].day + f(' the %sth', result[0].forecast[i].date.slice(8)),
          value: f('High: **%s**\nLow: **%s**\nSky: **%s**\nPrecipitation: **%s**',
            result[0].forecast[i].high + degree, result[0].forecast[i].low + degree, result[0].forecast[i].skytextday, precip),
          inline:true
        })
      }

      let embed = {
        embed: {
            author: {name: f("Weather forecast in %s for the next 3 days", result[0].location.name), icon_url: result[0].current.imageUrl},
            color: parseInt('0x4286f4', 16),
            fields: fields,
            footer: {text:'Part of the Broadcast Tower Integration Network'}
        }
      }

      bot.createMessage(msg.channel.id, embed)
    })
  } catch (err) {
    console.log(err)
    bot.createMessage(config.logChannelID, err.message)
    bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
  }
}

exports.dailySub = async (msg, args, bot, client) => {
  try {
    const remCol = client.db(config.db).collection('Reminders')
    const userCol = client.db(config.db).collection('Users')

    let usee = await UserCol.findOne({user: msg.author.id})

    if (usee.tz === undefined) {
      bot.createMessage(msg.channel.id, f(reply.forecast.noTZ, msg.author.username))
      return
    }

    if (usee.weather === undefined || usee.weather === {location: '', deg: ''}) {
      bot.createMessage(msg.channel.id, f(reply.forecast.noWeather, msg.author.username))
      return
    }

    let now = new Date()
    let date = now.toISOString().slice(0,11)

    let userTime = moment.tz([date, args[0]].join(' '), usee.tz)
    let scheduledTime = userTime.utc().format()

    if(Date.parse(scheduledTime) < Date.parse(now))
      scheduledTime = new Date(scheduledTime + 24*60*60*1000)

    let due = new Date(scheduledTime)

    let weatherSub = {
      user: usee.user,
      sendTo: usee.sendTo,
      due = due,
      type: 'reminder'
    }

    let addWeather = await remCol.insertOne(weatherSub)
    if (addWeather.insertedCount === 1)
      bot.createMessage(msg.channel.id, 'Successfully subcribed to daily forecast updates!')
    else
      bot.createMessage(msg.channel.id, 'Could not subscibe to daily forecast updates sorry!')


  } catch (err) {
    console.log(err)
    bot.createMessage(config.logChannelID, err.message)
    bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
  }
}

exports.dailyForecast = async (destination, client, q) => {
  try {
    const col = client.db(config.db).collection('Users')
    let usee = await col.findOne({sendTo: destination})

    let location = usee.weather.location
    let degree = usee.weather.deg

    weather.find({search: location, degreeType: degree}, (err, result) => {
      if(err) {
        bot.createMessage(msg.channel.id, err)
        return
      }

      let fields = []
      let precip = result[0].forecast[1].precip + '%'
      if (result[0].forecast[1].precip === '')
        precip = '0%' 

      fields.push({name:result[0].forecast[1].day + f(' the %sth', result[0].forecast[1].date.slice(8)),
        value: f('High: **%s**\nLow: **%s**\nSky: **%s**\nPrecipitation: **%s**',
          result[0].forecast[1].high + degree, result[0].forecast[1].low + degree, result[0].forecast[1].skytextday, precip),
        inline:true})

      let embed = {
        embed: {
            author: {name: f("Today's forecast in %s ", result[0].location.name), icon_url: result[0].current.imageUrl},
            color: parseInt('0x4286f4', 16),
            fields: fields,
            footer: {text:'Part of the Broadcast Tower Integration Network'}
        }
      }

      let packet = {
        content: embed,
        destination: destination,
        type: 'subscription',
      }

      q.push(packet)
    })
  } catch (err) {
    console.log(err)
    bot.createMessage(config.logChannelID, err.message)
    bot.createMessage(msg.channel.id, f(reply.generic.error, msg.author.username))
  }
}