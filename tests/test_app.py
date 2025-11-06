from fastapi.testclient import TestClient
from src import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # expect some known activities from the in-memory dataset
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "pytest.user@mergington.edu"

    # Ensure the test email is not already present
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    if email in data[activity]["participants"]:
        # remove if present to start clean
        del_resp = client.delete(f"/activities/{activity}/participants", params={"email": email})
        assert del_resp.status_code == 200

    # Sign up the test user
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify the user appears in the activity participants
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert email in data[activity]["participants"]

    # Now remove the participant
    del_resp = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert del_resp.status_code == 200
    assert "Removed" in del_resp.json().get("message", "")

    # Verify the user is no longer in participants
    resp = client.get("/activities")
    data = resp.json()
    assert email not in data[activity]["participants"]


def test_signup_duplicate_fails():
    activity = "Programming Class"
    email = "duplicate.test@mergington.edu"

    # Ensure clean state
    resp = client.get("/activities")
    data = resp.json()
    if email in data[activity]["participants"]:
        client.delete(f"/activities/{activity}/participants", params={"email": email})

    # First signup should succeed
    r1 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r1.status_code == 200

    # Second signup should fail with 400
    r2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r2.status_code == 400

    # Cleanup
    client.delete(f"/activities/{activity}/participants", params={"email": email})
