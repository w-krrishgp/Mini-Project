import unittest
from fastapi.testclient import TestClient
import main

class TestCodeReviewerAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("service"), "AI Code Reviewer API")

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")

    def test_get_languages(self):
        response = self.client.get("/api/languages")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("languages", data)
        self.assertTrue(len(data["languages"]) >= 6)

    def test_heuristic_code_review(self):
        payload = {
            "code": "int mid = (low + high) / 2;",
            "language": "cpp",
            "problem_context": "Binary search on large array"
        }
        response = self.client.post("/api/review", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("score", data)
        self.assertIn("issues", data)
        self.assertIn("fixed_code", data)
        self.assertTrue(data.get("is_demo_mode"))

    def test_empty_code_rejection(self):
        response = self.client.post("/api/review", json={"code": "   ", "language": "python"})
        self.assertEqual(response.status_code, 400)

if __name__ == "__main__":
    unittest.main()
