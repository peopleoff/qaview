# QA Buddy - Docker Deployment Guide

This guide explains how to run QA Buddy in a Docker container for consistent deployment across different environments.

## Quick Start

### Option 1: Use the startup script (Recommended)

```bash
./docker-start.sh
```

### Option 2: Manual Docker Compose

```bash
# Build and start the application
docker-compose up --build -d

# Check if it's running
curl http://localhost:3000/api/health
```

## Access the Application

Once running, access QA Buddy at: **http://localhost:3000**

## Management Commands

### View Application Logs

```bash
docker-compose logs -f
```

### Stop the Application

```bash
docker-compose down
```

### Restart the Application

```bash
docker-compose restart
```

### Update the Application

```bash
# Pull latest changes and rebuild
git pull
docker-compose up --build -d
```

### Reset Everything (Clean Start)

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Rebuild and start fresh
docker-compose up --build -d
```

## Data Persistence

The application uses Docker volumes to persist:

- **Database**: SQLite database stored in `qa-buddy-data` volume
- **Uploads**: Email files, screenshots, and sendlogs stored in `qa-buddy-uploads` volume
- **Dictionaries**: Custom spell check dictionaries (mounted from host)

### Backup Data

```bash
# Backup database
docker run --rm -v qa-buddy-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/qa-buddy-database-backup.tar.gz /data

# Backup uploads
docker run --rm -v qa-buddy-uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/qa-buddy-uploads-backup.tar.gz /data
```

### Restore Data

```bash
# Restore database
docker run --rm -v qa-buddy-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/qa-buddy-database-backup.tar.gz -C /

# Restore uploads
docker run --rm -v qa-buddy-uploads:/data -v $(pwd):/backup alpine \
  tar xzf /backup/qa-buddy-uploads-backup.tar.gz -C /
```

## Environment Configuration

Create a `.env` file to customize settings:

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

Available options:

- `NODE_ENV`: Environment mode (production/development)
- `DB_FILE_NAME`: Database file path
- `PORT`: Application port (default: 3000)
- `HOST`: Host binding (default: 0.0.0.0)

## Troubleshooting

### Check Application Health

```bash
curl http://localhost:3000/api/health
```

### View Detailed Logs

```bash
docker-compose logs -f qa-buddy
```

### Check Container Status

```bash
docker-compose ps
```

### Access Container Shell

```bash
docker-compose exec qa-buddy sh
```

### Common Issues

**Port 3000 already in use:**

```bash
# Check what's using port 3000
lsof -i :3000

# Stop the conflicting service or change port in docker-compose.yml
```

**Database connection issues:**

```bash
# Reset database volume
docker-compose down -v
docker-compose up --build -d
```

**Playwright/Screenshot issues:**

```bash
# Rebuild with fresh dependencies
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Sharing with Team

### For Team Members

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd qa-buddy
   ```

2. **Start the application:**

   ```bash
   ./docker-start.sh
   ```

3. **Access QA Buddy:** http://localhost:3000

### For Production Deployment

1. **Set production environment:**

   ```bash
   echo "NODE_ENV=production" > .env
   echo "DB_FILE_NAME=/app/data/database.sqlite" >> .env
   ```

2. **Start with production settings:**

   ```bash
   docker-compose up --build -d
   ```

3. **Set up reverse proxy** (nginx/apache) if needed for custom domain

## System Requirements

- **Docker Desktop** or **Docker Engine** + **Docker Compose**
- **Minimum 2GB RAM** (4GB recommended)
- **1GB disk space** for application and data
- **Ports**: 3000 (configurable)

## Performance Considerations

- The container includes Chromium for screenshot generation
- Email analysis with large attachments may require additional memory
- Database grows with email history - consider periodic cleanup
- Screenshot files can accumulate - monitor disk usage

## Security Notes

- The application runs as non-root user inside container
- Database and uploads are isolated in Docker volumes
- No sensitive data is logged to console
- Health check endpoint provides minimal information
- Custom dictionaries are mounted read-only
