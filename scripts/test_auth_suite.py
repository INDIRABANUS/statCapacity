import os
import sys
import io
from pathlib import Path
from unittest import mock

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

# ----------------------------------------------------------------
# Set up mongomock BEFORE importing the app, so the app's module-level
# imports get the patched version.
# ----------------------------------------------------------------
import mongomock

# One shared in-memory client for all tests
_mock_client = mongomock.MongoClient()
_mock_db = _mock_client["sih2_db"]

# Ensure unique indexes on users collection (mongomock supports them)
_mock_db.users.create_index("email", unique=True)
_mock_db.users.create_index("username", unique=True)

def _get_mock_db():
    return _mock_db

# Patch get_database globally so all imports of it return the mock DB.
# We use patch.dict on sys.modules and also patch the function directly.
patcher_mongodb = mock.patch("app.db.mongodb.get_database", side_effect=_get_mock_db)
patcher_auth = mock.patch("app.api.v1.endpoints.auth.get_database", side_effect=_get_mock_db)
patcher_deps = mock.patch("app.api.deps.get_database", side_effect=_get_mock_db)
patcher_users = mock.patch("app.db.users_db.get_database", side_effect=_get_mock_db)
patcher_roles = mock.patch("app.api.v1.endpoints.roles.get_database", side_effect=_get_mock_db)
patcher_users_ep = mock.patch("app.api.v1.endpoints.users.get_database", side_effect=_get_mock_db)
patcher_roles_db = mock.patch("app.db.roles_db.get_database", side_effect=_get_mock_db)
patcher_comp_ep = mock.patch("app.api.v1.endpoints.competencies.get_database", side_effect=_get_mock_db)
patcher_comp_db = mock.patch("app.db.competencies_db.get_database", side_effect=_get_mock_db)
patcher_ucomp_db = mock.patch("app.db.user_competencies_db.get_database", side_effect=_get_mock_db)

patcher_mongodb.start()
patcher_auth.start()
patcher_deps.start()
patcher_users.start()
patcher_roles.start()
patcher_users_ep.start()
patcher_roles_db.start()
patcher_comp_ep.start()
patcher_comp_db.start()
patcher_ucomp_db.start()

# Now import the app (after patches are active)
from fastapi.testclient import TestClient
from app.main import app
from app.db.users_db import create_user
from app.core.security import hash_password

PASS = "[PASS]"
FAIL = "[FAIL]"

def run_auth_test_suite():
    print("====================================================")
    print("    STAGE 2 - AUTHENTICATION & RBAC TEST SUITE      ")
    print("====================================================\n")

    client = TestClient(app)
    passed = 0
    failed = 0

    # Clean up between runs
    _mock_db.users.delete_many({})

    # ----------------------------------------------------------------
    # Test 1: Successful Registration (role = USER)
    # ----------------------------------------------------------------
    print("1. Successful Registration (default role = USER)...")
    user_token = None
    try:
        res = client.post("/api/v1/auth/register", json={
            "username": "test_user_alpha",
            "email": "alpha@gov.in",
            "password": "Password123!",
            "password_confirm": "Password123!"
        })
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["username"] == "test_user_alpha"
        assert data["user"]["role"] == "USER"
        user_token = data["access_token"]
        print(f"   {PASS} Token issued, role = USER")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 2: Duplicate Email
    # ----------------------------------------------------------------
    print("\n2. Duplicate Email Prevention...")
    try:
        res = client.post("/api/v1/auth/register", json={
            "username": "unique_username_xyz",
            "email": "alpha@gov.in",   # same email
            "password": "Password123!",
            "password_confirm": "Password123!"
        })
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        print(f"   {PASS} Duplicate email rejected with 400")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 3: Duplicate Username
    # ----------------------------------------------------------------
    print("\n3. Duplicate Username Prevention...")
    try:
        res = client.post("/api/v1/auth/register", json={
            "username": "test_user_alpha",   # same username
            "email": "new_email@gov.in",
            "password": "Password123!",
            "password_confirm": "Password123!"
        })
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        print(f"   {PASS} Duplicate username rejected with 400")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 4: Password Mismatch (Pydantic validator — 422)
    # ----------------------------------------------------------------
    print("\n4. Invalid Registration (Password Mismatch)...")
    try:
        res = client.post("/api/v1/auth/register", json={
            "username": "mismatch_user",
            "email": "mismatch@gov.in",
            "password": "Password123!",
            "password_confirm": "DifferentPassword!"
        })
        assert res.status_code == 422, f"Expected 422, got {res.status_code}: {res.text}"
        print(f"   {PASS} Password mismatch rejected with 422")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 5: Successful Login
    # ----------------------------------------------------------------
    print("\n5. Successful Login (by email)...")
    try:
        res = client.post("/api/v1/auth/login", json={
            "email_or_username": "alpha@gov.in",
            "password": "Password123!"
        })
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["username"] == "test_user_alpha"
        user_token = data["access_token"]  # refresh token
        print(f"   {PASS} Login successful, token issued")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 6: Incorrect Password
    # ----------------------------------------------------------------
    print("\n6. Incorrect Password Login...")
    try:
        res = client.post("/api/v1/auth/login", json={
            "email_or_username": "test_user_alpha",
            "password": "WrongPassword!"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print(f"   {PASS} Incorrect password rejected with 401")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 7: Nonexistent User
    # ----------------------------------------------------------------
    print("\n7. Nonexistent User Login...")
    try:
        res = client.post("/api/v1/auth/login", json={
            "email_or_username": "ghost_user_999",
            "password": "Password123!"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print(f"   {PASS} Nonexistent user rejected with 401")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 8: No Token on Protected Endpoint
    # ----------------------------------------------------------------
    print("\n8. Protected Endpoint Without Token...")
    try:
        res = client.get("/api/v1/protected/user-only")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print(f"   {PASS} Unauthenticated request denied with 401")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 9: Valid USER Token on User Endpoint
    # ----------------------------------------------------------------
    print("\n9. Protected Endpoint with Valid USER Token...")
    try:
        assert user_token, "No user_token available from login"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.get("/api/v1/protected/user-only", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        assert res.json()["message"] == "User access granted"
        print(f"   {PASS} Authenticated USER access granted (200)")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 10: USER on Admin Endpoint → 403
    # ----------------------------------------------------------------
    print("\n10. USER Role Accessing ADMIN Endpoint (expect 403)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.get("/api/v1/protected/admin-only", headers=headers)
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
        print(f"   {PASS} USER correctly denied ADMIN endpoint with 403")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 11: Controlled ADMIN creation + ADMIN endpoint access
    # ----------------------------------------------------------------
    print("\n11. Controlled ADMIN Creation (seed mechanism) & ADMIN Access...")
    try:
        admin_pwd_hash = hash_password("AdminSecretPass123!")
        # Direct DB insertion — bypasses the public /register endpoint
        create_user(_mock_db, username="test_admin_alpha", email="admin@gov.in",
                    password_hash=admin_pwd_hash, role="ADMIN")

        # Login as ADMIN
        res = client.post("/api/v1/auth/login", json={
            "email_or_username": "admin@gov.in",
            "password": "AdminSecretPass123!"
        })
        assert res.status_code == 200, f"Admin login failed: {res.status_code} {res.text}"
        admin_token = res.json()["access_token"]
        assert res.json()["user"]["role"] == "ADMIN"

        # Access admin endpoint
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        res2 = client.get("/api/v1/protected/admin-only", headers=admin_headers)
        assert res2.status_code == 200, f"Expected 200, got {res2.status_code}: {res2.text}"
        assert res2.json()["message"] == "Admin access granted"
        print(f"   {PASS} ADMIN created via seed; ADMIN endpoint access granted (200)")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 12: GET /auth/me
    # ----------------------------------------------------------------
    print("\n12. GET /api/v1/auth/me with Valid Token...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.get("/api/v1/auth/me", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        assert res.json()["username"] == "test_user_alpha"
        print(f"   {PASS} /auth/me returned current user profile")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 13: GET /api/v1/roles
    # ----------------------------------------------------------------
    print("\n13. GET /api/v1/roles (Available Roles Catalog)...")
    try:
        res = client.get("/api/v1/roles")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        roles_data = res.json()
        assert isinstance(roles_data, list), "Roles should be a list"
        assert len(roles_data) >= 10, f"Expected at least 10 roles, got {len(roles_data)}"
        assert any(r["role_id"] == "ROLE_STAT_OFFICER" for r in roles_data)
        print(f"   {PASS} /roles returned {len(roles_data)} available statistical roles")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 14: PUT /api/v1/users/me/profile (Valid Role Assignment)
    # ----------------------------------------------------------------
    print("\n14. PUT /api/v1/users/me/profile with Valid Role IDs...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.put("/api/v1/users/me/profile", headers=headers, json={
            "current_role_id": "ROLE_STAT_OFFICER",
            "target_role_id": "ROLE_SR_STAT_ANALYST"
        })
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["current_role_id"] == "ROLE_STAT_OFFICER"
        assert data["target_role_id"] == "ROLE_SR_STAT_ANALYST"
        print(f"   {PASS} Profile updated with current and target roles (200)")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 15: PUT /api/v1/users/me/profile with Invalid Role ID (Expect 400)
    # ----------------------------------------------------------------
    print("\n15. PUT /api/v1/users/me/profile with Nonexistent Role ID (expect 400)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.put("/api/v1/users/me/profile", headers=headers, json={
            "current_role_id": "INVALID_FAKE_ROLE_999",
            "target_role_id": "ROLE_SR_STAT_ANALYST"
        })
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        print(f"   {PASS} Invalid role ID rejected with 400 Bad Request")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 16: PUT /api/v1/users/me/profile Without Token (Expect 401)
    # ----------------------------------------------------------------
    print("\n16. PUT /api/v1/users/me/profile Without Token (expect 401)...")
    try:
        res = client.put("/api/v1/users/me/profile", json={
            "current_role_id": "ROLE_STAT_OFFICER"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print(f"   {PASS} Unauthenticated profile update rejected with 401")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ================================================================
    # STAGE 3 TESTS: COMPETENCY & SKILL-GAP ENGINE
    # ================================================================

    # ----------------------------------------------------------------
    # Test 17: GET /api/v1/competencies (Competency Retrieval)
    # ----------------------------------------------------------------
    print("\n17. GET /api/v1/competencies (Taxonomy Retrieval)...")
    try:
        res = client.get("/api/v1/competencies")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        comps = res.json()
        assert isinstance(comps, list), "Expected list of competencies"
        assert len(comps) == 18, f"Expected 18 competencies, got {len(comps)}"
        assert any(c["competency_id"] == "COMP_SAMPLING_METHODOLOGY" for c in comps)
        print(f"   {PASS} Successfully retrieved all {len(comps)} competencies from framework")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 18: PUT /api/v1/users/me/competencies (Authenticated Update)
    # ----------------------------------------------------------------
    print("\n18. PUT /api/v1/users/me/competencies (Save Assessed Levels)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        payload = {
            "competencies": [
                {"competency_id": "COMP_SAMPLING_METHODOLOGY", "current_level": 45},
                {"competency_id": "COMP_SURVEY_FIELD_OPERATIONS", "current_level": 50},
                {"competency_id": "COMP_DATA_CLEANING_VALIDATION", "current_level": 70}
            ]
        }
        res = client.put("/api/v1/users/me/competencies", headers=headers, json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert len(data) >= 3, f"Expected at least 3 competencies returned, got {len(data)}"
        comp_sampling = next((c for c in data if c["competency_id"] == "COMP_SAMPLING_METHODOLOGY"), None)
        assert comp_sampling is not None and comp_sampling["current_level"] == 45
        print(f"   {PASS} Successfully updated user competency assessments")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 19: GET /api/v1/users/me/competencies (Retrieve User Profile)
    # ----------------------------------------------------------------
    print("\n19. GET /api/v1/users/me/competencies (Fetch User Levels)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.get("/api/v1/users/me/competencies", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert len(data) >= 3, f"Expected saved competencies, got {len(data)}"
        print(f"   {PASS} Fetched {len(data)} user competency records with 0-100 scores")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 20: PUT /api/v1/users/me/competencies with Invalid Competency ID (400)
    # ----------------------------------------------------------------
    print("\n20. PUT /api/v1/users/me/competencies with Nonexistent Competency ID (expect 400)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.put("/api/v1/users/me/competencies", headers=headers, json={
            "competencies": [{"competency_id": "COMP_FAKE_INVALID_999", "current_level": 50}]
        })
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        print(f"   {PASS} Invalid competency ID rejected with 400 Bad Request")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 21: PUT /api/v1/users/me/competencies with Score Below 0 (400/422)
    # ----------------------------------------------------------------
    print("\n21. PUT /api/v1/users/me/competencies with Score Below 0 (expect 400/422)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.put("/api/v1/users/me/competencies", headers=headers, json={
            "competencies": [{"competency_id": "COMP_SAMPLING_METHODOLOGY", "current_level": -10}]
        })
        assert res.status_code in [400, 422], f"Expected 400 or 422, got {res.status_code}: {res.text}"
        print(f"   {PASS} Score below 0 rejected with {res.status_code}")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 22: PUT /api/v1/users/me/competencies with Score Above 100 (400/422)
    # ----------------------------------------------------------------
    print("\n22. PUT /api/v1/users/me/competencies with Score Above 100 (expect 400/422)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        res = client.put("/api/v1/users/me/competencies", headers=headers, json={
            "competencies": [{"competency_id": "COMP_SAMPLING_METHODOLOGY", "current_level": 150}]
        })
        assert res.status_code in [400, 422], f"Expected 400 or 422, got {res.status_code}: {res.text}"
        print(f"   {PASS} Score above 100 rejected with {res.status_code}")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 23: GET /api/v1/users/me/skill-gaps with Target Role (Calculation & Severity)
    # ----------------------------------------------------------------
    print("\n23. GET /api/v1/users/me/skill-gaps with Target Role (Gap & Severity Engine)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        # Set target role to ROLE_STAT_OFFICER
        client.put("/api/v1/users/me/profile", headers=headers, json={
            "target_role_id": "ROLE_STAT_OFFICER"
        })

        res = client.get("/api/v1/users/me/skill-gaps", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        gaps = res.json()
        assert len(gaps) > 0, "Expected non-empty skill gaps for ROLE_STAT_OFFICER"
        # COMP_SURVEY_FIELD_OPERATIONS: req=75, current=50 -> gap=25 (Moderate)
        field_op_gap = next((g for g in gaps if g["competency_id"] == "COMP_SURVEY_FIELD_OPERATIONS"), None)
        assert field_op_gap is not None, "Expected COMP_SURVEY_FIELD_OPERATIONS in gaps"
        assert field_op_gap["required_level"] == 75
        assert field_op_gap["current_level"] == 50
        assert field_op_gap["gap"] == 25
        assert field_op_gap["severity"] == "Moderate", f"Expected Moderate, got {field_op_gap['severity']}"
        assert "resulting in a gap of 25" in field_op_gap["explanation"]
        print(f"   {PASS} Deterministic gap (25) & severity ('Moderate') calculated accurately")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 24: GET /api/v1/users/me/skill-gaps with No Target Role (Returns [])
    # ----------------------------------------------------------------
    print("\n24. GET /api/v1/users/me/skill-gaps with No Target Role (No Fake Gaps)...")
    try:
        assert user_token, "No user_token available"
        headers = {"Authorization": f"Bearer {user_token}"}
        # Clear target role
        client.put("/api/v1/users/me/profile", headers=headers, json={
            "target_role_id": ""
        })

        res = client.get("/api/v1/users/me/skill-gaps", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        assert res.json() == [], f"Expected empty list when no target role, got {res.json()}"
        print(f"   {PASS} Returns empty list when no target role is configured (no fake gaps)")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 25: GET /api/v1/users/me/skill-gaps with No Competency Assessment
    # ----------------------------------------------------------------
    print("\n25. GET /api/v1/users/me/skill-gaps with Target Role but No Assessment (0 baseline)...")
    try:
        # Create a clean user with target role but 0 assessments
        clean_user_pwd = hash_password("Password123!")
        clean_user = create_user(_mock_db, username="clean_officer_beta", email="beta@gov.in",
                                 password_hash=clean_user_pwd, role="USER")
        # Login
        l_res = client.post("/api/v1/auth/login", json={"email_or_username": "beta@gov.in", "password": "Password123!"})
        beta_token = l_res.json()["access_token"]
        beta_headers = {"Authorization": f"Bearer {beta_token}"}

        # Set target role to ROLE_STAT_OFFICER
        client.put("/api/v1/users/me/profile", headers=beta_headers, json={"target_role_id": "ROLE_STAT_OFFICER"})

        res = client.get("/api/v1/users/me/skill-gaps", headers=beta_headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        beta_gaps = res.json()
        assert len(beta_gaps) > 0, "Expected gaps against requirements"
        for g in beta_gaps:
            assert g["current_level"] == 0, f"Expected 0 current_level without assessment, got {g['current_level']}"
            assert g["gap"] == g["required_level"], f"Expected gap == required_level, got {g['gap']}"
        print(f"   {PASS} Accurately baseline evaluated 0 current_level without fabricated scores")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    # ----------------------------------------------------------------
    # Test 26: Unauthorized Access to Protected Competency Endpoints (Expect 401)
    # ----------------------------------------------------------------
    print("\n26. Protected Competency & Skill-Gap Endpoints Without Token (expect 401)...")
    try:
        r1 = client.get("/api/v1/users/me/competencies")
        r2 = client.put("/api/v1/users/me/competencies", json={"competencies": []})
        r3 = client.get("/api/v1/users/me/skill-gaps")
        assert r1.status_code == 401, f"GET competencies: expected 401, got {r1.status_code}"
        assert r2.status_code == 401, f"PUT competencies: expected 401, got {r2.status_code}"
        assert r3.status_code == 401, f"GET skill-gaps: expected 401, got {r3.status_code}"
        print(f"   {PASS} All protected Stage 3 endpoints correctly rejected unauthenticated calls (401)")
        passed += 1
    except AssertionError as e:
        print(f"   {FAIL} {e}")
        failed += 1

    print("\n----------------------------------------------------")
    print(f"RESULTS: {passed} passed, {failed} failed out of 26 tests")
    if failed == 0:
        print("ALL 26 STAGE 2 & STAGE 3 TESTS PASSED SUCCESSFULLY!")
    else:
        print(f"WARNING: {failed} test(s) FAILED.")
        sys.exit(1)
    print("====================================================\n")

    # Stop patchers
    patcher_ucomp_db.stop()
    patcher_comp_db.stop()
    patcher_comp_ep.stop()
    patcher_roles_db.stop()
    patcher_users_ep.stop()
    patcher_roles.stop()
    patcher_users.stop()
    patcher_deps.stop()
    patcher_auth.stop()
    patcher_mongodb.stop()


if __name__ == "__main__":
    run_auth_test_suite()
