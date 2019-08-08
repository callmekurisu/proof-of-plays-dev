const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const SongSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  plays: {
    type: Number,
    default: 0
  },
  passcode: {
    type: String
  },
  autopay: {
    type: String
  },
  macaroon: {
    type: String
  },
  pubkey: {
    type: String
  },
  explicit: {
    type: Boolean,
    required: true
  },
  audio: {
    type: String,
    required: true
  },
  // List of pubkeys with permanent access
  owner: {
    type: [String]
  },
  comment: [
    {
      text: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      },
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Song = mongoose.model('songs', SongSchema);