# Use the Nginx image from Docker Hub as the base image
FROM nginx

# Set the working directory inside the container
WORKDIR /usr/share/nginx/html

# Copy all files and directories from the 'app/' directory to the working directory in the container
COPY app/ .

# (Optional) Specifically list the JavaScript files to ensure they are copied
RUN echo "Listing JavaScript files:" && ls -la *.js

# (Optional) You could also list all contents to verify everything got copied correctly
RUN echo "Listing all files:" && ls -la

# Expose port 80 to allow external access to the Nginx server
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]


# # Use the Nginx image from Docker Hub as the base image
# FROM nginx

# # Remove default Nginx content
# RUN rm -rf /usr/share/nginx/html/*

# # Copy the start script
# COPY start.sh /start.sh
# RUN chmod +x /start.sh

# CMD ["/start.sh"]
