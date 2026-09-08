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

patcher_mongodb.start()
patcher_auth.start()
patcher_deps.start()
patcher_users.start()

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

    print("\n----------------------------------------------------")
    print(f"RESULTS: {passed} passed, {failed} failed out of 12 tests")
    if failed == 0:
        print("ALL 12 STAGE 2 TESTS PASSED SUCCESSFULLY!")
    else:
        print(f"WARNING: {failed} test(s) FAILED.")
        sys.exit(1)
    print("====================================================\n")

    # Stop patchers
    patcher_users.stop()
    patcher_deps.stop()
    patcher_auth.stop()
    patcher_mongodb.stop()


if __name__ == "__main__":
    run_auth_test_suite()
