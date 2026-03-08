"""
Tests for Brainstorm Platform API
"""
import pytest
from fastapi.testclient import TestClient

from ..api.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "models_loaded" in data


def test_entity_extraction():
    """Test entity extraction endpoint"""
    response = client.post(
        "/api/v1/extract-entities",
        json={"text": "Apple Inc. is developing new features in California with Tim Cook."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "entities" in data
    assert "entity_count" in data


def test_hesitation_detection():
    """Test hesitation detection endpoint with typing session data"""
    response = client.post(
        "/api/v1/detect-hesitation",
        json={
            "delFreq": 10,
            "leftFreq": 5,
            "TotTime": 15000
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "hesitation_score" in data
    assert "is_hesitant" in data
    assert "input_features" in data
    assert "delFreq" in data["input_features"]
    assert "leftFreq" in data["input_features"]
    assert "TotTime" in data["input_features"]
    assert "backspace_ratio" in data["input_features"]
    assert "correction_rate" in data["input_features"]


def test_rephrasing():
    """Test text rephrasing endpoint"""
    response = client.post(
        "/api/v1/rephrase",
        json={
            "text": "I think maybe we should possibly try implementing authentication",
            "context": "Technical discussion"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "original_text" in data
    assert "rephrased_text" in data
    assert "improvements" in data


def test_comprehensive_analysis():
    """Test comprehensive analysis endpoint"""
    response = client.post(
        "/api/v1/analyze",
        json={
            "text": "Um, I think maybe we could implement JWT authentication with Node.js...",
            "participant_id": "test_user",
            "session_id": "test_session"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "original_text" in data
    assert "entities" in data
    assert "hesitation" in data
    assert "recommendations" in data
    assert "confidence_metrics" in data


def test_invalid_request():
    """Test invalid request handling"""
    response = client.post(
        "/api/v1/extract-entities",
        json={}
    )
    assert response.status_code == 422  # Validation error
