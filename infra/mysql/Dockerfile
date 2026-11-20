# MySQL for the Render private service (see render.yaml).
# Render mounts the persistent disk at /var/lib/mysql; a fresh ext4 disk
# contains lost+found, which MySQL refuses to initialise over, so the data
# lives in a subdirectory of the disk.
FROM mysql:8.0

CMD ["mysqld", "--datadir=/var/lib/mysql/data", "--default-authentication-plugin=mysql_native_password"]
