FROM nginx

# Copy the SPA angular static assets to Nginx's default directory
COPY app/ /usr/share/nginx/html

# Run ls command to list the contents of the directory
RUN ls -la /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


# # Remove default Nginx content
# RUN rm -rf /usr/share/nginx/html/*

# # Copy the start script
# COPY start.sh /start.sh
# RUN chmod +x /start.sh

# CMD ["/start.sh"]
