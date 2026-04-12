@echo off
echo Installing Python packages for School Management System...
echo.

REM Core Django packages
venv\Scripts\pip.exe install Django==5.2
venv\Scripts\pip.exe install djangorestframework==3.16.0
venv\Scripts\pip.exe install django-cors-headers==4.7.0
venv\Scripts\pip.exe install djangorestframework-simplejwt==5.2.2

REM Database
venv\Scripts\pip.exe install psycopg2-binary

REM Channels for WebSocket
venv\Scripts\pip.exe install channels==4.2.2
venv\Scripts\pip.exe install channels-redis==4.3.0
venv\Scripts\pip.exe install daphne==4.2.1
venv\Scripts\pip.exe install redis==6.2.0
venv\Scripts\pip.exe install msgpack

REM Utilities
venv\Scripts\pip.exe install python-decouple==3.8
venv\Scripts\pip.exe install Pillow
venv\Scripts\pip.exe install openpyxl
venv\Scripts\pip.exe install pandas
venv\Scripts\pip.exe install reportlab
venv\Scripts\pip.exe install django-filter
venv\Scripts\pip.exe install requests==2.31.0
venv\Scripts\pip.exe install python-dateutil==2.8.2
venv\Scripts\pip.exe install pytz
venv\Scripts\pip.exe install PyYAML==6.0.2

REM Additional Django packages
venv\Scripts\pip.exe install django-extensions
venv\Scripts\pip.exe install whitenoise
venv\Scripts\pip.exe install drf-spectacular

REM Other utilities
venv\Scripts\pip.exe install beautifulsoup4
venv\Scripts\pip.exe install lxml
venv\Scripts\pip.exe install xlrd
venv\Scripts\pip.exe install XlsxWriter
venv\Scripts\pip.exe install xlwt

echo.
echo Installation complete!
echo You can now run: python manage.py runserver
pause
