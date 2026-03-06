const { MongoClient, ObjectId } = require('mongodb');

process.env.MONGODB_URI = 'mongodb://buhackdb:yEFgtnLDSvqLtwmo2cwI3k7QK30IZWg4h0dyUzzxuLWWypu5QqkQPRvWAK9iUiDjzjii5lbWGEVpACDb4bIunA==@buhackdb.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@buhackdb@';

if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Connect to MongoDB
async function connectToDB() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('bookingsDB');
    db.client = client;
    return db;
}

module.exports = { connectToDB, ObjectId };