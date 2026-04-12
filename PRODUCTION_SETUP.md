# Production Setup Guide

## ✅ Backend Deployed Successfully!

Your backend is live at: **https://school-management-backend-nrs9.onrender.com**

## 🎯 Next Steps

### Step 1: Initialize Database with Sample Data

Go to your Render dashboard and open the Shell for your backend service, then run:

```bash
python manage.py create_roles
python manage.py create_users
python manage.py assign_students_to_classes
python manage.py assign_teachers_to_branches
```

This creates:
- 9 user roles (Super Admin, Admin, Teacher, Student, Parent, Librarian, Accountant, Receptionist, Driver)
- Sample users for each role
- Assigns students to classes/sections
- Assigns teachers to branches

### Step 2: Test Backend API

Visit these URLs to verify your backend is working:

- **API Root**: https://school-management-backend-nrs9.onrender.com/api/
- **Admin Panel**: https://school-management-backend-nrs9.onrender.com/admin/
- **API Documentation**: https://school-management-backend-nrs9.onrender.com/api/schema/swagger-ui/

### Step 3: Deploy Frontend

You have several options for deploying the frontend:

#### Option A: Deploy to Vercel (Recommended - Free & Easy)

1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `school-Management-system` repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` or `yarn build`
   - **Output Directory**: `dist`
6. Add Environment Variables:
   ```
   VITE_SMS_URL=https://school-management-backend-nrs9.onrender.com/api/
   VITE_APP_VERSION=v1.0.0
   VITE_APP_BASE_NAME=/
   ```
7. Click "Deploy"

#### Option B: Deploy to Netlify

1. Go to [Netlify](https://netlify.com)
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. Add Environment Variables (same as Vercel)
7. Click "Deploy"

#### Option C: Deploy to Render (Same as Backend)

1. In Render dashboard, click "New +"
2. Select "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: school-management-frontend
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` or `yarn build`
   - **Publish Directory**: `dist`
5. Add Environment Variables (same as above)
6. Click "Create Static Site"

### Step 4: Update CORS Settings (After Frontend Deployment)

Once your frontend is deployed, you'll get a URL like:
- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`
- Render: `https://your-app.onrender.com`

To restrict CORS to only your frontend domain:

1. Open `backend/mald_sms/settings.py`
2. Replace the CORS section with:
```python
CORS_ALLOW_CREDENTIALS = True

# Production CORS - restrict to your frontend domain
if os.environ.get('RENDER_EXTERNAL_HOSTNAME'):
    CORS_ALLOWED_ORIGINS = [
        "https://your-frontend-domain.vercel.app",  # Replace with your actual domain
    ]
else:
    # Development origins
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
```
3. Commit and push changes
4. Render will auto-deploy the updated backend

## 🔐 Default Login Credentials

After running the setup commands, you can login with:

### Super Admin
- **Username**: `superadmin`
- **Password**: `admin123`

### Admin
- **Username**: `admin`
- **Password**: `admin123`

### Teacher
- **Username**: `teacher1`
- **Password**: `teacher123`

### Student
- **Username**: `student1`
- **Password**: `student123`

### Parent
- **Username**: `parent1`
- **Password**: `parent123`

**⚠️ IMPORTANT**: Change these passwords immediately after first login!

## 🧪 Testing the Full Stack

1. Open your deployed frontend URL
2. Login with one of the credentials above
3. Test key features:
   - Dashboard loads correctly
   - Can view students/teachers/classes
   - Can create/edit records
   - Resource requests work
   - Schedule displays correctly

## 📝 Environment Variables Summary

### Backend (Render)
Already configured in your Render dashboard:
- `DATABASE_URL` - Auto-set by Render
- `SECRET_KEY` - Django secret key
- `DEBUG` - Set to `False`
- `PYTHON_VERSION` - `3.12.3`
- `DJANGO_SETTINGS_MODULE` - `mald_sms.settings`

### Frontend (Vercel/Netlify/Render)
Add these when deploying:
```
VITE_SMS_URL=https://school-management-backend-nrs9.onrender.com/api/
VITE_APP_VERSION=v1.0.0
VITE_APP_BASE_NAME=/
```

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify `VITE_SMS_URL` is set correctly
- Check browser console for errors
- Verify backend is running (visit the API URL)

### Login not working
- Make sure you ran `create_roles` and `create_users` commands
- Check backend logs in Render dashboard
- Verify JWT settings in backend

### Static files not loading
- Check if `collectstatic` ran successfully in build logs
- Verify `STATIC_ROOT` and `STATIC_URL` in settings.py

### Database errors
- Check if migrations ran successfully
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running

## 🎉 Success Checklist

- [ ] Backend deployed and running
- [ ] Database initialized with sample data
- [ ] Backend API accessible
- [ ] Admin panel accessible
- [ ] Frontend deployed
- [ ] Frontend can connect to backend
- [ ] Login works
- [ ] Dashboard displays correctly
- [ ] CORS configured properly
- [ ] Default passwords changed

## 📚 Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🆘 Need Help?

If you encounter issues:
1. Check the deployment logs
2. Review error messages carefully
3. Verify all environment variables are set
4. Check CORS configuration
5. Ensure database migrations ran successfully

Your School Management System is almost ready! Just deploy the frontend and you're good to go! 🚀
