# Dockerfile
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/code:/code/api

# Set work directory
WORKDIR /code

# Install dependencies
COPY requirements.txt /code/
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /code/

# Make startup script executable
RUN chmod +x /code/docker-start.sh

# Run startup script
CMD ["/code/docker-start.sh"]
