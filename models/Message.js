const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    to_all: Boolean,
    teacher_email: String,
    message: String,
    subject: String,
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Messages", messageSchema);

module.exports = Message;
