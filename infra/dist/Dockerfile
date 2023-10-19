# Use the Nginx image from Docker Hub as the base image
FROM nginx

RUN ls -la app/

# Set the working directory inside the container
WORKDIR /usr/share/nginx/html

# Copy all files and directories from the 'app/' directory to the working directory in the container
COPY app/ .

# List all contents of the current directory to verify what is being copied
RUN ls -la

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
