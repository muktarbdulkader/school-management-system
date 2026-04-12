@echo off
echo ========================================
echo   First Pull Request Helper
echo ========================================
echo.

echo This script will help you create your first pull request!
echo.

:MENU
echo What would you like to do?
echo.
echo 1. Setup - Clone and configure repository
echo 2. Create new feature branch
echo 3. Commit and push changes
echo 4. Update existing PR
echo 5. Sync with original repository
echo 6. View helpful commands
echo 7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto SETUP
if "%choice%"=="2" goto NEW_BRANCH
if "%choice%"=="3" goto COMMIT_PUSH
if "%choice%"=="4" goto UPDATE_PR
if "%choice%"=="5" goto SYNC
if "%choice%"=="6" goto COMMANDS
if "%choice%"=="7" goto END

echo Invalid choice! Please try again.
echo.
goto MENU

:SETUP
echo.
echo ========================================
echo   SETUP: Clone and Configure
echo ========================================
echo.
echo First, make sure you've forked the repository on GitHub!
echo.
set /p username="Enter your GitHub username: "
echo.
echo Cloning your fork...
git clone https://github.com/%username%/school-management-system.git
cd school-management-system
echo.
set /p original="Enter original repository owner username: "
echo.
echo Adding upstream remote...
git remote add upstream https://github.com/%original%/school-management-system.git
echo.
echo ✓ Setup complete!
echo.
pause
goto MENU

:NEW_BRANCH
echo.
echo ========================================
echo   CREATE NEW FEATURE BRANCH
echo ========================================
echo.
echo First, let's update your main branch...
git checkout main
git pull upstream main
echo.
set /p branchname="Enter your feature branch name (e.g., add-dashboard): "
echo.
echo Creating branch: feature/%branchname%
git checkout -b feature/%branchname%
echo.
echo ✓ Branch created! You can now make your changes.
echo.
echo Next steps:
echo 1. Edit your files
echo 2. Come back and choose option 3 to commit and push
echo.
pause
goto MENU

:COMMIT_PUSH
echo.
echo ========================================
echo   COMMIT AND PUSH CHANGES
echo ========================================
echo.
echo Checking status...
git status
echo.
set /p confirm="Do you want to commit all changes? (y/n): "
if /i not "%confirm%"=="y" goto MENU
echo.
set /p message="Enter commit message (e.g., Add student dashboard): "
echo.
echo Staging changes...
git add .
echo.
echo Committing...
git commit -m "Add: %message%"
echo.
echo Pushing to your fork...
git branch --show-current > temp.txt
set /p current_branch=<temp.txt
del temp.txt
git push origin %current_branch%
echo.
echo ✓ Changes pushed!
echo.
echo Next step:
echo Go to GitHub and click "Compare & Pull Request"
echo URL: https://github.com/YOUR_USERNAME/school-management-system
echo.
pause
goto MENU

:UPDATE_PR
echo.
echo ========================================
echo   UPDATE EXISTING PR
echo ========================================
echo.
echo This will commit and push new changes to your current branch.
echo The PR will automatically update!
echo.
git status
echo.
set /p confirm="Commit and push updates? (y/n): "
if /i not "%confirm%"=="y" goto MENU
echo.
set /p message="Enter commit message (e.g., Fix review comments): "
echo.
git add .
git commit -m "Update: %message%"
git branch --show-current > temp.txt
set /p current_branch=<temp.txt
del temp.txt
git push origin %current_branch%
echo.
echo ✓ PR updated!
echo.
pause
goto MENU

:SYNC
echo.
echo ========================================
echo   SYNC WITH ORIGINAL REPOSITORY
echo ========================================
echo.
echo Switching to main branch...
git checkout main
echo.
echo Pulling latest changes from upstream...
git pull upstream main
echo.
echo Pushing to your fork...
git push origin main
echo.
echo ✓ Your fork is now up to date!
echo.
pause
goto MENU

:COMMANDS
echo.
echo ========================================
echo   HELPFUL GIT COMMANDS
echo ========================================
echo.
echo Check status:
echo   git status
echo.
echo View branches:
echo   git branch
echo.
echo Switch branch:
echo   git checkout branch-name
echo.
echo View commit history:
echo   git log --oneline
echo.
echo Undo changes to a file:
echo   git checkout -- filename
echo.
echo View remotes:
echo   git remote -v
echo.
echo Pull latest from upstream:
echo   git pull upstream main
echo.
echo Push to your fork:
echo   git push origin branch-name
echo.
pause
goto MENU

:END
echo.
echo ========================================
echo   Good luck with your pull request!
echo ========================================
echo.
echo Remember:
echo 1. Fork the repo on GitHub
echo 2. Clone your fork
echo 3. Create a feature branch
echo 4. Make changes
echo 5. Commit and push
echo 6. Create PR on GitHub
echo.
echo Need help? Check PULL_REQUEST_GUIDE.md
echo.
pause
exit
