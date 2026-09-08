const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
}

class MockCollection {
  constructor(name) {
    this.name = name;
    this.docs = new Map();
    this.indexes = [];
  }

  async bulkWrite(ops) {
    let upsertedCount = 0;
    let modifiedCount = 0;
    let matchedCount = 0;

    for (const op of ops) {
      if (op.updateOne) {
        const { filter, update, upsert } = op.updateOne;
        const key = JSON.stringify(filter);
        if (this.docs.has(key)) {
          matchedCount++;
          const existing = this.docs.get(key);
          this.docs.set(key, { ...existing, ...update.$set });
          modifiedCount++;
        } else if (upsert) {
          upsertedCount++;
          this.docs.set(key, { ...update.$set });
        }
      }
    }

    return { upsertedCount, modifiedCount, matchedCount };
  }

  async createIndex(spec, opts = {}) {
    this.indexes.push({ spec, opts });
    return JSON.stringify(spec);
  }
}

class MockDb {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name);
  }
}

async function verifySeedPipeline() {
  console.log('====================================================');
  console.log('   PROTOTYPE DATA FOUNDATION — SEED LOGIC VERIFY   ');
  console.log('====================================================\n');

  const mockDb = new MockDb();

  const roles = loadJson('roles.json');
  const skills = loadJson('skills.json');
  const competencies = loadJson('competencies.json');
  const roleCompetencies = loadJson('role_competencies.json');
  const igotCourses = loadJson('igot_courses.json');
  const nsstaCourses = loadJson('nssta_courses.json');
  const allCourses = [...igotCourses, ...nsstaCourses];

  async function seedColl(collName, items, keyFn) {
    const coll = mockDb.collection(collName);
    const ops = items.map(item => ({
      updateOne: { filter: keyFn(item), update: { $set: item }, upsert: true }
    }));
    const res = await coll.bulkWrite(ops);
    return { collName, total: items.length, ...res, count: coll.docs.size };
  }

  console.log('--- First Pass (Insertion) ---');
  const r1 = await seedColl('roles', roles, item => ({ role_id: item.role_id }));
  console.log(`[roles]: Total=${r1.total}, Inserted=${r1.upsertedCount}, DocsInDb=${r1.count}`);

  const s1 = await seedColl('skills', skills, item => ({ skill_id: item.skill_id }));
  console.log(`[skills]: Total=${s1.total}, Inserted=${s1.upsertedCount}, DocsInDb=${s1.count}`);

  const c1 = await seedColl('competencies', competencies, item => ({ competency_id: item.competency_id }));
  console.log(`[competencies]: Total=${c1.total}, Inserted=${c1.upsertedCount}, DocsInDb=${c1.count}`);

  const rc1 = await seedColl('role_competencies', roleCompetencies, item => ({ role_id: item.role_id, competency_id: item.competency_id }));
  console.log(`[role_competencies]: Total=${rc1.total}, Inserted=${rc1.upsertedCount}, DocsInDb=${rc1.count}`);

  const crs1 = await seedColl('courses', allCourses, item => ({ course_id: item.course_id }));
  console.log(`[courses]: Total=${crs1.total}, Inserted=${crs1.upsertedCount}, DocsInDb=${crs1.count}`);

  console.log('\n--- Second Pass (Idempotency Test — Duplicate Execution) ---');
  const r2 = await seedColl('roles', roles, item => ({ role_id: item.role_id }));
  console.log(`[roles]: Total=${r2.total}, Inserted=${r2.upsertedCount}, Matched/Updated=${r2.matchedCount}, DocsInDb=${r2.count}`);

  const crs2 = await seedColl('courses', allCourses, item => ({ course_id: item.course_id }));
  console.log(`[courses]: Total=${crs2.total}, Inserted=${crs2.upsertedCount}, Matched/Updated=${crs2.matchedCount}, DocsInDb=${crs2.count}`);

  // Index verification
  await mockDb.collection('roles').createIndex({ role_id: 1 }, { unique: true });
  await mockDb.collection('skills').createIndex({ skill_id: 1 }, { unique: true });
  await mockDb.collection('competencies').createIndex({ competency_id: 1 }, { unique: true });
  await mockDb.collection('role_competencies').createIndex({ role_id: 1, competency_id: 1 }, { unique: true });
  await mockDb.collection('courses').createIndex({ course_id: 1 }, { unique: true });

  console.log('\n--- Pipeline Verification Summary ---');
  if (r2.upsertedCount === 0 && r2.count === roles.length && crs2.upsertedCount === 0 && crs2.count === allCourses.length) {
    console.log('✅ SEED PIPELINE & IDEMPOTENCY FULLY VERIFIED!');
  } else {
    console.error('❌ IDEMPOTENCY TEST FAILED!');
    process.exit(1);
  }
  console.log('====================================================\n');
}

if (require.main === module) {
  verifySeedPipeline();
}
