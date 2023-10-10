# Use the official Nginx image as a base
FROM nginx:alpine

# Install required dependencies and AWS CLI
RUN apk --no-cache add curl unzip && \
    curl "https://d1vvhvl2y92vvt.cloudfront.net/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy a startup script
COPY start-nginx.sh /start-nginx.sh

# Give execution permissions
RUN chmod +x /start-nginx.sh

# Start Nginx via the custom script
CMD ["/start-nginx.sh"]
