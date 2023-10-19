FROM nginx

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
