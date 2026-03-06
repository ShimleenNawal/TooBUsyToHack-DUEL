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
    const newUser = {
      userid: parseInt(req.body.userid),   
      password: req.body.password,         
      role: "user",                        
      created_at: new Date(),
      modified_at: new Date()
    };

    // Insert into MongoDB
    let result = await db.collection("userlogs").insertOne(newUser);
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    res.status(400).json({ message: err.message });
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

module.exports = router;
