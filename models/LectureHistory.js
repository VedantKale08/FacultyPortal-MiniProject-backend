const mongoose = require("mongoose");

const lectureHistorySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    program: String,
    course: String,
    year: String,
    timeSlot: {
      weekday: String,
      startTime: String,
      endTime: String,
    },
    topicsCovered: [String],
    attendance: Number,
  },
  {
    timestamps: true,
  }
);

const LectureHistory = mongoose.model("LectureHistory", lectureHistorySchema);

module.exports = LectureHistory;
