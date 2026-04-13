"""
Gunicorn configuration for Render (512MB memory limit)
"""
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:10000"

# Worker processes - limit for 512MB memory
# Formula: (512MB - OS overhead) / ~150MB per worker = ~2-3 workers
workers = 2  # Fixed at 2 for 512MB RAM
worker_class = "sync"  # Use sync workers (less memory than gevent/eventlet)
worker_connections = 1000
timeout = 120
keepalive = 2

# Memory optimization
max_requests = 500  # Restart workers after 500 requests to prevent memory leaks
max_requests_jitter = 50  # Add randomness to prevent all workers restarting at once
preload_app = True  # Preload application to save memory

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

# Memory limit for workers (optional, Linux only)
# This will kill workers that use too much memory
if os.name != 'nt':  # Not Windows
    import resource
    # Try to set a soft memory limit per worker (~200MB)
    try:
        soft, hard = resource.getrlimit(resource.RLIMIT_AS)
        resource.setrlimit(resource.RLIMIT_AS, (209715200, hard))  # 200MB soft limit
    except (ValueError, OSError):
        pass  # Ignore if not supported

def worker_int(worker):
    """Log when worker receives SIGINT or SIGQUIT"""
    worker.log.info("worker received INT or QUIT signal")

def on_starting(server):
    """Log when server starts"""
    server.log.info("Gunicorn starting with memory-optimized settings")
