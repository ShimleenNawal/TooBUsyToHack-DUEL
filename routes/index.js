const multer = require('multer');
var express = require('express');
var path = require('path');
var router = express.Router();
require('dotenv').config();
const { connectToDB, ObjectId } = require('../utils/db');

//login page route
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

//login POST function, new user can be created, existing users logged in
//users are ONLY given user role, admin role needs to be changed in the backend
router.post('/user', async function (req, res) {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.body.userid);
    const password = req.body.password;

    const existingUser = await db.collection("userlogs").findOne({ userid });

    if (existingUser) {
      if (existingUser.password === password) {
        if (existingUser.role === "admin") {
          return res.redirect(`/admin/${userid}`);
        } else {
          return res.redirect(`/user/${userid}`);
        }
      } else {
        return res.status(401).send("Invalid password");
      }
    }

    const newUser = {
      userid,
      password,
      role: "user",
      created_at: new Date(),
      modified_at: new Date()
    };

    await db.collection("userlogs").insertOne(newUser);

    await db.collection("userprofiles").updateOne(
      { id: userid },
      {
        $setOnInsert: {
          department: null,
          year_of_study: null,
          medals: 0,
          lastModified: new Date()
        }
      },
      { upsert: true }
    );

    res.redirect(`/user/${userid}`);
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

//user side homepage
//includes leaderboard and the tasks and rival modals and settings
router.get('/user/:id', async (req, res) => {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.params.id);

    const profile = await db.collection("userprofiles").findOne({ id: userid });

    const ongoingTask = await db.collection("ongoing").findOne({ userId: userid });

    let taskDetails = null;
    if (ongoingTask) {
      taskDetails = await db.collection("tasks").findOne({
        taskName: ongoingTask.taskName,
        adminId: ongoingTask.adminId
      });
    }

    const rivalPair = await db.collection("pairs").findOne({ user1: userid });
    let rivalOngoing = null;
    if (rivalPair) {
      rivalOngoing = await db.collection("ongoing").findOne({ userId: rivalPair.user2 });
    }

    const students = await db.collection("userprofiles").find({}).toArray();
    const topStudents = students.sort((a, b) => b.medals - a.medals).slice(0, 5);

    res.render('userpage', {
      userid: profile.id,
      department: profile.department,
      year_of_study: profile.year_of_study,
      medals: profile.medals,
      topStudents,
      ongoingTask,
      taskDetails,
      rivalId: rivalPair ? rivalPair.user2 : null,
      rivalDeadline: rivalOngoing ? rivalOngoing.deadline.toISOString() : null,
      rivalSubmitted: rivalOngoing ? !!rivalOngoing.zipFile : false
    });
  } finally {
    await db.client.close();
  }
});

//delete existing task after deadline is made
async function cleanupExpiredTasks(db, adminId) {
  const now = new Date();

  const expiredTasks = await db.collection("tasks").find({
    adminId,
    deadline: { $lt: now }
  }).toArray();

  for (const task of expiredTasks) {
    await db.collection("tasks").deleteOne({ _id: task._id });
    await db.collection("ongoing").deleteMany({ taskName: task.taskName, adminId: task.adminId });
    await db.collection("pairs").deleteMany({ taskName: task.taskName, adminId: task.adminId });

    console.log(`Cleaned up expired task "${task.taskName}" for admin ${adminId}`);
  }
}

//admin homepage
//includes the create task and inbox modals and the leaderboard
router.get('/admin/:id', async (req, res) => {
  const db = await connectToDB();
  try {
    const adminId = parseInt(req.params.id);

    await cleanupExpiredTasks(db, adminId);

    const profile = await db.collection("userlogs").findOne({ userid: adminId });

    const students = await db.collection("userprofiles").find({}).toArray();

    const topStudents = students
      .sort((a, b) => b.medals - a.medals)
      .slice(0, 5);

    res.render('admin', {
      userid: profile.userid,
      medals: profile.medals || 0,
      topStudents
    });
  } finally {
    await db.client.close();
  }
});

//patch function to add data to user information (department and year)
router.patch('/user/:id/settings', async (req, res) => {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.params.id);
    await db.collection("userprofiles").updateOne(
      { id: userid },
      { $set: { department: req.body.department || null, year_of_study: req.body.year || null } }
    );
    res.json({ success: true });
  } finally {
    await db.client.close();
  }
});

//create form route
router.post('/admin/:id/create', async (req, res) => {
  const db = await connectToDB();
  try {
    const adminId = parseInt(req.params.id);

    const activeTask = await db.collection("tasks").findOne({
      adminId,
      deadline: { $gt: new Date() }
    });

    if (activeTask) {
      return res.send("You already have an active task. Wait until its deadline before creating a new one.");
    }

    res.redirect(`/admin/${adminId}/create/form`);
  } finally {
    await db.client.close();
  }
});

//create form route handler
router.get('/admin/:id/create/form', (req, res) => {
  const { id } = req.params;

  res.render('task-create', { adminId: id });

});

//for file management (send and recieve and download)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

//form handler for create task
router.post('/admin/:id/create/form', upload.single('taskZip'), async (req, res) => {
  const db = await connectToDB();
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const adminId = parseInt(req.params.id);
    const { taskName, taskDesc, year, dept, deadline } = req.body;

    const now = new Date();
    const deadlineDate = new Date(deadline);

    await db.collection("tasks").insertOne({
      adminId,
      taskName,
      taskDescription: taskDesc,
      attachedFile: req.file ? req.file.path : null,
      year: year,
      department: dept,
      createdAt: now,
      deadline: deadlineDate
    });

    const students = await db.collection("userprofiles").find({
      year_of_study: year,
      department: dept
    }).toArray();

    const ongoingEntries = students.map(student => ({
      taskName,
      adminId,
      userId: student.id,
      zipFile: null,
      created_at: now,
      modified_at: now,
      deadline: deadlineDate
    }));

    if (ongoingEntries.length > 0) {
      await db.collection("ongoing").insertMany(ongoingEntries);
    }

    if (students.length > 1) {
      const pairs = [];

      const usableCount = students.length % 2 === 0 ? students.length : students.length - 1;

      for (let i = 0; i < usableCount; i += 2) {
        const s1 = students[i];
        const s2 = students[i + 1];

        pairs.push({ user1: s1.id, user2: s2.id, taskName, adminId, created_at: now });
        pairs.push({ user1: s2.id, user2: s1.id, taskName, adminId, created_at: now });
      }

      console.log("Pairs generated:", pairs);

      if (pairs.length > 0) {
        await db.collection("pairs").insertMany(pairs);
      }
    } else {
      console.log("Not enough students to create pairs.");
    }
    res.redirect(`/admin/${adminId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating task");
  } finally {
    await db.client.close();
  }
});

//doesnt do much tbh
router.get('/user', async function (req, res) {
    const db = await connectToDB();
    try {
        let results = await db.collection("userlogs").find().toArray();
        res.render('userlogs', { userlogs: results });
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});

const uploadZip = multer({ storage: storage });

//submit form for task route (user submits task to admin)
router.post('/user/:id/submit', uploadZip.single('zipFile'), async (req, res) => {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.params.id);
    const filePath = req.file ? req.file.path : null;

    await db.collection("ongoing").updateOne(
      { userId: userid },
      { $set: { zipFile: filePath, modified_at: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

//submission tracker route
router.get('/admin/:id/inbox', async (req, res) => {
  const db = await connectToDB();
  try {
    const adminId = parseInt(req.params.id);

    const ongoingTasks = await db.collection("ongoing").find({ adminId }).toArray();

    const submissions = await Promise.all(
      ongoingTasks.map(async (task) => {
        const user = await db.collection("userprofiles").findOne({ id: task.userId });

        let submissionTime = null;
        if (task.zipFile) {
          const diff = new Date(task.deadline) - new Date(task.modified_at);
          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            submissionTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
          } else {
            submissionTime = "Late";
          }
        }

        return {
          taskName: task.taskName,
          userId: task.userId,
          zipFile: task.zipFile,
          submissionTime,
          medal: "no"
        };
      })
    );

    res.render('Submissions', { submissions });
  } finally {
    await db.client.close();
  }
});

//medal handler for users
router.patch('/admin/award/:userid', async (req, res) => {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.params.userid);
    if (req.body.medal) {
      await db.collection("userprofiles").updateOne(
        { id: userid },
        { $inc: { medals: 1 }, $set: { lastModified: new Date() } }
      );
    }
    res.json({ success: true });
  } finally {
    await db.client.close();
  }
});

module.exports = router;
