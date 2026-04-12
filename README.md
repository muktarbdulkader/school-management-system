# 🎓 School Management System (SMS)

A comprehensive, full-stack school management system designed to streamline educational institution operations. Built with Django REST Framework and React, this system provides role-based access control and manages everything from student enrollment to resource requests.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![Django](https://img.shields.io/badge/django-5.0-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)

## ✨ Key Features

### 👥 User Management
- **Multi-role System**: Super Admin, Admin, Head Admin, CEO, Teacher, Student, Parent, Librarian, Staff
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions for each user role
- **Profile Management**: Customizable profiles with image upload

### 📚 Academic Management
- **Class & Section Management**: Organize students into classes and sections
- **Subject Management**: Core, elective, and extra-curricular subjects
- **Teacher Assignments**: Assign teachers to specific class-subject combinations
- **Term Management**: Academic year and term configuration
- **Grading System**: Comprehensive exam results and report cards
- **Student Enrollment**: Manage student admissions and elective course selection

### � Schedule & Attendance
- **Class Scheduling**: Create and manage class timetables
- **Attendance Tracking**: Daily attendance marking with multiple status options
- **Leave Management**: Student and teacher leave request system with approval workflow
- **Schedule Overrides**: Handle special events and schedule changes

### � Lesson Planning
- **Learning Objectives**: Structured curriculum with categories, units, and subunits
- **Lesson Plans**: Detailed lesson planning with activities and evaluations
- **Assignments**: Create, assign, and track student assignments
- **Progress Tracking**: Monitor curriculum completion and student progress

### � Communication
- **Real-time Chat**: WebSocket-based messaging between users
- **Group Chats**: Create and manage group conversations
- **Meeting Requests**: Schedule and manage parent-teacher meetings
- **Announcements**: Broadcast important information to specific user groups
- **Feedback System**: Collect and manage feedback from parents and students

### � Library Management
- **Book Catalog**: Comprehensive book inventory management
- **Borrowing System**: Track book checkouts and returns
- **Member Management**: Library membership for students and staff
- **Overdue Tracking**: Automatic overdue book notifications

### 📝 Resource Management
- **Resource Requests**: Submit and approve requests for supplies, equipment, and maintenance
- **Priority Management**: Categorize requests by urgency (Low, Medium, High, Urgent)
- **Approval Workflow**: Multi-step approval process for resource allocation
- **Budget Tracking**: Monitor estimated and actual costs

### 📊 Reports & Analytics
- **Student Reports**: Generate comprehensive student report cards
- **Attendance Reports**: Export attendance data in multiple formats (PDF, Excel, CSV)
- **Grade Reports**: Detailed academic performance reports
- **Teacher Performance**: Track and evaluate teacher metrics
- **Dashboard Analytics**: Real-time statistics and insights

### 📱 Additional Features
- **Blog System**: Share news, updates, and educational content
- **Task Management**: Assign and track tasks with KPI integration
- **Behavior Tracking**: Monitor and record student behavior incidents
- **Health Records**: Maintain student health information
- **Data Export**: Export data in PDF, Excel, and CSV formats

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL (with psycopg2-binary)
- **Real-time**: Django Channels (WebSocket support)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **File Processing**: Pillow (image handling), ReportLab (PDF generation)
- **Data Export**: pandas, openpyxl (Excel export)

### Frontend
- **Framework**: React 18.x
- **UI Library**: Material-UI (MUI)
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Forms**: Formik + Yup validation
- **Charts**: Recharts

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- **Python 3.12+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **PostgreSQL 14+** - [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git** - [Download Git](https://git-scm.com/downloads)

### Quick Start

#### Option 1: Using Helper Scripts (Windows)

```bash
# Run the interactive startup menu
START_AND_TEST.bat

# Follow the menu to:
# 1. Run migrations
# 2. Create sample data
# 3. Start backend
# 4. Start frontend (in new terminal)
```

#### Option 2: Manual Setup

**Backend Setup:**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure database in settings.py
# Update DATABASES settings with your PostgreSQL credentials

# Run migrations
python manage.py migrate

# Create roles and sample users
python manage.py create_roles
python manage.py create_users

# IMPORTANT: Assign students to classes and sections
# (Required for students to appear in teacher dashboards)
python manage.py assign_students_to_classes

# Start development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

**Frontend Setup:**

```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_SMS_URL=http://localhost:8000/api/" > .env
echo "VITE_AUTH_URL=http://localhost:8000/api/" >> .env

Frontend will be available at: `http://localhost:3000`

## ⚠️ Important Setup Note

After creating users, you must assign students to classes and sections for them to appear in teacher dashboards:

```bash
cd backend
python manage.py assign_students_to_classes
```

This command assigns all unassigned students to available classes and sections. Without this step, teachers won't see any students in their dashboard.

## 📖 Default Credentials

Frontend will be available at: `http://localhost:3000`

## 📖 Default Credentials

After running `create_users` command, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@school.com | Admin@123 |
| Admin | admin@school.com | Admin@123 |
| Teacher | teacher@school.com | Teacher@123 |
| Student | student@school.com | Student@123 |
| Parent | parent@school.com | Parent@123 |

## 👥 User Roles & Permissions

### Super Admin
- Full system access
- Manage all users and roles
- System configuration
- View all reports and analytics

### Admin / Head Admin
- Manage users within their branch
- Configure academic settings
- Approve resource requests
- Generate reports

### CEO
- View system-wide analytics
- Access financial reports
- Monitor performance metrics

### Teacher
- Manage assigned classes
- Mark attendance
- Create lesson plans
- Grade students
- Communicate with students and parents

### Student
- View schedule and grades
- Submit assignments
- Access library
- Communicate with teachers

### Parent
- View children's progress
- Request meetings
- Provide feedback
- Monitor attendance

### Librarian
- Manage library catalog
- Process book borrowing/returns
- Track overdue books

### Staff
- Submit resource requests
- Access assigned tasks
- View relevant information

## 📚 API Endpoints

### Authentication
```
POST   /api/token/                    - Obtain JWT token
POST   /api/token/refresh/            - Refresh JWT token
POST   /api/logout/                   - Logout user
```

### Core Resources
```
GET    /api/users/                    - List users
GET    /api/students/                 - List students
GET    /api/teachers/                 - List teachers
GET    /api/classes/                  - List classes
GET    /api/sections/                 - List sections
GET    /api/subjects/                 - List subjects
GET    /api/schedule_slots/           - List schedules
POST   /api/attendance/               - Mark attendance
```

### Resource Management
```
GET    /api/materials/resource-requests/              - List requests
POST   /api/materials/resource-requests/              - Create request
POST   /api/materials/resource-requests/{id}/approve-reject/  - Approve/Reject
GET    /api/materials/resource-requests/statistics/   - Get statistics
```

### Communication
```
GET    /api/communication/chats/      - List chats
POST   /api/communication/chats/      - Send message
GET    /api/communication/meetings/   - List meetings
POST   /api/communication/announcements/  - Create announcement
```

Full API documentation: `http://localhost:8000/swagger/` (when backend is running)

## 🧪 Testing

Follow the comprehensive testing guide:

```bash
# Read the testing guide
cat TESTING_GUIDE.md

# Or use the interactive tester
START_AND_TEST.bat
```

### Quick Test
1. Start both servers
2. Open http://localhost:3000
3. Login with superadmin@school.com / Admin@123
4. Navigate to Resource Requests
5. Create a test request
6. Verify it appears in the table

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Quick Contribution Guide

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/school-management-system.git
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** on GitHub

For detailed instructions, see:
- **CONTRIBUTING.md** - Complete contribution guidelines
- **PULL_REQUEST_GUIDE.md** - Step-by-step PR guide
- **FIRST_PR.bat** - Interactive helper for first-time contributors

### Contribution Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript code
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📝 Documentation

- **README.md** (this file) - Project overview and setup
- **CONTRIBUTING.md** - How to contribute
- **PULL_REQUEST_GUIDE.md** - Creating pull requests
- **TESTING_GUIDE.md** - Complete testing instructions
- **FIXES_SUMMARY.md** - Recent fixes and improvements
- **RESOURCE_REQUESTS_FIX.md** - Technical fix details
- **docs/PR_WORKFLOW.txt** - Visual workflow diagrams

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.12+

# Reinstall dependencies
pip install -r requirements.txt

# Check database connection
python manage.py check
```

### Frontend Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### API Returns 404
1. Verify backend is running: http://localhost:8000
2. Check CORS settings in `backend/mald_sms/settings.py`
3. Verify URL patterns in backend

### Can't Login
1. Verify sample users created: `python manage.py create_users`
2. Check credentials match exactly
3. Clear browser cache and cookies

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/muktarbdulkader/school-management-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/muktarbdulkader/school-management-system/discussions)
- **Documentation**: Check the docs/ folder

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Payment gateway integration
- [ ] SMS/Email notifications
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Offline mode support
- [ ] Advanced reporting with custom filters

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Django REST Framework team for the excellent API framework
- Material-UI team for the beautiful React components
- All contributors who have helped improve this project

## 📊 Project Status

- ✅ Core features implemented
- ✅ Authentication and authorization working
- ✅ Resource management functional
- ✅ Communication system operational
- ✅ Reports and analytics available
- 🔄 Continuous improvements and bug fixes

## 🚀 Quick Links

- **Live Demo**: Coming soon
- **Documentation**: [Wiki](https://github.com/muktarbdulkader/school-management-system/wiki)
- **API Docs**: http://localhost:8000/swagger/ (when running)
- **Contributing**: See CONTRIBUTING.md
- **Testing**: See TESTING_GUIDE.md

---

**Made with ❤️ for educational institutions worldwide**

⭐ Star this repository if you find it helpful!

**Repository**: https://github.com/muktarbdulkader/school-management-system
#   s c h o o l - m a n a g e m e n t - s y s t e m  
 