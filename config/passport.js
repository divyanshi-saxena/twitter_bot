const TwitterStrategy = require('passport-twitter').Strategy
const User = require('../models/user')

module.exports = function (passport) {
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_API_KEY,
    consumerSecret: process.env.TWITTER_API_SECRET,
    callbackURL: '/auth/twitter/callback',
    // proxy: true
    },
    async (token, tokenSecret, profile, done) => {
      const newUser = {
        twitterId: profile.id,
        displayName: profile.displayName,
        screenName: profile.username,
        image: profile.photos[0].value,
        accessToken: token,
        accessTokenSecret: tokenSecret
      }
      try {
        let user = await User.findOne({ twitterId: profile.id })
        if (user) {
          done(null, user)
        }
        else {
          user = await User.create(newUser)
          done(null, user)
        }
      } catch (err) {
        console.log(err)
      }
    })
  )
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user))
  })
}