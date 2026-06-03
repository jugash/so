#!/bin/bash
# MetalStack Seeding Utility Script

set -e

echo "===================================================="
echo "          MetalStack Seed Data Bootstrapper          "
echo "===================================================="

# Check if postgres container is running
if ! podman ps | grep -q "metalstack-postgres"; then
  echo "Error: The 'metalstack-postgres' container is not running!"
  echo "Please start the infrastructure first using: podman compose up -d"
  exit 1
fi

echo "Waiting for Postgres to be fully ready..."
until podman exec metalstack-postgres pg_isready -U metalstack -d metalstack >/dev/null 2>&1; do
  echo "Postgres is starting up... waiting..."
  sleep 2
done

# Check if Flyway has initialized the tables yet by checking for the users table
echo "Checking if database tables have been initialized by the backend..."
TABLE_EXISTS=$(podman exec -i metalstack-postgres psql -U metalstack -d metalstack -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');" | xargs)

if [ "$TABLE_EXISTS" != "t" ]; then
  echo "Warning: The 'users' table does not exist yet."
  echo "This means the Spring Boot backend has not started or has not run Flyway migrations yet."
  echo "Please start the Spring Boot backend (using ./gradlew bootRun in backend directory) first."
  echo "Once the backend has successfully started and created the tables, re-run this script."
  exit 1
fi

echo "Applying seed data from seed.sql..."
podman exec -i metalstack-postgres psql -U metalstack -d metalstack < seed.sql

echo "===================================================="
echo "  Success: MetalStack database seeded successfully! "
echo "===================================================="
echo "Seed users available:"
echo "  - admin     (Password: admin, Role: ADMIN)"
echo "  - moderator (Password: moderator, Role: MODERATOR)"
echo "  - user1     (Password: user1, Role: USER)"
echo "  - user2     (Password: user2, Role: USER)"
echo "===================================================="
