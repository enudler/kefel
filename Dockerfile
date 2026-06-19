# Kefel — static multiplication game served by nginx.
FROM nginx:1.27-alpine

# Drop the default site, add ours.
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css game.js /usr/share/nginx/html/

EXPOSE 80

# Lightweight container healthcheck.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
