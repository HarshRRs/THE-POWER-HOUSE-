#!/bin/bash
echo '--- NGINX MOUNTS ---'
docker inspect rdv_nginx --format '{{json .Mounts}}'

echo '--- POSTGRES ENV ---'
docker exec rdv_postgres env | grep POSTGRES_USER

echo '--- GET ADMIN DB ---'
docker exec rdv_postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT email, role, password FROM \"User\" WHERE role='\''ADMIN'\'' LIMIT 2;"' 2>/dev/null
if [ $? -ne 0 ]; then
  echo 'Trying postgres user'
  docker exec rdv_postgres psql -U postgres -d postgres -t -c "SELECT email, role, password FROM \"User\" WHERE role='ADMIN' LIMIT 2;" 2>/dev/null
fi
