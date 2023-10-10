# Use the official image as a parent image
FROM nginx:latest

# Set the maintainer label
LABEL maintainer="your-email@example.com"

# Set the working directory inside the container
WORKDIR /usr/share/nginx/html

# Copy the content of the local src directory to the working directory
COPY . .

# Expose port 80
EXPOSE 80

# Specify the command to run on container start
CMD ["nginx", "-g", "daemon off;"]
