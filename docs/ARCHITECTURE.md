# Technical Architecture — Prototype Data Foundation

## 1. System Overview

The system architecture is built around a document-oriented database model using **MongoDB** as the primary persistent data store. The data layer separates **Static Reference Data** (seeded at bootstrap) from **User-Generated Runtime Data** (created during application usage).

```
+-----------------------------------------------------------------------+
|                         STATIC REFERENCE DATA                         |
|  (data/roles.json, skills.json, competencies.json, courses JSONs)    |
+-----------------------------------------------------------------------+
                                   |
                                   v  (scripts/seed.js)
+-----------------------------------------------------------------------+
|                         MONGODB DATABASE                              |
|                                                                       |
|  Collections:                                                         |
|    - roles              (Static Reference)                            |
|    - skills             (Static Reference)                            |
|    - competencies       (Static Reference)                            |
|    - role_competencies (Static Reference - Gap Engine Foundation)    |
|    - courses            (Static Reference - iGOT & NSSSTA)            |
|                                                                       |
|  Future Runtime Collections:                                          |
|    - users              (User-Generated)                              |
|    - user_assessments   (User-Generated)                              |
|    - user_enrollments   (User-Generated)                              |
+-----------------------------------------------------------------------+
```

---

## 2. Static Reference Data vs. User-Generated Data

### 2.1 Static Reference Data
The files under `data/` serve as the canonical taxonomy and baseline reference data:
- `roles.json`: Organization roles in official statistics bodies.
- `skills.json`: Skill taxonomy across statistical, technical, and management domains.
- `competencies.json`: Competency definitions and numeric proficiency scales (0–100).
- `role_competencies.json`: Benchmark proficiency thresholds required per role.
- `igot_courses.json` & `nssta_courses.json`: Catalog of learning units from iGOT Karmayogi and NSSSTA.

### 2.2 User-Generated Runtime Data (Future Stages)
In subsequent MVP stages, user interactions will create dynamic records:
- `users`: User profiles, assigned `role_id`, and target `target_role_id`.
- `user_assessments`: Self-assessments, quiz results, and manager evaluations recording dynamic user competency levels (`current_level`).
- `user_enrollments`: Course progress, completions, and feedback tracking.

---

## 3. Database Seeding & Ingestion Pipeline

The seeding process is driven by `scripts/seed.js`:

1. **Connection**: Reads `MONGODB_URI` environment variable. If no external database is detected, an isolated in-memory MongoDB instance is initialized via `mongodb-memory-server` for instant verification.
2. **Parsing & Validation**: Loads static JSON files and runs referential checks.
3. **Idempotent Upsert**: Uses MongoDB `bulkWrite` with `updateOne` and `{ upsert: true }`:
   - `roles`: Keyed by `{ role_id }`
   - `skills`: Keyed by `{ skill_id }`
   - `competencies`: Keyed by `{ competency_id }`
   - `role_competencies`: Keyed by composite `{ role_id, competency_id }`
   - `courses`: Keyed by `{ course_id }`
4. **Index Creation**: Creates unique single and compound indexes on key identifiers to guarantee query efficiency and prevent duplicate record insertion.

---

## 4. iGOT Karmayogi Integration Roadmap

Currently, `data/igot_courses.json` and `data/nssta_courses.json` provide static demonstration records.

### Transition Strategy to Live iGOT API:
1. **Schema Standardization**: All course records share a unified schema (`course_id`, `source`, `title`, `description`, `category`, `skills`, `competencies`, `target_roles`, `difficulty`, `duration_hours`).
2. **API Abstraction Layer**: A future `IGotApiService` component will consume official iGOT Karmayogi REST APIs/GraphQL endpoints.
3. **ETL Sync Pipeline**: An automated cron job will fetch live course metadata from iGOT, map iGOT tags to the internal `skills` and `competencies` taxonomy, and upsert records into the `courses` collection using `source: "iGOT"`.
4. **Zero Code Disruption**: Because the downstream recommendation engine queries the `courses` collection, replacing seed JSON data with live iGOT sync requires zero changes to core recommendation logic.

---

## 5. Competency Mapping & Skill-Gap Analysis Engine Model

The `role_competencies` dataset forms the mathematical baseline for downstream skill-gap analysis:

$$\text{Competency Gap}(u, c) = \max\Big(0, \; \text{RequiredLevel}(\text{TargetRole}_u, c) - \text{AssessedLevel}(u, c)\Big)$$

### Workflow:
1. **Benchmark Lookup**: Query `role_competencies` for user $u$'s target role $R_{\text{target}}$ to retrieve required proficiency levels ($L_{\text{req}} \in [0, 100]$).
2. **Current State Evaluation**: Fetch user's assessed level ($L_{\text{current}} \in [0, 100]$) from `user_assessments`.
3. **Gap Computation**: Identify competencies where $L_{\text{req}} - L_{\text{current}} > 0$.
4. **Targeted Course Matching**: Query `courses` matching missing competencies and skills, ranked by relevance and difficulty progression.
