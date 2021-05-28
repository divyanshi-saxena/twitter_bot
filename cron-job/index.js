const cron = require('node-cron')
const twit = require('twit')
const write = require('../models/write')

// 1. TWEET IN EVERY 30 MINUTES TAGGING RANDOMLY FROM FOLLOWING LIST

const random_number_generator = (max, min) => {
  return (Math.floor(Math.random() * (max - min)) + min)
}
module.exports.random_tweet = (user_obj) => {
  cron.schedule('*/30 * * * *', () => { 
    const screen_name = user_obj.screenName
    const T = new twit({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET,
      access_token: user_obj.accessToken,
      access_token_secret: user_obj.accessTokenSecret
    })
    T.get('friends/list', { screen_name }, (err, data, response) => {
      if (err) {
        console.log('ERROR IN GETTING FOLLOWING LIST ', err)
      }
      else if (data.users.length == 0) {
        console.log('PLEASE FOLLOW AT LEAST 1 TWITTER USER')
      }
      else if (data.users) {
        const random = random_number_generator(data.users.length, 0)
        const date = Date.now()
        const id = data.users[random].id_str;
        const name = data.users[random].screen_name;
        const status = '@' + name + ' : ' + date.toString()
        T.post('statuses/update', { status }, async function (err, data, response) {
          if (err) {
            console.log("Unable to update status at ", date.toTimeString())
          }
          else if (data) {
            let createdAt = data.created_at
            let tweetId = data.id_str
            let tweetMsg = data.text
            let taggedFriend = name
            let friendUserId = id

            let obj = { tweetId, tweetMsg, taggedFriend, friendUserId, createdAt, accountName: user_obj.screenName }
            try {
              await write.create(obj)
              console.log("Collection updated at", createdAt)
            } catch {
              console.log("Error in updating collection at ", createdAt)
            }
          }
        })
      }
    })
  })
}