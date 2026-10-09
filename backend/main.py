import os
import re
import json
from typing import List, Optional
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

class TestCaseItem(BaseModel):
    id: str = Field(description="Unique identifier, e.g. test-1")
    category: str = Field(description="'normal' | 'edge_case' | 'boundary' | 'performance'")
    title: str = Field(description="Descriptive title of what this case tests")
    input: str = Field(description="Formatted input parameters or stdin")
    expected_output: str = Field(description="Expected return value or stdout")
    explanation: str = Field(description="Why this case is important or how it traps naive code")
    difficulty: str = Field(default="tricky", description="'basic' | 'tricky' | 'extreme'")

class TestCaseRequest(BaseModel):
    code: str
    language: str
    problem_context: Optional[str] = ""
    api_key: Optional[str] = None

class TestCaseResponse(BaseModel):
    success: bool = True
    total_cases: int
    test_cases: List[TestCaseItem] = []
    summary: str
    model_used: str
    is_demo_mode: bool = False
    warning_message: Optional[str] = None

class ChatMessage(BaseModel):
    role: str = Field(description="'user' | 'assistant' | 'system'")
    content: str = Field(description="Message body content")
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = []
    code: str = ""
    language: str = "cpp"
    problem_context: Optional[str] = ""
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool = True
    reply: str
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


# Production Frontend SPA Static Mount
frontend_dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if not os.path.exists(frontend_dist_dir):
    frontend_dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "dist"))

if os.path.exists(frontend_dist_dir):
    assets_dir = os.path.join(frontend_dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
def read_root(accept: Optional[str] = Header(None, alias="Accept")):
    # When accessed from a web browser, serve the compiled React SPA
    if os.path.exists(frontend_dist_dir) and accept and "text/html" in accept:
        index_path = os.path.join(frontend_dist_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)

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

        candidate_models = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.8-flash"]
        data = None
        used_model = "gemini-flash-latest"
        last_err = None
        for model_name in candidate_models:
            try:
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
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                data = json.loads(response_text)
                used_model = model_name
                break
            except Exception as e:
                last_err = e
                continue

        if data is None:
            raise last_err or RuntimeError("No compatible Gemini model succeeded")

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
            model_used=used_model,
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


def generate_heuristic_testcases(code: str, language: str, problem_context: Optional[str] = None) -> TestCaseResponse:
    """
    Intelligent test case and edge case heuristic generator.
    """
    code_lower = code.lower()
    cases: List[TestCaseItem] = []

    if "binarysearch" in code_lower or "binary_search" in code_lower or ("low" in code_lower and "high" in code_lower and "mid" in code_lower):
        cases = [
            TestCaseItem(
                id="tc-1",
                category="normal",
                title="Standard Search (Element in Middle)",
                input="arr = [2, 5, 8, 12, 16, 23, 38]\ntarget = 12",
                expected_output="3",
                explanation="Validates standard logarithmic traversal where target is found in middle partition.",
                difficulty="basic"
            ),
            TestCaseItem(
                id="tc-2",
                category="edge_case",
                title="Target Not Present in Array",
                input="arr = [1, 3, 5, 7, 9]\ntarget = 4",
                expected_output="-1",
                explanation="Ensures loop terminates cleanly when left pointer crosses right pointer without infinite looping.",
                difficulty="basic"
            ),
            TestCaseItem(
                id="tc-3",
                category="boundary",
                title="Empty Array (N = 0)",
                input="arr = []\ntarget = 5",
                expected_output="-1",
                explanation="Guards against out-of-bounds indexing (e.g. arr.size() - 1 underflowing or unsigned wrapping).",
                difficulty="tricky"
            ),
            TestCaseItem(
                id="tc-4",
                category="boundary",
                title="Single Element Array (Match & Mismatch)",
                input="arr = [42]\ntarget = 42",
                expected_output="0",
                explanation="Tests boundary condition (low <= high vs low < high) where a single element array must still be checked.",
                difficulty="tricky"
            ),
            TestCaseItem(
                id="tc-5",
                category="edge_case",
                title="Integer Overflow Boundary Near INT_MAX",
                input="arr = [0, 1000000000, 2000000000]\ntarget = 2000000000",
                expected_output="2",
                explanation="Tests whether (low + high) overflows 32-bit signed integer (2^31 - 1). Catches naive midpoint formula.",
                difficulty="extreme"
            ),
            TestCaseItem(
                id="tc-6",
                category="performance",
                title="Large Scale Stress Test (N = 100,000)",
                input="arr = [1, 2, 3, ... 100000]\ntarget = 99999",
                expected_output="99998",
                explanation="Ensures algorithmic complexity O(log N) executes within ~17 iterations without Time Limit Exceeded.",
                difficulty="tricky"
            )
        ]
        summary = "Generated 6 critical test cases for Binary Search covering midpoint overflow, empty arrays, and scale limits."
    elif "twosum" in code_lower or "two_sum" in code_lower or ("target" in code_lower and ("sum" in code_lower or "pair" in code_lower)):
        cases = [
            TestCaseItem(
                id="tc-1",
                category="normal",
                title="Standard Positive Pair",
                input="nums = [2, 7, 11, 15]\ntarget = 9",
                expected_output="[0, 1]",
                explanation="Baseline test case ensuring complementary pair indices are returned correctly.",
                difficulty="basic"
            ),
            TestCaseItem(
                id="tc-2",
                category="edge_case",
                title="Negative Numbers Summing to Zero",
                input="nums = [-5, -2, 0, 2, 5]\ntarget = 0",
                expected_output="[0, 4]",
                explanation="Validates signed arithmetic logic when complements involve negative integers.",
                difficulty="tricky"
            ),
            TestCaseItem(
                id="tc-3",
                category="boundary",
                title="Duplicate Elements Forming Target",
                input="nums = [3, 3]\ntarget = 6",
                expected_output="[0, 1]",
                explanation="Tests hash map duplicate collision handling without reusing the same array index.",
                difficulty="tricky"
            ),
            TestCaseItem(
                id="tc-4",
                category="edge_case",
                title="No Valid Pair Exists",
                input="nums = [1, 2, 3, 4]\ntarget = 100",
                expected_output="[]",
                explanation="Guarantees safe termination and fallback return when no complementary pair sums to target.",
                difficulty="basic"
            ),
            TestCaseItem(
                id="tc-5",
                category="performance",
                title="Scale Test to Trap O(N^2) TLE (N = 50,000)",
                input="nums = [1, 2, 3, ... 50000]\ntarget = 99999",
                expected_output="[49998, 49999]",
                explanation="Stress-tests algorithm efficiency. O(N^2) brute force causes timeout (TLE); O(N) hash map completes in milliseconds.",
                difficulty="extreme"
            )
        ]
        summary = "Generated 5 comprehensive test cases for Two Sum covering duplicate values, negative integers, and scale limits."
    else:
        cases = [
            TestCaseItem(
                id="tc-1",
                category="normal",
                title="Standard Typical Input",
                input=f"// Example standard input for {language}\nSample input data",
                expected_output="Expected standard return",
                explanation="Happy-path test case verifying normal execution flow and valid return types.",
                difficulty="basic"
            ),
            TestCaseItem(
                id="tc-2",
                category="boundary",
                title="Minimum / Empty Input Constraints",
                input="Empty collection / 0 / null",
                expected_output="Base case output",
                explanation="Verifies guard conditions and prevents NullPointerException, segmentation faults, or undefined indexing.",
                difficulty="tricky"
            ),
            TestCaseItem(
                id="tc-3",
                category="edge_case",
                title="Extreme Boundary & Negative Values",
                input="Min/max data limits (e.g. INT_MIN, INT_MAX, negative values)",
                expected_output="Calculated boundary output",
                explanation="Exposes integer overflow, underflow, and sign handling anomalies.",
                difficulty="extreme"
            ),
            TestCaseItem(
                id="tc-4",
                category="performance",
                title="High-Volume Scale Test (Max Constraints)",
                input="Collection with maximum constraint size (e.g., N = 10^5)",
                expected_output="Execution within 1.0s limit",
                explanation="Stress tests memory consumption and confirms optimal time complexity under competitive programming constraints.",
                difficulty="tricky"
            )
        ]
        summary = f"Generated {len(cases)} test cases covering edge cases, boundary values, and scale limits for {language.upper()} code."

    return TestCaseResponse(
        success=True,
        total_cases=len(cases),
        test_cases=cases,
        summary=summary,
        model_used="DSA Heuristics Engine (Local Demo)",
        is_demo_mode=True,
        warning_message="Running in Demo Mode. Provide GEMINI_API_KEY in backend/.env or in Settings for live Gemini 3.8 Flash test generation."
    )


@app.post("/api/testcases", response_model=TestCaseResponse)
async def generate_test_cases(
    request: TestCaseRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key")
):
    """
    Generates tailored test cases, tricky inputs, and edge cases using Google Gemini (gemini-3.8-flash).
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
        return generate_heuristic_testcases(
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
            "You are a World-Class Competitive Programming Problem Setter and Senior QA Engineer. "
            "Given code and optional problem context, design 5 to 7 high-impact test cases covering: "
            "1. Standard nominal input. "
            "2. Minimum boundary (empty, 0, 1 element). "
            "3. Extreme values (large integers, negative numbers, overflow boundaries). "
            "4. Duplicates / collisions. "
            "5. Stress / worst-case scale tests that trap sub-optimal algorithms."
        )

        prompt = f"""Generate comprehensive test cases and edge cases for the following {request.language} solution.
Problem Context / Constraints (if provided):
{request.problem_context or "None provided"}

Code:
```{request.language}
{request.code}
```

Provide your response in valid JSON matching this exact schema:
{{
  "summary": "1-2 sentence overview of the test suite and edge cases covered",
  "test_cases": [
    {{
      "id": "tc-1",
      "category": "normal" | "edge_case" | "boundary" | "performance",
      "title": "Clear descriptive title of this test case",
      "input": "Exact input representation (e.g. nums = [2, 7, 11, 15], target = 9)",
      "expected_output": "Exact expected return or output",
      "explanation": "Why this test case is tricky or what specific bug/edge case it checks",
      "difficulty": "basic" | "tricky" | "extreme"
    }}
  ]
}}

Respond ONLY with valid JSON.
"""

        candidate_models = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.8-flash"]
        data = None
        used_model = "gemini-flash-latest"
        last_err = None
        for model_name in candidate_models:
            try:
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
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                data = json.loads(response_text)
                used_model = model_name
                break
            except Exception as e:
                last_err = e
                continue

        if data is None:
            raise last_err or RuntimeError("No compatible Gemini model succeeded")

        cases_list = []
        for idx, item in enumerate(data.get("test_cases", []), 1):
            cases_list.append(TestCaseItem(
                id=item.get("id", f"tc-{idx}"),
                category=item.get("category", "edge_case"),
                title=item.get("title", f"Test Case #{idx}"),
                input=item.get("input", ""),
                expected_output=item.get("expected_output", ""),
                explanation=item.get("explanation", ""),
                difficulty=item.get("difficulty", "tricky")
            ))

        return TestCaseResponse(
            success=True,
            total_cases=len(cases_list),
            test_cases=cases_list,
            summary=data.get("summary", f"Generated {len(cases_list)} comprehensive test cases."),
            model_used=used_model,
            is_demo_mode=False
        )

    except Exception as e:
        error_str = str(e)
        print(f"Gemini test case generation error: {error_str}")
        fallback = generate_heuristic_testcases(
            code=request.code,
            language=request.language,
            problem_context=request.problem_context
        )
        fallback.warning_message = f"Gemini API request note ({error_str[:120]}). Displaying local test cases fallback."
        return fallback


def generate_heuristic_chat(
    messages: List[ChatMessage],
    code: str,
    language: str,
    problem_context: Optional[str] = None
) -> ChatResponse:
    last_msg = messages[-1].content.lower() if messages else ""
    code_lower = code.lower() if code else ""
    lang_upper = language.upper()

    if "explain" in last_msg or "how does" in last_msg or "what does" in last_msg or "step by step" in last_msg:
        if "binary" in code_lower or "search" in code_lower:
            reply = (
                f"### 🔍 Algorithmic Walkthrough ({lang_upper})\n\n"
                "Your code implements **Binary Search**, a divide-and-conquer algorithm with logarithmic time complexity $O(\\log N)$:\n\n"
                "1. **Pointers**: `low` starts at index `0` and `high` at `N - 1`.\n"
                "2. **Midpoint**: In each step, you calculate the midpoint `mid`.\n"
                "3. **Partitioning**: If `arr[mid] == target`, you return immediately. If `arr[mid] < target`, the search window shifts right (`low = mid + 1`). Otherwise, it shifts left (`high = mid - 1`).\n\n"
                "💡 **Key Tip**: Be sure your midpoint calculation uses `low + (high - low) / 2` to prevent 32-bit signed integer overflow on large arrays!"
            )
        elif "twosum" in code_lower or "two_sum" in code_lower or "pair" in code_lower:
            reply = (
                f"### 🔍 Algorithmic Walkthrough ({lang_upper})\n\n"
                "Your code addresses the **Two Sum** problem:\n\n"
                "- It searches for two indices where `nums[i] + nums[j] == target`.\n"
                "- When using a hash table / map, the complement `target - nums[i]` is looked up in $O(1)$ amortized time per element, achieving overall **$O(N)$ time** and **$O(N)$ space**.\n"
                "- If using nested loops, it compares every pair with $O(N^2)$ time complexity."
            )
        else:
            reply = (
                f"### 🔍 Code Structure Analysis ({lang_upper})\n\n"
                f"Looking at your current {lang_upper} implementation in the editor:\n\n"
                "- The routine accepts inputs and executes logical branches or loops.\n"
                "- Verify collection lookups: check whether operations are $O(1)$ (hash table/set) or $O(N)$ (linear vector search).\n"
                "- Feel free to ask about any specific line or algorithmic edge case!"
            )
    elif "optimize" in last_msg or "faster" in last_msg or "complexity" in last_msg or "speed" in last_msg:
        reply = (
            f"### ⚡ Optimization Strategies for {lang_upper}\n\n"
            "To achieve optimal competitive programming performance:\n\n"
            "1. **Lookups**: Replace inner loops or `find()` on sequential vectors with a hash map (`std::unordered_map` / `dict`) to reduce $O(N^2)$ to $O(N)$.\n"
            "2. **Two Pointers**: If the array can be sorted, an $O(N \\log N)$ sort with two pointers often saves auxiliary memory ($O(1)$ space).\n"
            "3. **I/O Overhead**: In C++, remember `ios_base::sync_with_stdio(false); cin.tie(NULL);` to avoid I/O bottlenecks under tight time constraints."
        )
    elif "edge case" in last_msg or "bug" in last_msg or "test" in last_msg:
        reply = (
            f"### 🐛 Critical Edge Cases to Guard Against:\n\n"
            "1. **Empty / Null Input**: $N = 0$ array or empty collection.\n"
            "2. **Single Element**: $N = 1$ when target is present or missing.\n"
            "3. **Arithmetic Limits**: Values near `INT_MAX` ($2^{31}-1$) or negative numbers.\n"
            "4. **Duplicate Elements**: Repeated values that might be picked twice if indices aren't strictly checked.\n"
            "5. **Negative Values**: Negative numbers when computing modulo or division."
        )
    else:
        reply = (
            f"Hello! I am your **AI Coding Mentor**. I'm actively analyzing your **{lang_upper}** code.\n\n"
            "Here are a few questions you can ask me:\n"
            "- *'How can I optimize the time complexity of this code?'*\n"
            "- *'Explain this algorithm step-by-step.'*\n"
            "- *'What edge cases would fail this solution?'*\n"
            "- *'Can you show me a cleaner refactored version?'*\n\n"
            "What would you like to explore next?"
        )

    return ChatResponse(
        success=True,
        reply=reply,
        model_used="AI Mentor (Local Heuristic Engine)",
        is_demo_mode=True,
        warning_message="Running in Demo Mode. Provide GEMINI_API_KEY in backend/.env for live conversational AI."
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_mentor(
    request: ChatRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key")
):
    """
    Conversational AI Mentor endpoint powered by Google Gemini (with smart local heuristic fallback).
    Allows interactive questions, explanations, line-by-line breakdowns, and optimization ideas.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat history cannot be empty."
        )

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
        return generate_heuristic_chat(
            messages=request.messages,
            code=request.code,
            language=request.language,
            problem_context=request.problem_context
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=active_key.strip())

        system_instruction = (
            f"You are a friendly, world-class Senior Staff Software Engineer and Competitive Programming / DSA Mentor. "
            f"The student is working in {request.language.upper()}.\n\n"
            f"Here is the student's current code in their editor:\n"
            f"```{request.language}\n{request.code}\n```\n"
            + (f"\nProblem Description / Constraints:\n{request.problem_context}\n" if request.problem_context else "")
            + "\nGuidelines:\n"
            "- Provide encouraging, clear, and insightful guidance.\n"
            "- Use clean markdown headings, bold text, and syntax-highlighted code snippets where helpful.\n"
            "- When explaining algorithms or Big-O, give intuitive real-world analogies.\n"
            "- Keep answers focused, practical, and directly tied to the student's code."
        )

        history_str = ""
        for msg in request.messages[-8:]:
            role_label = "Student" if msg.role == "user" else "Mentor"
            history_str += f"{role_label}: {msg.content}\n\n"

        prompt = f"Here is the conversation so far:\n{history_str}Please provide your helpful response as the Mentor:"

        candidate_models = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.8-flash"]
        reply_text = None
        used_model = "gemini-flash-latest"
        last_err = None

        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.4,
                    )
                )
                reply_text = response.text.strip()
                used_model = model_name
                break
            except Exception as e:
                last_err = e
                continue

        if not reply_text:
            raise last_err or RuntimeError("No compatible Gemini model succeeded")

        return ChatResponse(
            success=True,
            reply=reply_text,
            model_used=used_model,
            is_demo_mode=False
        )

    except Exception as e:
        error_str = str(e)
        print(f"Gemini chat mentor error: {error_str}")
        fallback = generate_heuristic_chat(
            messages=request.messages,
            code=request.code,
            language=request.language,
            problem_context=request.problem_context
        )
        fallback.warning_message = f"Gemini API note ({error_str[:120]}). Displaying local mentor guidance."
        return fallback


if os.path.exists(frontend_dist_dir):
    @app.get("/{full_path:path}")
    async def serve_spa_client(full_path: str):
        # Do not catch /api endpoints
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(frontend_dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_path = os.path.join(frontend_dist_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Resource not found")



