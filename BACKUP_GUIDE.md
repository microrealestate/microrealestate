# Database Backup Guide

This guide explains how to back up the MongoDB database for the Micro Real Estate application.

## Prerequisites

- Docker and Docker Compose must be installed and running
- The application containers should be running (specifically the `mongo` service)
- You should be in the project root directory (`/srv/microrealestate`)

## Quick Backup

Run the following command from the project root:

```bash
docker compose run --rm mongo /usr/bin/mongodump --uri=mongodb://mongo/mredb --gzip --archive=./backup/mredb-$(date +%F_%H-%M-%S).dump
```

This will:
1. Create a timestamped backup file in the `backup` folder
2. Compress the backup using gzip
3. Name the file with format: `mredb-YYYY-MM-DD_HH-MM-SS.dump`

## Backup with Verification

To create a backup and verify it exists on the host filesystem:

```bash
cd /srv/microrealestate
backup_file="backup/mredb-$(date +%F_%H-%M-%S).dump"
docker compose run --rm mongo /usr/bin/mongodump --uri=mongodb://mongo/mredb --gzip --archive="./${backup_file}"
ls -lh "./${backup_file}"
```

## Backup Location

Backup files are stored in:
- **Path**: `./backup/` (project root)
- **Example**: `backup/mredb-2026-03-31_20-13-26.dump`

## Database Name

The default database name is `mredb`. If your database has a different name:
1. Check your `.env` file for the database configuration
2. Replace `mredb` in the commands above with your actual database name

## Restore from Backup

To restore a database from a backup:

```bash
docker compose run --rm mongo /usr/bin/mongorestore --uri=mongodb://mongo/mredb --drop --gzip --archive=./backup/mredb-YYYY-MM-DD_HH-MM-SS.dump
```

Replace `mredb-YYYY-MM-DD_HH-MM-SS.dump` with the name of your backup file.

**Warning**: The `--drop` flag will remove the existing database before restoring, so use with caution.

## Tips

- **Regular backups**: Create backups before major updates or changes
- **Verify backups**: Check the backup folder to ensure files are created with non-zero size
- **Backup archive**: Keep copies of important backups in external storage
- **File naming**: Files include timestamps for easy identification and sorting
- **Compression**: All backups are automatically gzipped to save space

## Troubleshooting

- **"mongo" service not running**: Start the application with `docker compose up` first
- **Permission denied**: Ensure you have permission to write to the `backup` folder
- **Database connection errors**: Verify MongoDB container is healthy and accessible
