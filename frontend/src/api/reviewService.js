const API_BASE_URL = 'http://localhost:8000';

/**
 * Checks backend health and Gemini readiness
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

/**
 * Submits code to the backend for AI Code Review
 */
export async function requestAiReview({ code, language, problemContext, apiKey }) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim()) {
      headers['X-Gemini-API-Key'] = apiKey.trim();
    }

    const res = await fetch(`${API_BASE_URL}/api/review`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code,
        language,
        problem_context: problemContext || '',
        api_key: apiKey ? apiKey.trim() : null,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${res.statusText} (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.error('Review request error:', err);
    throw err;
  }
}
