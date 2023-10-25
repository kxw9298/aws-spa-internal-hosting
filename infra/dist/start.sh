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

# Start Nginx
nginx -g 'daemon off;'
