const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  isVideo: { type: Boolean },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isPublish: {
    type: Boolean,
  },
  link: {
    type: String,
  },
  description: {
    type: String,
  },
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);
const Link = mongoose.model("Link", linkSchema);

module.exports = { User, Link };
