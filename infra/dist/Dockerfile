# Use the Nginx image from Docker Hub as the base image
FROM nginx

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Custom Nginx configuration that uses SSL certificates
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["/start.sh"]

