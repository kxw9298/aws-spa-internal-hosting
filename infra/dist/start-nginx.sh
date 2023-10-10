#!/bin/sh

# Fetch SPA assets from S3
aws s3 sync s3://mys3stack-mybucketf68f3ff0-zne2gggzj53o/app /usr/share/nginx/html

# Start Nginx
nginx -g "daemon off;"
