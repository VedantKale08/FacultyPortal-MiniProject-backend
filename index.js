const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const dotenv = require("dotenv");
const LectureHistory = require("./models/LectureHistory");

const app = express();

app.use(bodyParser.json());
app.use(cors())
dotenv.config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const Teacher = require("./models/Teacher");
const Message = require("./models/Message");


app.post("/api/teachers/register", async (req, res) => {
  try {
    const {
      fname,
      lname,
      email,
      phoneNumber,
      password,
      photo,
      departmentName,
      qualifications,
      subjects,
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = new Teacher({
      fname,
      lname,
      email,
      phoneNumber,
      password: hashedPassword,
      photo,
      departmentName,
      qualifications,
      subjects,
    });
    await teacher.save();
    const token = jwt.sign({ email: teacher.email }, "secretkey", {
      expiresIn: "30d",
    });
    res.json({ message: "Teacher registered successfully", token: token, data:teacher });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});



app.post("/api/teachers_admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (email === "admin" && password === "admin123") {
    const token = jwt.sign({ username: "admin" }, "secretkey", {
      expiresIn: "30d",
    });
    res.json({ data: {fname:"admin"}, token });
    return;
  }
  const teacher = await Teacher.findOne({ email });
  if (teacher && bcrypt.compareSync(password, teacher.password)) {
    const token = jwt.sign({ email: teacher.email }, "secretkey", {
      expiresIn: "30d",
    });
    res.json({ data:teacher, token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}



app.put("/api/teachers/profile", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const {
          fname,
          lname,
          email,
          phoneNumber,
          photo,
          departmentName,
          qualifications,
          subjects,
        } = req.body;
        const updatedTeacher = await Teacher.findOneAndUpdate(
          { email },
          {
            fname,
            lname,
            phoneNumber,
            photo,
            departmentName,
            qualifications,
            subjects,
          },
          { new: true }
        );
        res.json({
          message: "Teacher profile updated successfully",
          updatedTeacher,
        });
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
});



app.get("/api/teachers/profile", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const teacher = await Teacher.findOne({ email: authData.email });
        res.json(teacher);
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
});




app.put("/api/teachers/lectures/:lectureId", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const { topicsCovered, attendance } = req.body;

        const teacher = await Teacher.findOne({ email: authData.email });
        if (!teacher) {
          return res.status(404).json({ message: "Teacher not found" });
        }

        const subject = teacher.subjects.id(req.params.lectureId);
        if (!subject) {
          return res.status(404).json({ message: "Subject/lecture not found" });
        }

        let lectureHistory = await LectureHistory.findOne({
          teacher: teacher._id,
          subject: subject._id,
        });

        if (!lectureHistory) {
          lectureHistory = new LectureHistory({
            teacher: teacher._id,
            program: subject.program,
            course: subject.course,
            year: subject.year,
            timeSlot: subject.timeSlot,
            topicsCovered,
            attendance,
          });
        } else {
          lectureHistory.topicsCovered = topicsCovered;
          lectureHistory.attendance = attendance;
        }

        await lectureHistory.save();

        res.json({
          message: "Lecture history updated successfully",
          lectureHistory,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
});



app.get('/api/teachers/history', verifyToken, async (req, res) => {
  jwt.verify(req.token, 'secretkey', async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const id = await Teacher.findOne({email: authData.email});
        const lectureHistory = await LectureHistory.find({ teacher: id });
        res.json({ lectureHistory, teacher:id });
      } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
});



app.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});



app.get("/api/teachers/all_history", async (req, res) => {
  try {
    const teachers = await Teacher.find();

    let allHistory = [];

    for (const teacher of teachers) {
      const id = teacher._id;
      const lectureHistory = await LectureHistory.find({ teacher: id });
      allHistory.push({ teacher: teacher, lectureHistory: lectureHistory });
    }

    res.json(allHistory);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});



app.put("/api/lecturehistory/:id", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const { topicsCovered, attendance } = req.body;

        const lectureHistory = await LectureHistory.findById(req.params.id);

        if (!lectureHistory) {
          return res
            .status(404)
            .json({ message: "Lecture history entry not found" });
        }
        lectureHistory.topicsCovered = topicsCovered;
        lectureHistory.attendance = attendance;

        await lectureHistory.save();

        const id = await Teacher.findOne({ email: authData.email });
        const alllectureHistory = await LectureHistory.find({ teacher: id });

        res.json({
          message: "Lecture history entry updated successfully",
          data:alllectureHistory,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
});



app.delete("/api/lecturehistory/:id", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const deletedLectureHistory = await LectureHistory.findOneAndDelete({
          _id: req.params.id,
        });

        if (!deletedLectureHistory) {
          return res
            .status(404)
            .json({ message: "Lecture history entry not found" });
        }

        const id = await Teacher.findOne({ email: authData.email });
        const alllectureHistory = await LectureHistory.find({ teacher: id });

        res.json({
          message: "Lecture history entry deleted successfully",
          data: alllectureHistory,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
});



app.get("/api/admin_dashboard", async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const totalLectures = await LectureHistory.countDocuments();

    const totalAttendance = await LectureHistory.aggregate([
      { $group: { _id: null, totalAttendance: { $sum: "$attendance" } } },
    ]);
    const avgAttendance =
      totalAttendance.length > 0
        ? totalAttendance[0].totalAttendance / totalLectures
        : 0;
    res.json({ totalTeachers, avgAttendance, totalLectures});
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});



app.get("/api/dashboard",verifyToken, async (req, res) => {
   jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
        try {
         const id = await Teacher.findOne({ email: authData.email });
         const totalStudentsCursor = await LectureHistory.find({
           teacher: id,
         }).select("attendance");
         let totalStudents = 0;
         totalStudentsCursor.forEach((lecture) => {
           totalStudents += lecture.attendance;
         });

          const totalLectures = await LectureHistory.countDocuments({
            teacher: id,
          });

          const avgAttendance = totalStudents / totalLectures;     

          const totalClasses = totalLectures;

          res.json({
            totalStudents:
              totalStudents.length > 0 ? totalStudents[0].totalStudents : 0,
            avgAttendance,
            totalClasses,
          });
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: "Internal server error" });
        }
    }
  })
});



app.get("/api/teacher_timetable", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
         const timetableData = await Teacher.findOne({
           email: authData.email,
         }).select("subjects -_id");
        res.json(timetableData.subjects);
      } catch (error) {
        console.error("Error fetching timetable data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }});
});



app.post("/api/teachers/addSubject", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      const { course, program, year, weekday, startTime, endTime } = req.body;

      try {
        const teacher = await Teacher.findOne({email:authData.email});
        if (!teacher) {
          return res.status(404).json({ error: "Teacher not found" });
        }

        teacher.subjects.push({
          course,
          program,
          year,
          timeSlot: { weekday, startTime, endTime },
        });

        await teacher.save();

        res
          .status(201)
          .json({ message: "Subject added successfully", teacher });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
      }
    }
  });
});

app.post("/api/message", async (req, res) => {
  try {
    const { to_all, teacher_email, subject, message } = req.body;
    const messageData = new Message({
      to_all,
      teacher_email,
      subject,
      message
    });
    await messageData.save();
    res.json({
      message: "Message sent successfully",
      data: messageData,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
})

app.get("/api/message", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const data = await Message.find({
          $or: [{ teacher_email: authData.email }, { to_all: true }],
        });
        res.json(data);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
