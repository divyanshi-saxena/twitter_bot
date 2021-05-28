const twit = require('twit')
const read = require('../models/read')
const write = require('../models/write')
const friend = require('../models/friend')
const follower = require('../models/follower')

module.exports.my_recent_tweets = (req, res) => {
  const screen_name = req.user.screenName
  const T = new twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: req.user.accessToken,
    access_token_secret: req.user.accessTokenSecret
  })
  T.get('statuses/user_timeline', { screen_name }, async (err, data, response) => {
    if (err) {
      console.log('ERROR: MY_RECENT_TWEETS - ', err)
      res.status(500).render('errors/error_500')
    }
    else if (data) {
      let arr = []
      // Loop through the returned tweets
      for (let i = 0; i < data.length; i++) {
        // Get relevant information from the returned data
        let tweetId = data[i].id_str
        let tweetMsg = data[i].text
        let createdAt = data[i].created_at
        let userName = data[i].user.screen_name
        let userId = data[i].user.id_str

        // Storing all new objects in array to check later for any deletions and update database accordingly
        arr.push(tweetId)

        // Storing in the database
        let obj = { tweetId, tweetMsg, userName, userId, createdAt, accountName: req.user.screenName }
        try {
          await read.create(obj)
          console.log('collection updated for data ', i+1)
        } catch {
          console.log('already updated in database ', i+1)
        }
      }
      // Finding tweet(s) which have been deleted using direct access to twitter
      read.find({ $and: [{ "tweetId": { $nin: arr } }, { "isValid": true }, { "userName": screen_name }, { "accountName": req.user.screenName }] }).lean().then((response) => {
        if (response != null) {
          for (let j = 0; j < response.length; j++){
            read.findByIdAndUpdate(response[j]._id, { isValid: false }, { new: true }).lean().then((r) => {
              console.log('Tweet with ID ', response[j].tweetId, ' has been deleted so isValid is set to false')
              console.log(r)
            }).catch(() => {
              console.log('Error in updating document of deleted tweet with ID ', response[j].tweetId)
              res.status(500).render('errors/error_500')
            })
          }
        }
      }).catch((e) => {
        console.log('Error in fetching deleted document data')
        res.status(500).render('errors/error_500')
      }).then(() => {
        read.find({ $and: [{ "userName": screen_name }, { "isValid": true }, { "accountName": req.user.screenName } ] }).select('tweetMsg createdAt -_id').lean().then((response) => {
          console.log("MY RECENT TWEETS")
          console.log(response)
          let arr = []
            response.forEach(r => {
              let date = Date.parse(r.createdAt)
              let d = (new Date(date)).toDateString()
              let t = (new Date(date)).toLocaleTimeString()
              let obj = { tweetMsg: r.tweetMsg, date: d, time: t }
              arr.push(obj)
            })
          res.render('apis/my_recent_tweets', { arr })
        }).catch(() => {
          console.log("Error in my recent tweets"); 
          res.status(500).render('errors/error_500')
        })
      })
    }
  })
}

module.exports.follow = (req, res) => {
  const T = new twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: req.user.accessToken,
    access_token_secret: req.user.accessTokenSecret
  })
  if (!req.body || !req.body.name || req.body.name == null) {
    res.status(400).json({ code: 1 ,errorMsg: "please enter a user screen name" })
  }
  else if (req.body.name.charAt(0) == '@') {
    res.status(400).json({ code: 2 ,errorMsg: "please do not enter '@' symbol" })
  }
  else {
    const screen_name = req.body.name
    T.get('users/show', { screen_name }, (err, data, response) => {
      if (err) {
        console.log("Error in users/show")
        res.status(500).json({ code: 0 })
      }
      else if (data.errors) {
        res.status(400).render({ code: 3, errorMsg: "entered user account is either private or doesn't exist" })        
      }
      else {
        T.post('friendships/create', { screen_name }, (err, data, response) => {
          if (err) {
            console.log('ERROR: FOLLOW - ', err)
            res.status(500).json({ code: 0 })
          }
          else if (data) {
            let id = data.id_str
            let name = data.name
            let status = data.status.text
            console.log('You have successfully followed ID '+ id + ' or @' + name)
            console.log('Recent status: ' + status)
            res.status(200).json({name})
          }
        })
      }
    })
  }
}

module.exports.followers_recent_tweets = (req, res) => {
  const screen_name = req.user.screenName
  const T = new twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: req.user.accessToken,
    access_token_secret: req.user.accessTokenSecret
  })
  T.get('followers/list', { screen_name, stringify_ids: true }, (err, data, response) => {
    if (err) {
      console.log('ERROR: FOLLOWERS_RECENT_TWEETS - ', err)
      res.status(500).render('errors/error_500')
    }
    else if (data.users.length == 0) {
      res.render('apis/followers_recent_tweets', { code: 0, noData: "Unfortunately, you have 0 followers" })
    }
    else if (data.users) {
      // Traversing all IDs of followers
      for (let i = 0; i < data.users.length; i++){
        const arr = []
        let user_id = data.users[i].id_str
        let user_name = data.users[i].screen_name
        console.log('ID ', i+1, ' = ', user_id, user_name)
        T.get('statuses/user_timeline', { user_id }, async (err, data, response) => {
          if (err) {
            console.log('ERROR: FOLLOWERS_RECENT_TWEETS - ', err)
            res.status(500).render('errors/error_500')
          }
          else if (data) {
            // Traversing all tweets of each follower
            for (let j = 0; j < data.length; j++) {
              let tweetId = data[j].id_str
              let tweetMsg = data[j].text
              let createdAt = data[j].created_at
              let userName = data[j].user.screen_name
              let userId = data[j].user.id_str
              let obj = { tweetId, tweetMsg, userName, userId, createdAt, accountName: req.user.screenName }
              arr.push(tweetId)
              try {
                await read.create(obj)
                console.log('collection updated for user ', i + 1, ' status ', j + 1)
              }
              catch {
                console.log('already updated status ', j + 1, ' in database for user ', i + 1)
              }
            }
            // Checking for followers' tweets that may have been deleted, and updating database accordingly
            read.find({ $and: [{ "tweetId": { $nin: arr } }, { "isValid": true }, { "userName": user_name }, { "accountName": req.user.screenName }] })
              .lean().then((response) => {
                if (response != null) {
                  for (let k = 0; k < response.length; k++){
                    read.findByIdAndUpdate(response[k]._id, { isValid: false }, { new: true }).lean().then((r) => {
                      console.log('Tweet with ID ', response[k].tweetId, ' has been deleted so isValid is set to false')
                      console.log(r)
                    }).catch(() => {
                      console.log('Error in updating document of deleted tweet with ID ', response[k].tweetId)
                      res.status(500).render('errors/error_500')
                    })
                  }
                }
              }).catch(() => {
                console.log("error in followers' deleted tweets");
                res.status(500).render('errors/error_500')
              }).then(() => {
                read.find({ $and: [{ "userName": { $ne: screen_name } }, { "isValid": true }, { "accountName": req.user.screenName }] }).select("tweetMsg userName createdAt -_id")
                  .lean().then((re) => {
                    console.log(re)
                    if (re != null) {
                      let array = []
                      re.forEach(r => {
                        let date = Date.parse(r.createdAt)
                        let d = (new Date(date)).toDateString()
                        let t = (new Date(date)).toLocaleTimeString()
                        let object = { tweetMsg: r.tweetMsg, date: d, time: t, userName: r.userName }
                        array.push(object)
                      })
                      res.render('apis/followers_recent_tweets', { code: 1, array })
                    }
                  }).catch(() => {
                    console.log("Error in fetching followers recent tweets")
                    res.status(500).render('errors/error_500')
                  })
              })
          }
        })
      }      
    }
  })
}

module.exports.following_list = (req, res) => {
  const screen_name = req.user.screenName
  const T = new twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: req.user.accessToken,
    access_token_secret: req.user.accessTokenSecret
  })
  T.get('friends/list', { screen_name }, async (err, data, response) => {
    let arr = []
    if (err) {
      console.log('Error in fetching friends list - ', err)
      res.status(500).render('errors/error_500')
    }
    else if (data.users.length == 0) {
      res.render('apis/following_list', { code: 0, noData: "You are not following anyone" })
    }
    else if (data.users) {
      for (let i = 0; i < data.users.length; i++) {
        let userId = data.users[i].id_str
        let userName = data.users[i].screen_name
        arr.push(userId)
        let obj = { userId, userName, accountName: req.user.screenName }
        try {
          await friend.create(obj)
          console.log("user @", userName, "updated in the database")
        }
        catch {
          console.log("user @", userName, "already present in the database")
        }
      }
      friend.find({ $and: [{ "userId": { $nin: arr } }, { "accountName": req.user.screenName }] }).lean().then((response) => {
        if (response != null) {
          console.log(screen_name, "no longer follows below twitter user(s): ", response)
          for (let j = 0; j < response.length; j++){
            friend.findByIdAndDelete(response[j]._id).then(() => {
              console.log("User", response[j].userName, "removed from 'following' db")
            }).catch(() => {
              console.log("Unable to delete", response[j].userName, "from 'following' db")
            })
          }
        }
      }).catch((e) => {
        console.log("Error in fetching data from database - 1 ", e)
        res.status(500).render('errors/error_500')
      }).then(() => {
        friend.find({ "accountName": req.user.screenName }).lean().then((resp) => {
          if (resp != null) {
            console.log("Following list: ")
            resp.forEach(r => {
              console.log(r.userName)
            })
          }
          res.status(200).render('apis/following_list', { code: 1, resp })
        }).catch((e) => {
          console.log('Error in fetching data from database for following list - 2 ', e)
          res.status(500).render('errors/error_500')
        })
      })
    }
  })
}

module.exports.followers_list = (req, res) => {
  const screen_name = req.user.screenName
  const T = new twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: req.user.accessToken,
    access_token_secret: req.user.accessTokenSecret
  })
  T.get('followers/list', { screen_name }, async (err, data, response) => {
    let arr = []
    if (err) {
      console.log("ERROR IN FOLLOWERS LIST", err)
      res.status(500).render('errors/error_500')
    }
    else if (data.users.length == 0) {
      res.render('apis/followers_list', { code: 0, noData: "Unfortunately, you have 0 followers" })
    }
    else if (data) {
      for (let i = 0; i < data.users.length; i++) {
        let userId = data.users[i].id_str
        let userName = data.users[i].screen_name
        arr.push(userId)
        let obj = { userId, userName, accountName: req.user.screenName }
        try {
          await follower.create(obj)
          console.log("user @", userName, "updated in the database")
        }
        catch {
          console.log("user @", userName, "already present in the database")
        }
      }
      follower.find({ $and: [{ "userId": { $nin: arr } }, { "accountName": req.user.screenName }]}).lean().then(async (response) => {
        if (response != null) {
          console.log("Below user(s) no longer follow @", screen_name, ': ', response)
          for (let j = 0; j < response.length; j++){
            try {
              await follower.findByIdAndDelete(response[j]._id)
              console.log("User", response[j].userName, "removed from 'followers' db")
            }
            catch {
              console.log("Unable to delete", response[j].userName, "from 'followers' db")
            }
          }
        }
      }).catch((e) => {
        console.log("Error in fetching data from database - ", e)
        res.status(500).render('errors/error_500')
        }).then(() => {
          follower.find({ "accountName": req.user.screenName }).lean().then((resp) => {
            if (resp != null) {
              console.log("Followers list of @", screen_name, " is below:")
              resp.forEach(r => {
                console.log(r.userName)
              })
            }
            res.render('apis/followers_list', { code: 1, resp })
          }).catch((e) => {
            console.log("Error in fetching follower list from db - ", e)
            res.status(500).render('errors/error_500')
          })
        })
    }
  })
}
module.exports.tweets_written_by_bot = (req, res) => {
  write.find({ "accountName": req.user.screenName }).select('tweetMsg createdAt -_id').lean().then((response) => {
    console.log("TWEETS WRITTEN BY BOT")
    console.log(response)
    if (response != null) {
      let arr = []
      response.forEach(r => {
        let date = Date.parse(r.createdAt)
        let d = (new Date(date)).toDateString()
        let t = (new Date(date)).toLocaleTimeString()
        let obj = { tweetMsg: r.tweetMsg, date: d, time: t }
        arr.push(obj)
      })
      res.status(200).render('apis/tweets_written_by_bot', { arr })
    }
  }).catch((e) => {
    console.log("Error in fetching tweets written by bot - ", e)
    res.status(500).render('errors/error_500')
  })
}