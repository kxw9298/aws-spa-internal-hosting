#!/bin/sh

# Check if the APP_DIR variable is set
if [ -z "$APP_DIR" ]; then
    echo "APP_DIR variable is not set. Using default /app"
    APP_DIR="/app"
fi

# Echo the content of the APP_DIR
echo "Listing content of $APP_DIR:"
ls -al $APP_DIR

# Copy assets from EFS to Nginx directory
cp -r $APP_DIR/* /usr/share/nginx/html/

# Create the directory where SSL certificates will be stored
mkdir -p /etc/nginx/ssl

# Save the SSL_PRIVATE_KEY environment variable to a file
echo "$SSL_PRIVATE_KEY" > /etc/nginx/ssl/nginx.key

# Save the SSL_CERTIFICATE environment variable to a file
echo "$SSL_CERTIFICATE" > /etc/nginx/ssl/nginx.crt

# Adjust permissions of the SSL certificate and key
chmod 600 /etc/nginx/ssl/nginx.*

# Start Nginx
nginx -g 'daemon off;'
