# syntax=docker/dockerfile:1

##
# SIMONIK V2 — production image for Dokploy (Docker build).
# Stack: Laravel 13 (PHP 8.4) + Inertia + React 19 + Vite + MySQL.
#
# Multi-stage:
#   1) vendor  — install PHP dependencies (composer, no-dev)
#   2) assets  — build frontend (Vite). Needs PHP because the Wayfinder
#                Vite plugin runs `php artisan wayfinder:generate` at build.
#   3) runtime — serversideup/php (nginx + php-fpm + s6) that serves the app.
##

# ---------------------------------------------------------------------------
# Stage 1 — PHP dependencies
# ---------------------------------------------------------------------------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader \
    --ignore-platform-reqs

# ---------------------------------------------------------------------------
# Stage 2 — Frontend assets (Vite build)
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS assets
WORKDIR /app

# PHP CLI is required so the Wayfinder Vite plugin can run `php artisan`.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        php-cli php-mbstring php-xml php-tokenizer php-curl php-sqlite3 unzip \
    && rm -rf /var/lib/apt/lists/*

# Vendor first (Laravel must boot for wayfinder:generate).
COPY --from=vendor /app/vendor ./vendor
COPY . .

RUN npm ci
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 — Runtime (nginx + php-fpm)
# ---------------------------------------------------------------------------
FROM serversideup/php:8.4-fpm-nginx AS runtime

# serversideup runs as the unprivileged `www-data` user and serves
# /var/www/html/public on port 8080.
USER root

# Extra PHP extensions used by the app (MySQL, GD for image handling).
RUN install-php-extensions pdo_mysql gd bcmath

WORKDIR /var/www/html

# Application source + built dependencies.
COPY --chown=www-data:www-data . .
COPY --chown=www-data:www-data --from=vendor /app/vendor ./vendor
COPY --chown=www-data:www-data --from=assets /app/public/build ./public/build

# Let serversideup auto-run Laravel optimizations + migrations on boot.
# (These can be overridden per-service in the Dokploy environment tab.)
ENV PHP_OPCACHE_ENABLE=1 \
    AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_STORAGE_LINK=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    AUTORUN_LARAVEL_CONFIG_CACHE=true \
    AUTORUN_LARAVEL_ROUTE_CACHE=true \
    AUTORUN_LARAVEL_VIEW_CACHE=true \
    AUTORUN_LARAVEL_EVENT_CACHE=true

USER www-data

EXPOSE 8080
