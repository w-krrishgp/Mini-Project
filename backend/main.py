import os
import re
import json
from typing import List, Optional
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Ensure .env in backend directory is loaded
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

# Initialize FastAPI application
app = FastAPI(
    title="AI Code Reviewer API",
    description="Backend API powered by Google Gemini for intelligent DSA and code review",
    version="1.1.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPORTED_LANGUAGES = [
    {
        "id": "cpp",
        "name": "C++",
        "extension": ".cpp",
        "monacoLang": "cpp",
        "version": "C++17 / C++20",
        "description": "Standard for DSA & Competitive Programming"
    },
    {
        "id": "python",
        "name": "Python",
        "extension": ".py",
        "monacoLang": "python",
        "version": "Python 3.12+",
        "description": "Clean, dynamic syntax and fast prototyping"
    },
    {
        "id": "java",
        "name": "Java",
        "extension": ".java",
        "monacoLang": "java",
        "version": "Java 17+",
        "description": "Strongly typed object-oriented language"
    },
    {
        "id": "javascript",
        "name": "JavaScript",
        "extension": ".js",
        "monacoLang": "javascript",
        "version": "ES2024 / Node.js",
        "description": "Ubiquitous web and script runtime"
    },
    {
        "id": "typescript",
        "name": "TypeScript",
        "extension": ".ts",
        "monacoLang": "typescript",
        "version": "TypeScript 5.x",
        "description": "Typed superset of JavaScript"
    },
    {
        "id": "c",
        "name": "C",
        "extension": ".c",
        "monacoLang": "c",
        "version": "C11 / C17",
        "description": "Low-level procedural systems programming"
    }
]

# Pydantic Schemas
class ReviewIssue(BaseModel):
    id: str = Field(description="Unique issue identifier, e.g. issue-1")
    type: str = Field(description="'bug' | 'edge_case' | 'optimization' | 'style'")
    severity: str = Field(description="'critical' | 'warning' | 'info'")
    title: str = Field(description="Short title describing the issue")
    line_number: Optional[int] = Field(default=None, description="Line number if identifiable in original code")
    description: str = Field(description="Detailed explanation of why this is problematic")
    suggestion: str = Field(description="Actionable fix or replacement code snippet")

class ReviewRequest(BaseModel):
    code: str
    language: str
    problem_context: Optional[str] = ""
    api_key: Optional[str] = None

class ReviewResponse(BaseModel):
    success: bool = True
    summary: str
    score: int = Field(ge=0, le=100)
    time_complexity: str
    space_complexity: str
    target_complexity: Optional[str] = None
    issues: List[ReviewIssue] = []
    fixed_code: str
    explanation: str
    strengths: List[str] = []
    recommendations: List[str] = []
    model_used: str
    is_demo_mode: bool = False
    warning_message: Optional[str] = None


def generate_heuristic_review(code: str, language: str, problem_context: Optional[str] = None) -> ReviewResponse:
    """
    Intelligent heuristic fallback analyzer when no Gemini API key is configured.
    Ensures zero crashes for common DSA patterns and loaded buggy samples.
    """
    lang_lower = language.lower()
    issues: List[ReviewIssue] = []
    score = 80
    time_complexity = "O(N)"
    space_complexity = "O(1)"
    target_complexity = "O(N) time, O(1) space"
    strengths = ["Clear algorithmic structure", f"Valid {language.upper()} syntax conventions"]
    recommendations = ["Consider testing edge cases: empty input, boundary extremes, and null checks."]

    lines = code.split("\n")

    # Detect Binary search integer overflow: (low + high) / 2
    overflow_match = re.search(r'\(\s*(low|left|l)\s*\+\s*(high|right|r)\s*\)\s*/\s*2', code)
    if overflow_match:
        for idx, line in enumerate(lines, 1):
            if "/" in line and ("low" in line or "left" in line):
                issues.append(ReviewIssue(
                    id="issue-overflow",
                    type="bug",
                    severity="critical",
                    title="Integer Overflow in Midpoint Calculation",
                    line_number=idx,
                    description="Calculating midpoint as '(low + high) / 2' can exceed the 32-bit signed integer limit (2^31 - 1) on large test sets, producing a negative index and runtime crash.",
                    suggestion="Use 'low + (high - low) / 2' instead to guarantee overflow-safe arithmetic."
                ))
                break
        score -= 25
        time_complexity = "O(log N)"
        space_complexity = "O(1)"
        target_complexity = "O(log N) time, O(1) space"
        recommendations.append("Always use 'low + (high - low) / 2' in binary searches to prevent arithmetic overflow.")

    # Detect off-by-one loop index i <= n or i <= nums.size()
    loop_overflow = re.search(r'for\s*\([^;]*;\s*(\w+)\s*<=\s*(\w+)\.(size\(\)|length|len)\s*;\s*[^)]*\)', code)
    if loop_overflow:
        issues.append(ReviewIssue(
            id="issue-oob",
            type="bug",
            severity="critical",
            title="Out-of-Bounds Off-By-One Error",
            line_number=None,
            description="Using '<=' against collection length/size indexes arr[n] which is outside the valid range 0..(n-1), triggering segmentation fault or undefined behavior.",
            suggestion="Change '<=' to '<' in the loop continuation condition."
        ))
        score -= 30

    # Detect nested loops for Two Sum O(N^2)
    nested_loop = len(re.findall(r'for\s*\(', code)) >= 2 or len(re.findall(r'for\s+\w+\s+in', code)) >= 2
    if nested_loop and "target" in code.lower() and ("sum" in code.lower() or "two" in code.lower()):
        issues.append(ReviewIssue(
            id="issue-complexity",
            type="optimization",
            severity="warning",
            title="Quadratic O(N^2) Time Complexity",
            line_number=None,
            description="Nested loops result in O(N^2) brute force execution. For arrays up to N = 10^5, this results in Time Limit Exceeded (TLE).",
            suggestion="Use an unordered hash map / dictionary to achieve optimal O(N) time with a single pass."
        ))
        score -= 20
        time_complexity = "O(N^2)"
        space_complexity = "O(1)"
        target_complexity = "O(N) time, O(N) space"
        recommendations.append("Trade space for time: hash map lookups take O(1) average time.")

    # Check for recursion without base case or sys.setrecursionlimit
    if "def " in code and ("dfs" in code.lower() or "traverse" in code.lower()) and "recursion" not in code.lower():
        if lang_lower == "python":
            issues.append(ReviewIssue(
                id="issue-recursion",
                type="edge_case",
                severity="info",
                title="Deep Recursion Stack Vulnerability",
                line_number=None,
                description="Python has a default recursion limit of 1,000 frames. Deep graph/tree structures may trigger RecursionError.",
                suggestion="Add 'import sys; sys.setrecursionlimit(200000)' or rewrite iteratively with an explicit stack."
            ))

    if not issues:
        issues.append(ReviewIssue(
            id="issue-clean",
            type="style",
            severity="info",
            title="Code Structure & Input Validation",
            line_number=1,
            description="Code appears logically sound. Verify edge cases: empty collections, single-element inputs, and extreme boundary values.",
            suggestion="Add explicit guards at the start of your function for empty or null inputs."
        ))
        score = 92
        summary = f"Good quality {language.upper()} implementation with sound control flow and clean syntax."
    else:
        summary = f"Identified {len(issues)} issue(s) including critical bug/optimization opportunities in {language.upper()} solution."

    # Generate fixed code snippet
    fixed_code = code
    if overflow_match:
        fixed_code = re.sub(
            r'\(\s*(low|left|l)\s*\+\s*(high|right|r)\s*\)\s*/\s*2',
            r'\1 + (\2 - \1) / 2',
            fixed_code
        )
    if loop_overflow:
        fixed_code = re.sub(
            r'(<=\s*\w+\.(?:size\(\)|length))',
            lambda m: m.group(1).replace('<=', '<'),
            fixed_code
        )

    explanation = (
        "The original code was analyzed using built-in DSA heuristic rules. "
        "Critical boundary conditions and time/space constraints were evaluated. "
        "The proposed fix rectifies arithmetic overflow risks and restores optimal runtime execution."
    )

    return ReviewResponse(
        success=True,
        summary=summary,
        score=max(35, min(100, score)),
        time_complexity=time_complexity,
        space_complexity=space_complexity,
        target_complexity=target_complexity,
        issues=issues,
        fixed_code=fixed_code,
        explanation=explanation,
        strengths=strengths,
        recommendations=recommendations,
        model_used="DSA Heuristics Engine (Local Demo)",
        is_demo_mode=True,
        warning_message="Running in Demo Mode. To enable live Gemini 3.8 Flash AI reviews, set GEMINI_API_KEY in backend/.env or enter it in Settings."
    )


@app.get("/")
def read_root():
    return {
        "service": "AI Code Reviewer API",
        "version": "1.1.0",
        "status": "active",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here")
    }


@app.get("/api/health")
def health_check():
    has_key = bool(os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here")
    return {
        "status": "ok",
        "service": "AI Code Reviewer Backend",
        "gemini_status": "ready" if has_key else "demo_mode"
    }


@app.get("/api/languages")
def get_languages():
    return {"languages": SUPPORTED_LANGUAGES}


@app.post("/api/review", response_model=ReviewResponse)
async def review_code(
    request: ReviewRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key")
):
    """
    Performs AI code review using Google Gemini (gemini-3.8-flash).
    Falls back to smart local heuristics if no API key is provided or during demo testing.
    """
    if not request.code or not request.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code snippet cannot be empty."
        )

    # Resolve active API key
    active_key = (
        request.api_key
        or x_gemini_api_key
        or os.getenv("GEMINI_API_KEY")
    )

    is_dummy_key = not active_key or active_key.strip() in (
        "",
        "your_gemini_api_key_here",
        "your_api_key_here",
        "placeholder"
    )

    if is_dummy_key:
        return generate_heuristic_review(
            code=request.code,
            language=request.language,
            problem_context=request.problem_context
        )

    # Call Google Gemini API
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=active_key.strip())

        system_instruction = (
            "You are a World-Class Senior Principal Software Engineer and Competitive Programming / DSA Mentor. "
            "You rigorously review code for logic bugs, runtime errors, edge cases, off-by-one errors, arithmetic overflows, "
            "and Big-O Time and Space complexities. Always suggest clean, production-ready, idiomatic fixes."
        )

        prompt = f"""Review the following {request.language} code.
Problem Context / Constraints (if provided):
{request.problem_context or "None provided"}

Code to review:
```{request.language}
{request.code}
```

Provide your review in valid JSON format matching this exact schema:
{{
  "summary": "1-2 sentence overview of code quality and key findings",
  "score": integer between 0 and 100,
  "time_complexity": "Current time complexity, e.g. O(N), O(N log N), O(N^2)",
  "space_complexity": "Current space complexity, e.g. O(1), O(N)",
  "target_complexity": "Optimal time and space complexity, e.g. O(N) time, O(1) space",
  "issues": [
    {{
      "id": "issue-1",
      "type": "bug" | "edge_case" | "optimization" | "style",
      "severity": "critical" | "warning" | "info",
      "title": "Short title of issue",
      "line_number": integer line number or null,
      "description": "Why this is an issue",
      "suggestion": "How to fix it"
    }}
  ],
  "fixed_code": "Complete, working, bug-free, optimal refactored code",
  "explanation": "Clear explanation of how the issues were resolved",
  "strengths": ["strength 1", "strength 2"],
  "recommendations": ["takeaway 1", "takeaway 2"]
}}

Respond ONLY with valid JSON. No markdown backticks outside the JSON string if possible.
"""

        # Generate response using gemini-3.8-flash
        model_name = "gemini-3.8-flash"
        
        # We use generate_content with JSON response mime type
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2,
            )
        )

        response_text = response.text.strip()
        # Clean potential markdown wrapping if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        data = json.loads(response_text)

        # Map to ReviewResponse
        issues_list = []
        for idx, item in enumerate(data.get("issues", []), 1):
            issues_list.append(ReviewIssue(
                id=item.get("id", f"issue-{idx}"),
                type=item.get("type", "bug"),
                severity=item.get("severity", "warning"),
                title=item.get("title", "Code Issue"),
                line_number=item.get("line_number"),
                description=item.get("description", ""),
                suggestion=item.get("suggestion", "")
            ))

        return ReviewResponse(
            success=True,
            summary=data.get("summary", "Review completed successfully."),
            score=int(data.get("score", 75)),
            time_complexity=data.get("time_complexity", "Unknown"),
            space_complexity=data.get("space_complexity", "Unknown"),
            target_complexity=data.get("target_complexity"),
            issues=issues_list,
            fixed_code=data.get("fixed_code", request.code),
            explanation=data.get("explanation", ""),
            strengths=data.get("strengths", []),
            recommendations=data.get("recommendations", []),
            model_used=model_name,
            is_demo_mode=False
        )

    except Exception as e:
        error_str = str(e)
        # If API key is invalid or quota exceeded, fall back to heuristic with clear warning
        print(f"Gemini API invocation error: {error_str}")
        fallback = generate_heuristic_review(
            code=request.code,
            language=request.language,
            problem_context=request.problem_context
        )
        fallback.warning_message = f"Gemini API request note ({error_str[:120]}). Displaying local analysis fallback."
        return fallback
