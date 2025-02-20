const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
require('dotenv').config({ path: '.env.test' });

let mongoServer1, mongoServer2;

beforeAll(async () => {
  mongoServer1 = await MongoMemoryServer.create();
  mongoServer2 = await MongoMemoryServer.create();

  process.env.MONGO1_URI = mongoServer1.getUri().replace('?', '?authSource=admin&');
  process.env.MONGO2_URI = mongoServer2.getUri().replace('?', '?authSource=admin&');
  process.env.MONGO1_USERNAME = '';
  process.env.MONGO1_PASSWORD = '';
  process.env.MONGO2_USERNAME = '';
  process.env.MONGO2_PASSWORD = '';
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer1) {
    await mongoServer1.stop();
  }
  if (mongoServer2) {
    await mongoServer2.stop();
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany();
    }
  }
});
