# Use Nginx as base image
FROM nginx:alpine

# Copy the SPA angular static assets to Nginx's default directory
COPY app/ /usr/share/nginx/html

RUN ls /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# # Use the Nginx image from Docker Hub as the base image
# FROM nginx

# # Remove default Nginx content
# RUN rm -rf /usr/share/nginx/html/*

# # Copy the start script
# COPY start.sh /start.sh
# RUN chmod +x /start.sh

# CMD ["/start.sh"]
