const multer = require('multer');
var express = require('express');
var path = require('path');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.post('/user', async function (req, res) {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.body.userid);

    // Define new user object
    const newUser = {
      userid,
      password: req.body.password,
      role: "user",
      created_at: new Date(),
      modified_at: new Date()
    };

    // ✅ Use upsert with $setOnInsert for userlogs
    await db.collection("userlogs").updateOne(
      { userid },                // match by userid
      { $setOnInsert: newUser }, // only insert if not exists
      { upsert: true }
    );

    // ✅ Ensure profile exists in userprofiles (no duplicates)
    await db.collection("userprofiles").updateOne(
      { id: userid },
      {
        $setOnInsert: {
          department: null,
          year_of_study: null,
          medals: 0,
          lastModified: new Date() // set at creation
        }
      },
      { upsert: true }
    );

    // Redirect to user homepage
    res.redirect(`/user/${userid}`);
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

router.get('/user/:id', async (req, res) => {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.params.id);

    // Current user's profile
    const profile = await db.collection("userprofiles").findOne({ id: userid });

    // Ongoing task for this user
    const ongoingTask = await db.collection("ongoing").findOne({ userId: userid });

    let taskDetails = null;
    if (ongoingTask) {
      taskDetails = await db.collection("tasks").findOne({
        taskName: ongoingTask.taskName,
        adminId: ongoingTask.adminId
      });
    }

    // Rival: find one pair where user1 = userid
    const rivalPair = await db.collection("pairs").findOne({ user1: userid });
    let rivalOngoing = null;
    if (rivalPair) {
      rivalOngoing = await db.collection("ongoing").findOne({ userId: rivalPair.user2 });
    }

    // Leaderboard
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

router.get('/admin/:id', async (req, res) => {
  const db = await connectToDB();
  try {
    const userid = parseInt(req.params.id);

    // Get the current user's profile
    const profile = await db.collection("userlogs").findOne({ userid: userid });

    // Step 1: Fetch all documents without sorting
    const students = await db.collection("userprofiles").find({}).toArray();

    // Step 2: Sort in Node.js (default tie-breaking: medals only)
    const topStudents = students
      .sort((a, b) => b.medals - a.medals) // highest medals first
      .slice(0, 5);                        // keep top 5

    res.render('admin', {
      userid: profile.userid,
      medals: profile.medals,
      topStudents
    });
  } finally {
    await db.client.close();
  }
});

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

router.post('/admin/:id/create', (req, res) => {
  const { id } = req.params;

  // You can do any pre-checks or logging here
  console.log(`Admin ${id} clicked Create`);

  // Redirect to GET route that serves the form
  res.redirect(`/admin/${id}/create/form`);
});

// GET route: serve the create-task form
router.get('/admin/:id/create/form', (req, res) => {
  const { id } = req.params;

  // If using EJS template:
  res.render('task-create', { adminId: id });

  // Or if serving static HTML:
  // res.sendFile(path.join(__dirname, '../public/task-create.html'));
});


// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// POST route: handle task creation
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

      // If odd number, drop the last student
      const usableCount = students.length % 2 === 0 ? students.length : students.length - 1;

      for (let i = 0; i < usableCount; i += 2) {
        const s1 = students[i];
        const s2 = students[i + 1];

        // Associative pair (A↔B and B↔A)
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
    // Redirect back to admin dashboard
    res.redirect(`/admin/${adminId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating task");
  } finally {
    await db.client.close();
  }
});

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

module.exports = router;
