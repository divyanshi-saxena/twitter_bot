const mongoose = require('mongoose')

// Schema for tweets WRITE by the bot
const WriteSchema = new mongoose.Schema({
  tweetId: {
    type: String,
    required: true,
  },
  tweetMsg: {
    type: String,
    required: true
  },
  taggedFriend: {
    type: String,
    required: true
  },
  friendUserId: {
    type: String,
    required: true
  },
  createdAt: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  }
})

WriteSchema.index({
  tweetId: 1,
  accountName: 1
}, {
  unique: true
})

module.exports = mongoose.model('write', WriteSchema)