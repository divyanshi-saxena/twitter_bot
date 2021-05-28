const mongoose = require('mongoose')

// Schema for storing FOLLOWING list
const FriendSchema = new mongoose.Schema({
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
    default: "following"
  },
  accountName: {
    type: String,
    required: true
  }
})
FriendSchema.index({
  userId: 1,
  accountName: 1
}, {
  unique: true
})
module.exports = mongoose.model('friend', FriendSchema)