const mongoose = require('mongoose')

// Schema for storing following and folowers list
const UserSchema = new mongoose.Schema({
  twitterId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  screenName: {
    type: String,
    required: true
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  accessToken: {
    type: String,
    required: true
  },
  accessTokenSecret: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('user', UserSchema)