# Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /code

# Install dependencies
COPY requirements.txt /code/
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /code/

# Run migrations and start the server
# Render uses the $PORT environment variable
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "mald_sms.wsgi:application"]
