const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema(
  {
    name: String,
    username: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    verification_code: { type: String, default: null },
    avatar: { type: String, default: null },
    role: {
      type: String,
      required: true,
      default: 'user'
    },
    age: {
      type: Number,
      default: 0
    },
    gender: String,
  },
  {
    timestamps: true,
    minimize: false,
  }
);

module.exports = mongoose.model("Users", UserSchema);