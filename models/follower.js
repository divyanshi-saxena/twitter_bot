const mongoose = require('mongoose')

// Schema for storing FOLLOWERS list
const FollowerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true,
    default: "follower"
  },
  accountName: {
    type: String,
    required: true
  }
})
FollowerSchema.index({
  userId: 1,
  accountName: 1
}, {
  unique: true
})
module.exports = mongoose.model('follower', FollowerSchema)