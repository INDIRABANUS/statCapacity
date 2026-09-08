# Project Requirements — Official Statistics Capacity Building & Competency Platform

## 1. Executive Summary & Objective

The objective of this platform is to provide a unified capacity building, competency framework, and course recommendation system for official statistics organizations (such as MoSPI, NSSO, CSO, and state statistical bureaus).

At this initial stage, **ONLY the Prototype Data Foundation** is implemented. Authentication, UI dashboards, AI models, live API integrations, and recommendation algorithms are explicitly excluded from this current phase.

---

## 2. MVP Scope Boundaries

### In Scope (Stage 0 — Prototype Data Foundation):
- **Static Reference Datasets**: Structured JSON seed files under `data/` defining roles, skills, competencies, role-competency mappings, iGOT course records, and NSSSTA course records.
- **Database Architecture**: MongoDB collections for storing and querying reference datasets.
- **Automated Validation**: Data relationship and schema validation tool (`scripts/validate.js`).
- **Database Seeding**: Idempotent backend database seed pipeline (`scripts/seed.js`).
- **Architecture & Status Documentation**: Technical docs outlining database schemas, static vs. user data, iGOT integration roadmap, and competency gap analysis mechanics.

### Out of Scope (Future Stages):
- User authentication & role-based access control (RBAC).
- User interface (UI) & web dashboards.
- AI-based personalized course recommendation engine.
- Interactive quizzes and competency assessments.
- Live HTTP/REST API calls to external iGOT servers.

---

## 3. Data Foundation Requirements

### 3.1 Datasets
1. **Roles (`data/roles.json`)**: 8–12 realistic civil service & statistical roles with `role_id`, `role_name`, `department`, `description`.
2. **Skills (`data/skills.json`)**: 30–50 skills categorized into `Statistical`, `Technical`, `Data & Digital`, `Domain`, `Behavioral`, `Leadership`, and `Management`.
3. **Competencies (`data/competencies.json`)**: 15–25 competencies with transparent 0–100 numeric proficiency scales (Beginner: 25–40, Intermediate: 41–65, Advanced: 66–85, Expert: 86–100).
4. **Role-Competency Mapping (`data/role_competencies.json`)**: Multi-competency mapping per role with numeric `required_level` (0–100).
5. **iGOT Courses (`data/igot_courses.json`)**: 30–50 mock demonstration course records with `"source": "iGOT"` and rich metadata (skills, competencies, target roles, difficulty, duration).
6. **NSSSTA Courses (`data/nssta_courses.json`)**: 15–30 mock demonstration course records with `"source": "NSSSTA"` focusing on specialized official statistics topics.

### 3.2 Integrity & Validation Rules
- All primary IDs (`role_id`, `skill_id`, `competency_id`, `course_id`) must be unique.
- Referential integrity must be enforced across all mapping and course records.
- `required_level` must fall within `[0, 100]`.
- `duration_hours` must be strictly positive (`> 0`).

### 3.3 Database Operations
- Backend seed script connects using `MONGODB_URI`.
- Must perform idempotent upserts (`updateOne` with `upsert: true`).
- Must generate indexes on unique key fields.
