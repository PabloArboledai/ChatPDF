# Deployment Guide - ChatPDF to civer.online

## Prerequisites

Before deploying to production (civer.online), ensure you have:

1. ✅ A VPS with Docker and Docker Compose installed
2. ✅ Domain (civer.online) DNS configured to point to VPS IP
3. ✅ Ports 80 and 443 open on the VPS firewall
4. ✅ SSH access to the VPS

## Quick Deployment Steps

### 1. Connect to Your VPS

```bash
ssh user@your-vps-ip
```

### 2. Clone or Update Repository

```bash
# If first time
git clone https://github.com/PabloArboledai/ChatPDF.git
cd ChatPDF

# If updating
cd ChatPDF
git pull origin copilot/vscode-mjwwofkj-u6qx
```

### 3. Configure Environment

```bash
cd deploy
cp .env.prod.example .env.prod
nano .env.prod
```

Edit the following variables:
```env
DOMAIN=civer.online
ACME_EMAIL=your-email@example.com
POSTGRES_PASSWORD=your-secure-password-here
```

### 4. Deploy the Stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

This will:
- Build all services (web, api, worker, postgres, redis)
- Set up Caddy for automatic HTTPS with Let's Encrypt
- Start all services in detached mode

### 5. Verify Deployment

Check that all services are running:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Check logs for any issues:
```bash
# All services
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f

# Specific service
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f web
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f caddy
```

### 6. Test the Application

Open your browser and navigate to:
- Main site: https://civer.online
- Create a job and verify it processes correctly
- Check auto-refresh functionality works

## UX Features Deployed

The following UX improvements are now live:

### ✅ Auto-Refresh
- Job detail pages refresh every 3 seconds when processing
- Jobs list refreshes every 5 seconds to show updates
- No more manual page refreshes needed

### ✅ Visual Feedback
- Drag-and-drop file upload with visual states
- Loading spinners during operations
- Success celebration animations
- Toast notifications for actions
- Color-coded job status badges

### ✅ Better Navigation
- Sticky header with smooth transitions
- Clear breadcrumbs and navigation
- Improved button states with icons
- Helpful tooltips on form fields

### ✅ Enhanced Forms
- File size display after selection
- Field validation with clear error messages
- Help text for complex fields
- Disabled states when appropriate

## Monitoring

### Check Service Health

```bash
# API health endpoint
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api curl http://localhost:8000/health

# Web service (should respond on port 3000)
docker compose -f docker-compose.prod.yml --env-file .env.prod exec web curl http://localhost:3000

# Check Caddy is serving properly
curl -I https://civer.online
```

### View Logs

```bash
# Tail logs from all services
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f --tail=100

# Specific service logs
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f web
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f api
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f worker
```

## Updating the Application

When you have new changes to deploy:

```bash
# Pull latest changes
git pull origin copilot/vscode-mjwwofkj-u6qx

# Rebuild and restart services
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build

# Or restart a specific service
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build web
```

## Troubleshooting

### SSL Certificate Issues

If HTTPS isn't working:

1. Ensure DNS is pointing to your VPS IP:
   ```bash
   nslookup civer.online
   ```

2. Check Caddy logs:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs caddy
   ```

3. Verify ports are open:
   ```bash
   sudo ufw status
   sudo netstat -tulpn | grep -E ':(80|443)'
   ```

### Service Not Starting

1. Check Docker logs:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs service-name
   ```

2. Verify environment variables:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod config
   ```

3. Check disk space:
   ```bash
   df -h
   ```

### Jobs Not Processing

1. Check worker logs:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs -f worker
   ```

2. Verify Redis is running:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec redis redis-cli ping
   ```

3. Check database connection:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec api python -c "from app.db import engine; print(engine.url)"
   ```

## Performance Optimization

### Enable ML Worker (Optional)

For clustering functionality, enable the ML worker:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod --profile ml up -d --build
```

Note: This requires more resources (CPU and RAM).

### Database Backups

Set up regular PostgreSQL backups:

```bash
# Manual backup
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec postgres pg_dump -U chatpdf chatpdf > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec -T postgres psql -U chatpdf chatpdf < backup_20240102.sql
```

## Security Considerations

1. ✅ Use strong passwords for POSTGRES_PASSWORD
2. ✅ Keep secrets out of version control
3. ✅ Regularly update Docker images
4. ✅ Monitor logs for suspicious activity
5. ✅ Set up firewall rules (UFW or cloud provider firewall)
6. ✅ Enable automatic security updates on the VPS

## Support

If you encounter issues:

1. Check the logs (see Monitoring section above)
2. Review the [PRODUCTION.md](PRODUCTION.md) guide
3. Verify all environment variables are set correctly
4. Ensure DNS and firewall are configured properly

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerting
3. ✅ Configure regular backups
4. ✅ Document any custom configurations
5. ✅ Train users on new UX features

---

**Deployment Status**: Ready for production ✅
**Last Updated**: 2026-01-02
**Current Version**: With comprehensive UX improvements
