# AI Integration Guide for School Management System

This guide documents all AI-powered features integrated across the School Management System.

## Quick Reference: AI Endpoints by Module

### 1. Core AI API Endpoints (`/api/ai/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `grammar-check/` | POST | Check grammar & spelling in any text |
| `summarize/` | POST | Summarize long text |
| `explain/` | POST | Explain complex content |
| `batch-summarize/` | POST | Summarize collections of data |
| `history/` | GET | User's AI request history |
| `status/` | GET | AI service status |
| `admin/dashboard/` | GET | Super Admin AI Analytics Dashboard |
| `admin/school-report/` | GET | AI-powered school overview report |

### 2. Module-Specific AI Endpoints

#### Communication Module (`/api/communication/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `announcements/{id}/grammar-check/` | POST | Grammar check announcement |
| `announcements/{id}/summarize/` | POST | Summarize announcement |
| `announcements/batch-analyze/` | POST | AI analyze all announcements |
| `parent_feedback/ai-analyze/` | POST | Analyze parent feedback patterns |

#### Blogs Module (`/api/blogs/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `posts/{id}/grammar-check/` | POST | Grammar check blog post |
| `posts/{id}/summarize/` | POST | Generate blog post summary |
| `posts/batch-analyze/` | POST | Analyze blog post trends |

#### Tasks Module (`/api/tasks/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `tasks/{id}/grammar-check/` | POST | Grammar check task description |
| `tasks/ai-analyze/` | POST | Analyze task patterns & productivity |

#### Students Module (`/api/students/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `students/ai-analyze/` | POST | Batch analyze student performance |
| `students/{id}/ai-explain-progress/` | POST | Explain student progress for parents |

#### Teachers Module (`/api/teachers/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `teachers/ai-analyze/` | POST | Analyze teacher performance patterns |
| `teachers/{id}/ai-summarize-performance/` | POST | Summarize teacher's performance |

## Frontend: AI Analytics Dashboard

### Location
- **Component**: `frontend/src/views/dashboard/ai-analytics-dashboard.jsx`
- **Route**: `/ai-analytics`
- **Menu Access**: Admin Portal → AI Analytics (Super Admin only)

### Features
- **Overview Cards**: Total users, students, teachers, daily active
- **User Growth Chart**: 12-month trend
- **Daily Active Users**: 7-day chart
- **Grade Distribution**: Students by grade level
- **Task Status**: Doughnut chart of task completion
- **AI Usage Stats**: Request counts, success rates, by type
- **Communication Stats**: Announcements, messages, feedback
- **Engagement Metrics**: Attendance rate, task completion, blog posts
- **AI-Generated Insights**: Summary and recommendations

### Usage
```bash
# Only Super Admin can access
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/ai/admin/dashboard/
```

## Configuration

### Environment Variables

```bash
# AI Provider (mock, openai, gemini, groq)
AI_PROVIDER=mock

# API Keys
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=gsk_your_groq_key  # Fast Llama/Mixtral models

# Rate Limits
AI_RATE_LIMIT=100
AI_DAILY_GRAMMAR_LIMIT=50
AI_DAILY_SUMMARIZE_LIMIT=30
```

### Setup Steps

1. **Run migrations**:
```bash
cd backend
python manage.py migrate ai_integration
```

2. **Set provider**:
```bash
# For development (mock AI)
export AI_PROVIDER=mock

# For production (OpenAI, Gemini, or Groq):
export AI_PROVIDER=openai
export OPENAI_API_KEY=sk-...

export AI_PROVIDER=gemini
export GEMINI_API_KEY=AIzaSy...

export AI_PROVIDER=groq
export GROQ_API_KEY=gsk_...
```

3. **Restart server**

## Usage Examples

### Grammar Check
```bash
curl -X POST http://localhost:8000/api/ai/grammar-check/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "The students are working on there projects."}'
```

Response:
```json
{
  "success": true,
  "data": {
    "original_text": "The students are working on there projects.",
    "corrected_text": "The students are working on their projects.",
    "errors_found": 1,
    "suggestions": [{
      "original": "there",
      "correction": "their",
      "explanation": "Possessive form needed"
    }]
  }
}
```

### Batch Analyze Students
```bash
curl -X POST http://localhost:8000/api/students/ai-analyze/ \
  -H "Authorization: Bearer <token>"
```

### Analyze Announcements
```bash
curl -X POST http://localhost:8000/api/communication/announcements/batch-analyze/ \
  -H "Authorization: Bearer <token>"
```

## AI Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│              AI Analytics Dashboard                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Django REST API                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Communication│  │   Students   │  │   Teachers   │  │
│  │   Views      │  │    Views     │  │    Views     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │         │
│  ┌──────▼──────────────────▼──────────────────▼───────┐  │
│  │              AI Integration Module               │  │
│  │  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │   Services   │  │    Views     │             │  │
│  │  │  (OpenAI/    │  │  (API Endpts)│             │  │
│  │  │   Gemini/    │  │              │             │  │
│  │  │   Groq/      │  │              │             │  │
│  │  │   Mock)      │  │              │             │  │
│  │  └──────────────┘  └──────────────┘             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
backend/api/ai_integration/
├── __init__.py
├── admin.py              # AIRequest admin config
├── analytics_views.py    # Super Admin dashboard
├── apps.py
├── models.py             # AIRequest tracking model
├── README.md             # Main documentation
├── INTEGRATION_GUIDE.md  # This file
├── serializers.py        # API serializers
├── services.py           # AI provider implementations
├── urls.py               # URL routing
├── utils.py              # Utility functions
├── views.py              # Core AI endpoints
└── migrations/
    └── 0001_initial.py

frontend/src/views/dashboard/
└── ai-analytics-dashboard.jsx  # Super Admin Dashboard UI

frontend/src/menu-items/
└── admin-portal.js             # Updated with AI menu

frontend/src/routes/
└── MainRoutes.jsx              # Updated with AI route
```

## Troubleshooting

### Common Issues

1. **AI requests failing**
   - Check AI_PROVIDER environment variable
   - Verify API keys are set for non-mock providers
   - Check `api/ai/status/` endpoint

2. **Dashboard not loading**
   - Ensure user is superuser (`is_superuser: true`)
   - Check browser console for API errors
   - Verify Chart.js is installed: `npm install chart.js react-chartjs-2`

3. **Menu not showing**
   - Clear localStorage and refresh
   - Verify user has 'super_admin' role

## Next Steps

1. Connect real AI provider (OpenAI/Gemini)
2. Add more granular AI permissions
3. Implement AI caching for repeated requests
4. Add more visualizations to dashboard
5. Create scheduled AI reports
