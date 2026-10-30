#!/bin/sh
set -e

# Map dynamic PORT from Vercel / Cloud Run / Railway to NGINX_HTTP_PORT
if [ -n "$PORT" ]; then
    export NGINX_HTTP_PORT="$PORT"
fi

# Ensure storage and bootstrap directories exist with proper permissions for www-data
mkdir -p /var/www/html/storage/logs \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/bootstrap/cache
touch /var/www/html/storage/logs/laravel.log
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

rm -f /etc/nginx/site-opts.d/http.conf /etc/nginx/site-opts.d/https.conf /etc/nginx/nginx.conf 2>/dev/null || true

# Ensure public/storage symlink exists
php /var/www/html/artisan storage:link --force 2>/dev/null || true

exec /usr/local/bin/docker-php-serversideup-entrypoint "$@"
