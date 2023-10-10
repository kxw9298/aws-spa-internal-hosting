# Use Nginx as base image
FROM nginx:alpine

# Copy the SPA angular static assets to Nginx's default directory
COPY app/ /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
