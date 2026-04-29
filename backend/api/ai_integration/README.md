# AI Integration Module

This module provides AI-powered features for the School Management System including grammar checking, text summarization, and content explanation.

## Features

### 1. Grammar Check (`/api/ai/grammar-check/`)
Checks text for grammar and spelling errors with suggestions.

**Request:**
```json
{
    "text": "The students needs to study more for there exams.",
    "language": "en"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "original_text": "The students needs to study more for there exams.",
        "corrected_text": "The students need to study more for their exams.",
        "errors_found": 2,
        "suggestions": [
            {
                "original": "needs",
                "correction": "need",
                "explanation": "Subject-verb agreement: plural subject 'students' requires plural verb 'need'",
                "position": "found in text"
            },
            {
                "original": "there",
                "correction": "their",
                "explanation": "Possessive form needed: 'their' shows possession, 'there' indicates location",
                "position": "found in text"
            }
        ]
    }
}
```

### 2. Summarize (`/api/ai/summarize/`)
Summarizes long text into shorter form.

**Request:**
```json
{
    "text": "Long text to summarize...",
    "max_length": 150,
    "style": "concise"
}
```

Styles: `concise`, `detailed`, `bullet_points`, `key_points`

### 3. Explain (`/api/ai/explain/`)
Explains complex text with customizable audience and format.

**Request:**
```json
{
    "text": "Quantum mechanics is a fundamental theory...",
    "audience": "beginner",
    "format": "analogy"
}
```

Audiences: `beginner`, `intermediate`, `expert`
Formats: `paragraph`, `steps`, `analogy`

### 4. Batch Summarize (`/api/ai/batch-summarize/`)
Summarizes a collection of data items (e.g., student grades, reports).

**Request:**
```json
{
    "items": [
        {"student": "John", "grade": 85, "subject": "Math"},
        {"student": "Jane", "grade": 92, "subject": "Science"}
    ],
    "summary_type": "trends"
}
```

Types: `overview`, `trends`, `comparison`, `key_insights`

### 5. AI Status (`/api/ai/status/`)
Check AI service status and available providers.

### 6. History (`/api/ai/history/`)
View user's AI request history.

## Configuration

### Environment Variables

```bash
# AI Provider (openai, gemini, groq, or mock for development)
AI_PROVIDER=mock

# API Keys (required for real AI providers)
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=gsk_your_groq_key_here  # Fastest option - https://console.groq.com/keys

# Rate Limits (per user per day)
AI_RATE_LIMIT=100
AI_DAILY_GRAMMAR_LIMIT=50
AI_DAILY_SUMMARIZE_LIMIT=30
```

### Available Providers

1. **Mock** (`AI_PROVIDER=mock`) - Development mode with basic mock responses
2. **OpenAI** (`AI_PROVIDER=openai`) - GPT-3.5-turbo for all features
3. **Gemini** (`AI_PROVIDER=gemini`) - Google's Gemini Pro model
4. **Groq** (`AI_PROVIDER=groq`) - Fast Llama 3, Mixtral models (recommended for speed)

### Rate Limiting

Each user is limited to:
- 100 total AI requests per day
- 50 grammar checks per day
- 30 summarizations per day

## Setup

1. **Run migrations:**
```bash
cd backend
python manage.py migrate ai_integration
```

2. **Set environment variables** (for real AI providers)

3. **Test the endpoints** using the mock provider first

## Use Cases in School Management

1. **Teacher Reports** - Summarize student progress across multiple assignments
2. **Parent Communication** - Grammar check before sending announcements
3. **Document Processing** - Summarize long academic papers
4. **Lesson Planning** - Explain complex concepts for different age groups
5. **Data Analysis** - Get insights from student performance data

## Testing

Test with mock provider:
```bash
curl -X POST http://localhost:8000/api/ai/grammar-check/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"text": "teh studnets are learnign"}'
```
