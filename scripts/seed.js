const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function upsertCollection(db, collectionName, items, filterKeyFn) {
  const collection = db.collection(collectionName);
  let upsertedCount = 0;
  let modifiedCount = 0;
  let matchedCount = 0;

  if (items.length === 0) {
    return { collectionName, total: 0, upsertedCount, modifiedCount, matchedCount };
  }

  const operations = items.map(item => {
    const filter = filterKeyFn(item);
    return {
      updateOne: {
        filter: filter,
        update: { $set: item },
        upsert: true
      }
    };
  });

  const result = await collection.bulkWrite(operations, { ordered: false });
  upsertedCount = result.upsertedCount || 0;
  modifiedCount = result.modifiedCount || 0;
  matchedCount = result.matchedCount || 0;

  return {
    collectionName,
    total: items.length,
    upsertedCount,
    modifiedCount,
    matchedCount
  };
}

async function runSeed() {
  console.log('====================================================');
  console.log('    PROTOTYPE DATA FOUNDATION — MONGODB SEEDING    ');
  console.log('====================================================\n');

  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sih2_db';
  let memoryServer = null;
  let client = null;

  try {
    // Attempt standard connection
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    console.log(`Connected to MongoDB instance at: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
  } catch (connErr) {
    console.warn(`Could not connect to external MongoDB at "${uri}": ${connErr.message}`);
    console.log('Spinning up in-memory MongoDB server for seed verification...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      client = new MongoClient(uri);
      await client.connect();
      console.log(`Connected to MongoMemoryServer at: ${uri}`);
    } catch (memErr) {
      console.error('Failed to start in-memory MongoDB server:', memErr.message);
      process.exit(1);
    }
  }

  try {
    const db = client.db();

    // Load static datasets
    const roles = loadJson('roles.json');
    const skills = loadJson('skills.json');
    const competencies = loadJson('competencies.json');
    const roleCompetencies = loadJson('role_competencies.json');
    const igotCourses = loadJson('igot_courses.json');
    const nsstaCourses = loadJson('nssta_courses.json');
    const allCourses = [...igotCourses, ...nsstaCourses];

    console.log('\nStarting idempotent upserts into MongoDB collections...\n');

    // 1. Seed roles
    const rolesRes = await upsertCollection(db, 'roles', roles, item => ({ role_id: item.role_id }));
    console.log(` Collection [roles]: ${rolesRes.total} total | ${rolesRes.upsertedCount} inserted | ${rolesRes.matchedCount} matched/updated`);

    // 2. Seed skills
    const skillsRes = await upsertCollection(db, 'skills', skills, item => ({ skill_id: item.skill_id }));
    console.log(` Collection [skills]: ${skillsRes.total} total | ${skillsRes.upsertedCount} inserted | ${skillsRes.matchedCount} matched/updated`);

    // 3. Seed competencies
    const compRes = await upsertCollection(db, 'competencies', competencies, item => ({ competency_id: item.competency_id }));
    console.log(` Collection [competencies]: ${compRes.total} total | ${compRes.upsertedCount} inserted | ${compRes.matchedCount} matched/updated`);

    // 4. Seed role_competencies
    const rcRes = await upsertCollection(db, 'role_competencies', roleCompetencies, item => ({
      role_id: item.role_id,
      competency_id: item.competency_id
    }));
    console.log(` Collection [role_competencies]: ${rcRes.total} total | ${rcRes.upsertedCount} inserted | ${rcRes.matchedCount} matched/updated`);

    // 5. Seed courses (iGOT + NSSSTA)
    const coursesRes = await upsertCollection(db, 'courses', allCourses, item => ({ course_id: item.course_id }));
    console.log(` Collection [courses]: ${coursesRes.total} total | ${coursesRes.upsertedCount} inserted | ${coursesRes.matchedCount} matched/updated`);

    // Ensure Indexes
    await db.collection('roles').createIndex({ role_id: 1 }, { unique: true });
    await db.collection('skills').createIndex({ skill_id: 1 }, { unique: true });
    await db.collection('competencies').createIndex({ competency_id: 1 }, { unique: true });
    await db.collection('role_competencies').createIndex({ role_id: 1, competency_id: 1 }, { unique: true });
    await db.collection('courses').createIndex({ course_id: 1 }, { unique: true });
    await db.collection('courses').createIndex({ source: 1 });

    console.log('\nIndexes created successfully for all collections.');
    console.log('\n--- Seed Execution Summary ---');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================\n');
  } finally {
    if (client) await client.close();
    if (memoryServer) await memoryServer.stop();
  }
}

if (require.main === module) {
  runSeed().catch(err => {
    console.error('Fatal seed error:', err);
    process.exit(1);
  });
}

module.exports = { runSeed };
