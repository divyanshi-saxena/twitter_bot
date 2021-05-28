const { Router } = require('express')
const router = Router()
const controller = require('../controllers/apiController')
const { ensureAuth } = require('../middlewares/authMiddleware')

// 1. GET MY RECENT TWEETS
router.get('/my_recent_tweets', ensureAuth, controller.my_recent_tweets)

// 2. FOLLOW SOMEONE
router.get('/follow', ensureAuth, (req, res) => { res.render('apis/follow') })
router.post('/follow', ensureAuth, controller.follow)

// 3. GET MY FOLLOWERS' RECENT TWEETS
router.get('/followers_recent_tweets', ensureAuth, controller.followers_recent_tweets)

// 4. GET 'FOLLOWING' LIST FROM THE DATABASE
router.get('/following_list', ensureAuth, controller.following_list)

// 5. GET 'FOLLOWERS' LIST FROM THE DATABASE
router.get('/followers_list', ensureAuth, controller.followers_list)

// 6. GET TWEETS WRITTEN BY BOT
router.get('/tweets_written_by_bot', ensureAuth, controller.tweets_written_by_bot)

module.exports = router