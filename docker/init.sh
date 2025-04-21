#!/bin/sh
chmod 644 /etc/mysql/my.cnf
exec docker-entrypoint.sh "$@"