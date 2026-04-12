# 🎓 School Management System (SMS)

## A Comprehensive, Full-Stack Educational Platform

A powerful, enterprise-grade school management system built with **Django REST Framework** and **React**. Streamline all educational operations with role-based access control, real-time communication, and comprehensive reporting.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![Django](https://img.shields.io/badge/django-5.0-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14+-orange.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-5.x-007FFF.svg)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Installation Guide](#-installation-guide)
- [User Roles & Permissions](#-user-roles--permissions)
- [API Documentation](#-api-documentation)
- [Testing Guide](#-testing-guide)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Support](#-support)

---

## 📖 Overview

This **School Management System (SMS)** is a complete solution for modern educational institutions. It eliminates administrative overhead, improves communication, and provides real-time insights into academic operations.

### Why Choose This System?

✅ **All-in-One Solution** - Manage everything from admissions to alumni  
✅ **Role-Based Access** - Granular permissions for 9+ user types  
✅ **Real-Time Features** - Live chat, instant notifications  
✅ **Scalable Architecture** - Handles thousands of users  
✅ **Mobile Responsive** - Works perfectly on all devices  
✅ **Data Export** - PDF, Excel, CSV reports  

---

## ✨ Key Features

### 👥 **User Management System**
- **Multi-role Architecture**: Super Admin, Admin, Head Admin, CEO, Teacher, Student, Parent, Librarian, Staff
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control (RBAC)**: Fine-grained permissions at every level
- **Profile Management**: Customizable profiles with avatar upload
- **Bulk User Import**: CSV import for quick user creation

### 📚 **Academic Management**
- **Class & Section Management**: Flexible class organization with automatic section naming (Grade 1A, 1B, etc.)
- **Subject Management**: Core, elective, and extra-curricular subjects with custom codes
- **Teacher Assignments**: Assign teachers to specific class-subject-section combinations
- **Term Management**: Academic year and term configuration (Quarter, Semester, Annual)
- **Grading System**: Comprehensive exam results, report cards, and transcripts
- **Student Enrollment**: Manage admissions, transfers, and elective course selection
- **Curriculum Planning**: Learning objectives with categories, units, and subunits

### 📅 **Schedule & Attendance**
- **Class Scheduling**: Create timetables with conflict detection
- **Attendance Tracking**: Daily attendance with multiple statuses (Present, Absent, Late, Excused)
- **Leave Management**: Student and teacher leave requests with approval workflow
- **Schedule Overrides**: Handle holidays, special events, and schedule changes
- **Real-time Dashboard**: View attendance statistics and trends

### 📝 **Lesson Planning & Assignments**
- **Learning Objectives**: Structured curriculum with hierarchical organization
- **Lesson Plans**: Detailed planning with objectives, activities, and evaluations
- **Assignments**: Create, assign, submit, and grade assignments online
- **Progress Tracking**: Monitor curriculum completion rates
- **Resource Attachment**: Upload files, links, and multimedia resources

### 💬 **Communication System**
- **Real-time Chat**: WebSocket-based instant messaging between users
- **Group Chats**: Create class groups, department groups, and project teams
- **Meeting Requests**: Schedule parent-teacher meetings with calendar integration
- **Announcements**: Broadcast to specific user groups (students, teachers, parents)
- **Feedback System**: Collect and manage feedback with ratings
- **Notifications**: Email and in-app notifications for important events

### 📖 **Library Management**
- **Book Catalog**: Comprehensive inventory with ISBN, author, publisher
- **Borrowing System**: Track checkouts, returns, and renewals
- **Member Management**: Library membership with borrowing limits
- **Overdue Tracking**: Automatic notifications for overdue books
- **Digital Resources**: Manage e-books and digital content

### 📝 **Resource Management**
- **Resource Requests**: Submit requests for supplies, equipment, and maintenance
- **Priority Levels**: Categorize by Low, Medium, High, Urgent
- **Approval Workflow**: Multi-step approval with comments and history
- **Budget Tracking**: Track estimated vs. actual costs
- **Inventory Management**: Monitor stock levels and reorder points
- **Vendor Management**: Track suppliers and purchase orders

### 📊 **Reports & Analytics**
- **Student Reports**: Comprehensive report cards with GPA, percentages, rankings
- **Attendance Reports**: Daily, weekly, monthly, and yearly summaries
- **Grade Reports**: Subject-wise performance, class rankings, trend analysis
- **Teacher Performance**: Evaluation metrics, student feedback, class averages
- **Dashboard Analytics**: Real-time KPIs, charts, and graphs
- **Export Options**: PDF, Excel, CSV formats with customizable templates

### 🎯 **Additional Features**
- **Blog System**: Share news, updates, and educational articles
- **Task Management**: Assign tasks with deadlines, priorities, and KPI tracking
- **Behavior Tracking**: Monitor student behavior with incident reporting
- **Health Records**: Maintain medical information and emergency contacts
- **Transport Management**: Track buses, routes, and student transportation
- **Fee Management**: Track payments, generate invoices, manage scholarships
- **Event Calendar**: Schedule and manage school events

---

## 🛠️ Technology Stack

### **Backend Technologies**
| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 5.0 | Web framework |
| Django REST Framework | 3.14 | API development |
| Django Channels | 4.0 | WebSocket support |
| PostgreSQL | 14+ | Primary database |
| JWT (SimpleJWT) | 5.3 | Authentication |
| Redis | 7.0 | Caching & message broker |
| Celery | 5.3 | Async task queue |
| Pillow | 10.1 | Image processing |
| ReportLab | 4.0 | PDF generation |
| Pandas | 2.1 | Data manipulation |
| OpenPyXL | 3.1 | Excel export |
| Django CORS Headers | 4.3 | CORS management |

### **Frontend Technologies**
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| Material-UI (MUI) | 5.14 | Component library |
| Redux Toolkit | 1.9 | State management |
| React Router | 6.20 | Navigation |
| Axios | 1.6 | HTTP client |
| Formik | 2.4 | Form management |
| Yup | 1.3 | Form validation |
| Recharts | 2.10 | Data visualization |
| React Query | 5.12 | Data fetching |
| Socket.io Client | 4.5 | WebSocket client |
| Date-fns | 3.0 | Date manipulation |

### **DevOps & Tools**
- **Docker** - Containerization
- **Nginx** - Reverse proxy & static files
- **Gunicorn** - WSGI server
- **Git** - Version control
- **GitHub Actions** - CI/CD
- **ESLint/Prettier** - Code formatting
- **Black/isort** - Python formatting

---

## 🚀 Quick Start

### **Prerequisites**

Ensure you have these installed:
- ✅ **Python 3.12+** - [Download](https://www.python.org/downloads/)
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- ✅ **Git** - [Download](https://git-scm.com/downloads)
- ✅ **Redis** (optional, for WebSocket) - [Download](https://redis.io/download)

### **Option 1: One-Click Setup (Windows)**

```batch
# Clone the repository
git clone https://github.com/muktarbdulkader/school-management-system.git
cd school-management-system

# Run the interactive setup menu
START_AND_TEST.bat

# Follow the menu options:
# 1. Run migrations
# 2. Create sample data
# 3. Start backend server
# 4. Start frontend server (in new terminal)
```

### **Option 2: Manual Setup**

#### **Backend Setup (5 minutes)**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure database (edit backend/mald_sms/settings.py)
# Update DATABASES settings with your PostgreSQL credentials:
"""
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sms_db',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
"""

# Create database in PostgreSQL
psql -U postgres
CREATE DATABASE sms_db;
\q

# Run migrations
python manage.py migrate

# Create system roles
python manage.py create_roles

# Create sample users
python manage.py create_users

# ⚠️ IMPORTANT: Assign students to classes
python manage.py assign_students_to_classes

# Start backend server
python manage.py runserver
```

**Backend running at:** `http://localhost:8000`

#### **Frontend Setup (3 minutes)**

Open a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment configuration
echo "VITE_SMS_URL=http://localhost:8000/api/" > .env
echo "VITE_AUTH_URL=http://localhost:8000/api/" >> .env

# Start development server
npm run dev
```

**Frontend running at:** `http://localhost:3000`

---

## 👥 User Roles & Permissions

### **Role Hierarchy**

```
                    ┌─────────────┐
                    │ Super Admin │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │    Admin    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────┴───┐   ┌────┴───┐   ┌────┴───┐
         │  CEO   │   │Head Adm│   │Teacher │
         └────────┘   └────────┘   └────┬───┘
                                        │
                              ┌─────────┼─────────┐
                              │         │         │
                           Student   Parent   Librarian
```

### **Detailed Permissions Matrix**

| Feature | Super Admin | Admin | CEO | Head Admin | Teacher | Student | Parent | Librarian | Staff |
|---------|-------------|-------|-----|------------|---------|---------|--------|-----------|-------|
| **System Management** |
| User Management | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Role Configuration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Academic Management** |
| Manage Classes | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Sections | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Subjects | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Teacher Assignments | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Attendance & Schedule** |
| Mark Attendance | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Attendance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Schedule | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Lesson Planning** |
| Create Lesson Plans | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit Assignments | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Grade Assignments | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Communication** |
| Send Messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Announcements | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Schedule Meetings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Library Management** |
| Manage Books | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Borrow Books | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Resource Management** |
| Create Requests | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Approve Requests | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports** |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Default Login Credentials**

After running `python manage.py create_users`, use these credentials:

| Role | Email | Password | Dashboard Access |
|------|-------|----------|------------------|
| **Super Admin** | superadmin@school.com | Admin@123 | Full system access |
| **Admin** | admin@school.com | Admin@123 | Branch management |
| **Head Admin** | headadmin@school.com | Admin@123 | Department oversight |
| **CEO** | ceo@school.com | Admin@123 | Analytics & reports |
| **Teacher** | teacher@school.com | Teacher@123 | Class management |
| **Student** | student@school.com | Student@123 | Learning portal |
| **Parent** | parent@school.com | Parent@123 | Child monitoring |
| **Librarian** | librarian@school.com | Librarian@123 | Library management |
| **Staff** | staff@school.com | Staff@123 | Resource requests |

---

## 📚 API Documentation

### **Authentication Endpoints**

```http
POST /api/token/              # Obtain JWT access & refresh tokens
POST /api/token/refresh/      # Refresh access token
POST /api/logout/             # Invalidate token
POST /api/register/           # User registration
GET  /api/profile/            # Get user profile
PUT  /api/profile/            # Update user profile
```

### **Core Resources API**

```http
# Users Management
GET    /api/users/            # List all users
GET    /api/users/{id}/       # Get user details
POST   /api/users/            # Create user
PUT    /api/users/{id}/       # Update user
DELETE /api/users/{id}/       # Delete user

# Student Management
GET    /api/students/         # List students
GET    /api/students/{id}/    # Get student details
POST   /api/students/enroll/  # Enroll student
GET    /api/students/classes/ # Get student's classes

# Teacher Management
GET    /api/teachers/         # List teachers
GET    /api/teachers/{id}/    # Get teacher details
POST   /api/teachers/assign/  # Assign teacher to class

# Class Management
GET    /api/classes/          # List classes
GET    /api/classes/{id}/     # Get class details
POST   /api/classes/create-with-sections/  # Create class with sections
GET    /api/classes/check-duplicate/       # Check duplicate class

# Subject Management
GET    /api/subjects/         # List subjects
POST   /api/subjects/         # Create subject
GET    /api/global_subjects/dropdown/  # Get global subjects

# Attendance
POST   /api/attendance/mark/  # Mark attendance
GET    /api/attendance/       # Get attendance records
GET    /api/attendance/report/ # Get attendance report

# Teacher Assignments
GET    /api/teacher_assignments/  # List assignments
POST   /api/teacher_assignments/  # Create assignment
PUT    /api/teacher_assignments/{id}/  # Update assignment
```

### **Resource Management API**

```http
# Resource Requests
GET    /api/materials/resource-requests/           # List requests
GET    /api/materials/resource-requests/{id}/      # Get request details
POST   /api/materials/resource-requests/           # Create request
PUT    /api/materials/resource-requests/{id}/      # Update request
DELETE /api/materials/resource-requests/{id}/      # Delete request
POST   /api/materials/resource-requests/{id}/approve-reject/  # Approve/Reject
GET    /api/materials/resource-requests/statistics/  # Get statistics
GET    /api/materials/resource-requests/export/    # Export to CSV/Excel
```

### **Communication API**

```http
# Chat System
GET    /api/communication/chats/                    # List conversations
GET    /api/communication/chats/{id}/               # Get chat messages
POST   /api/communication/chats/                    # Send message
POST   /api/communication/chats/group/              # Create group chat

# Meetings
GET    /api/communication/meetings/                 # List meetings
POST   /api/communication/meetings/                 # Schedule meeting
PUT    /api/communication/meetings/{id}/confirm/    # Confirm meeting

# Announcements
GET    /api/communication/announcements/            # List announcements
POST   /api/communication/announcements/            # Create announcement
GET    /api/communication/announcements/{id}/       # Get announcement

# Feedback
GET    /api/communication/feedback/                 # List feedback
POST   /api/communication/feedback/                 # Submit feedback
```

### **Library API**

```http
# Books
GET    /api/library/books/                          # List books
GET    /api/library/books/{id}/                     # Get book details
POST   /api/library/books/                          # Add book
PUT    /api/library/books/{id}/                     # Update book
DELETE /api/library/books/{id}/                     # Delete book

# Borrowing
GET    /api/library/borrowings/                     # List borrowings
POST   /api/library/borrowings/                     # Borrow book
POST   /api/library/borrowings/{id}/return/         # Return book
GET    /api/library/borrowings/overdue/             # Get overdue books
```

### **Reports API**

```http
GET    /api/reports/student/{student_id}/           # Student report card
GET    /api/reports/attendance/                     # Attendance report
GET    /api/reports/grades/                         # Grade report
GET    /api/reports/teacher-performance/            # Teacher performance
GET    /api/reports/export/                         # Export report
```

**Interactive API Documentation:** `http://localhost:8000/swagger/`

---

## 🧪 Testing Guide

### **Automated Testing**

```bash
# Run backend tests
cd backend
python manage.py test

# Run specific test file
python manage.py test api.tests.test_resource_requests

# Run frontend tests
cd frontend
npm test

# Run test coverage
npm run test:coverage
```

### **Manual Testing Checklist**

#### **1. Authentication Testing**
- [ ] Login with different user roles
- [ ] Test invalid credentials
- [ ] Verify token expiration
- [ ] Test logout functionality
- [ ] Test password reset flow

#### **2. Resource Request Testing**
```bash
# Create a resource request
curl -X POST http://localhost:8000/api/materials/resource-requests/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Projector",
    "description": "HD projector for classroom",
    "priority": "high",
    "estimated_cost": 500.00
  }'

# Approve the request
curl -X POST http://localhost:8000/api/materials/resource-requests/1/approve-reject/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "comments": "Approved for purchase"}'
```

#### **3. Class Creation Testing**
```bash
# Create a new class
curl -X POST http://localhost:8000/api/classes/create-with-sections/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grade_number": 5,
    "sections_count": 3,
    "branch_id": 1,
    "term_id": 1
  }'
```

#### **4. Comprehensive Testing Guide**

Use the interactive tester:
```bash
START_AND_TEST.bat
# Select option: Run Tests
```

Or follow the detailed guide:
```bash
# Read the complete testing documentation
cat TESTING_GUIDE.md
```

### **Test Data Generation**

```bash
# Generate sample data for testing
python manage.py generate_test_data --users=50 --classes=10

# Create performance test data
python manage.py generate_performance_data --requests=1000
```

---

## 🤝 Contributing

We warmly welcome contributions! Here's how you can help:

### **Getting Started as a Contributor**

1. **Fork the repository**
   ```bash
   # Click Fork button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/school-management-system.git
   cd school-management-system
   ```

2. **Set up development environment**
   ```bash
   # Install development dependencies
   cd backend
   pip install -r requirements-dev.txt
   
   cd ../frontend
   npm install --save-dev
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-description
   ```

4. **Make your changes**
   - Write clean, documented code
   - Follow coding standards (PEP 8 for Python, ESLint for JS)
   - Add tests for new features
   - Update documentation

5. **Run tests**
   ```bash
   # Backend tests
   cd backend
   python manage.py test
   
   # Frontend tests
   cd frontend
   npm run lint
   npm test
   ```

6. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/amazing-feature
   ```

7. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Write a clear description
   - Reference any related issues

### **Contribution Guidelines**

- **Code Style**
  - Python: Follow PEP 8 (use Black formatter)
  - JavaScript: Follow Airbnb style guide (use Prettier)
  - Commit messages: Conventional Commits format

- **Testing**
  - Write unit tests for new features
  - Ensure all tests pass
  - Maintain or improve code coverage

- **Documentation**
  - Update README if needed
  - Add docstrings to functions
  - Comment complex logic

### **Development Workflow**

```
┌─────────────────┐
│  Fork Repository│
└────────┬────────┘
         ↓
┌─────────────────┐
│  Clone your fork│
└────────┬────────┘
         ↓
┌─────────────────┐
│  Create branch  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Make changes   │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Run tests     │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Push to fork   │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Pull Request   │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Code review    │
└────────┬────────┘
         ↓
┌─────────────────┐
│    Merge        │
└─────────────────┘
```

### **Need Help?**

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
- Check [PULL_REQUEST_GUIDE.md](PULL_REQUEST_GUIDE.md) for PR best practices
- Run `FIRST_PR.bat` for interactive help (Windows)
- Join discussions on GitHub

---

## 🐛 Troubleshooting

### **Common Issues & Solutions**

#### **Backend Issues**

| Issue | Solution |
|-------|----------|
| **"Module not found" errors** | `pip install -r requirements.txt` |
| **Database connection failed** | Check PostgreSQL is running: `pg_ctl status` |
| **Migrations not applying** | `python manage.py migrate --fake` then `python manage.py migrate` |
| **Port already in use** | `python manage.py runserver 8001` (use different port) |
| **CORS errors** | Check `CORS_ALLOWED_ORIGINS` in settings.py |
| **WebSocket connection failed** | Ensure Redis is running: `redis-server` |

#### **Frontend Issues**

| Issue | Solution |
|-------|----------|
| **npm install fails** | Delete `node_modules` and `package-lock.json`, then `npm install` |
| **API calls returning 404** | Check `.env` file has correct API URL |
| **Build fails** | `npm cache clean --force` then rebuild |
| **Components not rendering** | Check browser console for errors |
| **State not updating** | Verify Redux devtools and actions |

#### **Database Issues**

```sql
-- Reset database (development only)
DROP DATABASE sms_db;
CREATE DATABASE sms_db;

-- Check for orphaned records
SELECT * FROM students WHERE class_id NOT IN (SELECT id FROM classes);

-- Fix sequence issues
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
```

#### **Performance Issues**

```bash
# Enable Django debug toolbar for performance profiling
# Add to settings.py:
INSTALLED_APPS += ['debug_toolbar']

# Check slow queries
python manage.py shell
>>> from django.db import connection
>>> connection.queries

# Clear cache
python manage.py clear_cache
```

### **Quick Diagnostic Commands**

```bash
# Check system health
python manage.py check --deploy

# Verify database integrity
python manage.py check --database default

# List all URLs
python manage.py show_urls

# Check for missing migrations
python manage.py makemigrations --dry-run

# Reset admin password
python manage.py changepassword admin@school.com
```

---

## 🗺️ Roadmap

### **Version 1.0 (Current) - Core Features** ✅
- ✅ User management with 9 roles
- ✅ Class and section management
- ✅ Attendance tracking
- ✅ Basic reporting
- ✅ Resource request system
- ✅ Real-time chat

### **Version 1.1 (Coming Q1 2025)** 🚧
- 🔄 Mobile application (React Native)
- 🔄 Advanced analytics dashboard
- 🔄 Payment gateway integration
- 🔄 SMS notifications
- 🔄 Multi-language support (English, Arabic, French)

### **Version 1.2 (Planned Q2 2025)** 📅
- 📅 AI-powered recommendations
- 📅 Automated report generation
- 📅 Video conferencing integration
- 📅 Parent mobile app
- 📅 Transport tracking system

### **Version 2.0 (Future)** 🔮
- 🔮 Blockchain for certificates
- 🔮 Virtual reality classrooms
- 🔮 Predictive analytics
- 🔮 International baccalaureate support
- 🔮 Alumni network platform

---

## 📞 Support & Community

### **Getting Help**

| Resource | Link |
|----------|------|
| **GitHub Issues** | [Report bugs](https://github.com/muktarbdulkader/school-management-system/issues) |
| **GitHub Discussions** | [Ask questions](https://github.com/muktarbdulkader/school-management-system/discussions) |
| **Documentation** | [Wiki](https://github.com/muktarbdulkader/school-management-system/wiki) |
| **Email Support** | support@schoolms.com |

### **Community Guidelines**

1. **Be respectful** - Treat others with kindness
2. **Help others** - Answer questions when you can
3. **Share knowledge** - Write tutorials and guides
4. **Report responsibly** - Follow security disclosure policy

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Muktar Abdulkader

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...
```

---

## 🙏 Acknowledgments

### **Special Thanks To**

- **Django REST Framework Team** - For the excellent API framework
- **Material-UI Team** - For the beautiful React components
- **All Contributors** - Who have helped improve this project
- **Open Source Community** - For the amazing tools and libraries

### **Libraries & Tools Used**

- **Backend**: Django, DRF, Channels, Celery, Redis
- **Frontend**: React, MUI, Redux Toolkit, React Router
- **Database**: PostgreSQL, Redis
- **Testing**: Pytest, Jest, React Testing Library
- **Deployment**: Docker, Nginx, Gunicorn

---

## 📊 Project Statistics

```
├── Backend
│   ├── 45+ Django models
│   ├── 80+ API endpoints
│   ├── 90% test coverage
│   └── 15,000+ lines of code
│
├── Frontend
│   ├── 60+ React components
│   ├── 20+ custom hooks
│   ├── 10+ Redux slices
│   └── 25,000+ lines of code
│
└── Database
    ├── 30+ tables
    ├── 50+ relationships
    └── Optimized queries
```

---

## 🌟 Star Us!

If this project helps you, please **star** ⭐ the repository on GitHub!

[![Star on GitHub](https://img.shields.io/github/stars/muktarbdulkader/school-management-system?style=social)](https://github.com/muktarbdulkader/school-management-system)

---

## 🔗 Quick Links

- **Repository**: [github.com/muktarbdulkader/school-management-system](https://github.com/muktarbdulkader/school-management-system)
- **Live Demo**: Coming soon
- **Documentation**: [Wiki](https://github.com/muktarbdulkader/school-management-system/wiki)
- **Issues**: [GitHub Issues](https://github.com/muktarbdulkader/school-management-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/muktarbdulkader/school-management-system/discussions)

---

**Made with ❤️ for educational institutions worldwide**

*Empowering education through technology*