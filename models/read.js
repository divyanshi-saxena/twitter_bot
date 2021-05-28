const mongoose = require('mongoose')

// Schema for tweets READ by the bot
const ReadSchema = new mongoose.Schema({
  tweetId: {
    type: String,
    required: true
  },
  tweetMsg: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  createdAt: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    required: true,
    default: true
  },
  accountName: {
    type: String,
    required: true
  }
})

ReadSchema.index({
  tweetId: 1,
  accountName: 1
}, {
  unique: true
})
module.exports = mongoose.model('read', ReadSchema)