const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true,
  },
  program: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  timeSlot: {
    weekday: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
});

const teacherSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  qualifications: {
    type: String,
    required: true,
  },
  photo: String,
  departmentName: {
    type: String,
    required: true,
  },
  subjects: [subjectSchema],
});

const Teacher = mongoose.model("Teacher", teacherSchema);

module.exports = Teacher;
