# Use the official NGINX base image
FROM nginx:alpine

# Copy your custom nginx.conf to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Copy your SSL certificates
COPY ssl/default.crt /etc/nginx/ssl/default.crt
COPY ssl/default.key /etc/nginx/ssl/default.key

# Expose ports
EXPOSE 80 443

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
