const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function runValidation() {
  console.log('====================================================');
  console.log('  PROTOTYPE DATA FOUNDATION — VALIDATION & CHECKS  ');
  console.log('====================================================\n');

  let errors = [];

  // Load Datasets
  const roles = loadJson('roles.json');
  const skills = loadJson('skills.json');
  const competencies = loadJson('competencies.json');
  const roleCompetencies = loadJson('role_competencies.json');
  const igotCourses = loadJson('igot_courses.json');
  const nsstaCourses = loadJson('nssta_courses.json');

  console.log(`Loaded ${roles.length} roles from data/roles.json`);
  console.log(`Loaded ${skills.length} skills from data/skills.json`);
  console.log(`Loaded ${competencies.length} competencies from data/competencies.json`);
  console.log(`Loaded ${roleCompetencies.length} role-competency mappings from data/role_competencies.json`);
  console.log(`Loaded ${igotCourses.length} iGOT course records from data/igot_courses.json`);
  console.log(`Loaded ${nsstaCourses.length} NSSSTA course records from data/nssta_courses.json`);
  console.log('----------------------------------------------------');

  // 1. Check Uniqueness of IDs
  const roleIdSet = new Set();
  roles.forEach((r, idx) => {
    if (!r.role_id) errors.push(`roles[${idx}] missing role_id`);
    else if (roleIdSet.has(r.role_id)) errors.push(`Duplicate role_id found: ${r.role_id}`);
    else roleIdSet.add(r.role_id);
  });

  const skillIdSet = new Set();
  skills.forEach((s, idx) => {
    if (!s.skill_id) errors.push(`skills[${idx}] missing skill_id`);
    else if (skillIdSet.has(s.skill_id)) errors.push(`Duplicate skill_id found: ${s.skill_id}`);
    else skillIdSet.add(s.skill_id);
  });

  const competencyIdSet = new Set();
  competencies.forEach((c, idx) => {
    if (!c.competency_id) errors.push(`competencies[${idx}] missing competency_id`);
    else if (competencyIdSet.has(c.competency_id)) errors.push(`Duplicate competency_id found: ${c.competency_id}`);
    else competencyIdSet.add(c.competency_id);
  });

  const courseIdSet = new Set();
  const allCourses = [...igotCourses, ...nsstaCourses];
  allCourses.forEach((crs, idx) => {
    if (!crs.course_id) errors.push(`courses[${idx}] missing course_id`);
    else if (courseIdSet.has(crs.course_id)) errors.push(`Duplicate course_id found: ${crs.course_id}`);
    else courseIdSet.add(crs.course_id);
  });

  // 2. Validate Role-Competency Mappings
  roleCompetencies.forEach((rc, idx) => {
    if (!roleIdSet.has(rc.role_id)) {
      errors.push(`role_competencies[${idx}] references invalid role_id: ${rc.role_id}`);
    }
    if (!competencyIdSet.has(rc.competency_id)) {
      errors.push(`role_competencies[${idx}] references invalid competency_id: ${rc.competency_id}`);
    }
    if (typeof rc.required_level !== 'number' || rc.required_level < 0 || rc.required_level > 100) {
      errors.push(`role_competencies[${idx}] has invalid required_level: ${rc.required_level} (must be between 0 and 100)`);
    }
  });

  // 3. Validate Course Relationships & Rules
  allCourses.forEach((crs, idx) => {
    if (crs.source !== 'iGOT' && crs.source !== 'NSSSTA') {
      errors.push(`Course ${crs.course_id} has invalid source: ${crs.source}`);
    }
    if (typeof crs.duration_hours !== 'number' || crs.duration_hours <= 0) {
      errors.push(`Course ${crs.course_id} has invalid duration_hours: ${crs.duration_hours} (must be > 0)`);
    }

    if (Array.isArray(crs.skills)) {
      crs.skills.forEach(sId => {
        if (!skillIdSet.has(sId)) {
          errors.push(`Course ${crs.course_id} references invalid skill_id: ${sId}`);
        }
      });
    } else {
      errors.push(`Course ${crs.course_id} missing skills array`);
    }

    if (Array.isArray(crs.competencies)) {
      crs.competencies.forEach(cId => {
        const compId = typeof cId === 'object' ? cId.competency_id : cId;
        if (!competencyIdSet.has(compId)) {
          errors.push(`Course ${crs.course_id} references invalid competency_id: ${compId}`);
        }
      });
    } else {
      errors.push(`Course ${crs.course_id} missing competencies array`);
    }

    if (Array.isArray(crs.target_roles)) {
      crs.target_roles.forEach(rId => {
        if (!roleIdSet.has(rId)) {
          errors.push(`Course ${crs.course_id} references invalid role_id: ${rId}`);
        }
      });
    } else {
      errors.push(`Course ${crs.course_id} missing target_roles array`);
    }
  });

  // Summary Report
  console.log('\n--- Validation Result Summary ---');
  if (errors.length === 0) {
    console.log('✅ ALL VALIDATIONS PASSED SUCCESSFULY!');
    console.log(`- Roles validated: ${roles.length}`);
    console.log(`- Skills validated: ${skills.length}`);
    console.log(`- Competencies validated: ${competencies.length}`);
    console.log(`- Mappings validated: ${roleCompetencies.length}`);
    console.log(`- iGOT Courses validated: ${igotCourses.length}`);
    console.log(`- NSSSTA Courses validated: ${nsstaCourses.length}`);
    console.log(`- Total Courses validated: ${allCourses.length}`);
    console.log('====================================================\n');
    return true;
  } else {
    console.error(`❌ VALIDATION FAILED WITH ${errors.length} ERRORS:`);
    errors.forEach(err => console.error(`  - ${err}`));
    console.log('====================================================\n');
    process.exit(1);
  }
}

if (require.main === module) {
  runValidation();
}

module.exports = { runValidation };
