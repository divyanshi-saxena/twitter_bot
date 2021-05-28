require('dotenv').config()
const express = require('express')
const app = express()
const connectDB = require('./config/db')
const cors = require('cors')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const apiRoutes = require('./routes/apiRoutes')
const { ensureGuest, ensureAuth } = require('./middlewares/authMiddleware')
const { random_tweet } = require('./cron-job/index')

// CONFIGURING PASSPORT JS
require('./config/passport')(passport)

// MIDDLEWARES
app.use(express.static('public'))
// app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

// VIEW ENGINE
app.set('view engine', 'ejs')

// CONNECTING TO DATABASE
connectDB()

// EXPRESS SESSION MIDDLEWARE
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,  
  // cookie: { secure: true }, 
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  })
}))

// PASSPORT MIDDLEWARE
app.use(passport.initialize())
app.use(passport.session())

// SET 'USER' AS GLOBAL VARIABLE
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

// ROUTES

// 1. AUTH ROUTES: HOME PAGE
app.get('/', ensureGuest, (req, res) => {
  res.render('login')
})

// 2. AUTH ROUTES: DASHBOARD PAGE
app.get('/dashboard', ensureAuth, async (req, res) => {
  res.render('dashboard', {
    name: req.user.displayName,
  })
})

// 3. AUTH ROUTES: LOGIN TO TWITTER
app.get('/login/twitter', passport.authenticate('twitter', { scope: ['profile'] }))

// 4. AUTH ROUTES: TWITTER CREDENTIALS AUTHENTICATED AND REDIRECTED TO BELOW CALLBACK 
app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  failureRedirect: '/'
}), (req, res) => {
  random_tweet(req.user)
  res.redirect('/dashboard')
})

// 5. ROUTE FOR LOGOUT
app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

// API ROUTES MIDDLEWARE
app.use('/api', apiRoutes)

// PORT SET UP
const port = process.env.PORT || 3000

// STARTING SERVER
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
})