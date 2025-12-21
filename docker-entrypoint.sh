#!/bin/sh
set -e

echo "Running database migrations..."
bunx prisma migrate deploy

echo "Starting application..."
exec "$@"
