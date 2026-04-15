"""
Gunicorn configuration for Render (512MB memory limit)
"""
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:10000"

# Worker processes - limit for 512MB memory
# Formula: (512MB - OS overhead) / ~150MB per worker = ~2 workers max
workers = 1  # Reduced to 1 worker for 512MB RAM to prevent OOM
worker_class = "sync"  # Use sync workers (less memory than gevent/eventlet)
worker_connections = 1000
timeout = 60  # Reduced timeout since endpoints are now optimized
keepalive = 2

# Memory optimization
max_requests = 200  # Restart workers more frequently to prevent memory leaks
max_requests_jitter = 20  # Add randomness to prevent all workers restarting at once
preload_app = False  # Disable preload to reduce initial memory usage

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"
loglevel = "warning"  # Reduce log verbosity to save CPU/memory
capture_output = True
enable_stdio_inheritance = True

# Process naming
proc_name = "school_management"

# Server mechanics
daemon = False
pidfile = None

# SSL (handled by Render)
forwarded_allow_ips = "*"
secure_scheme_headers = {
    'X-FORWARDED-PROTOCOL': 'ssl',
    'X-FORWARDED-PROTO': 'https',
    'X-FORWARDED-SSL': 'on'
}

# Note: Memory limits disabled - Render handles OOM at container level
# With 1 worker and optimized code, we should stay under 512MB

def worker_int(worker):
    """Log when worker receives SIGINT or SIGQUIT"""
    worker.log.info("worker received INT or QUIT signal")

def on_starting(server):
    """Log when server starts"""
    server.log.info("Gunicorn starting with memory-optimized settings")
