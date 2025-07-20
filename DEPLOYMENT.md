# Production Deployment Guide

## Prerequisites

1. **SSL Certificate**: Obtain a valid SSL certificate for HTTPS
2. **Domain**: Configure your domain to point to your server
3. **Dependencies**: Install all required Python packages

## Environment Variables

Set these environment variables for production:

```bash
export FLASK_ENV=production
export SECRET_KEY="your-secret-key-here"
export SSL_CERT_PATH="/path/to/your/cert.pem"
export SSL_KEY_PATH="/path/to/your/private-key.pem"
export HOST="0.0.0.0"
export PORT="443"
```

## Quick Setup with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Set certificate paths
export SSL_CERT_PATH="/etc/letsencrypt/live/yourdomain.com/fullchain.pem"
export SSL_KEY_PATH="/etc/letsencrypt/live/yourdomain.com/privkey.pem"
```

## Production Deployment Options

### Option 1: Direct Flask (Development/Testing)
```bash
FLASK_ENV=production python app.py
```

### Option 2: Gunicorn + Nginx (Recommended)
```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# Configure nginx to proxy to gunicorn with SSL termination
```

## Security Checklist

- ✅ Debug mode disabled
- ✅ CSRF protection enabled
- ✅ Rate limiting configured
- ✅ Security headers added
- ✅ Input validation implemented
- ✅ HTML sanitization added
- ✅ File path validation secured
- ✅ HTTPS configured
- ✅ Session security enabled

## Monitoring

The application includes basic logging. For production, consider:
- Setting up log rotation
- Using a centralized logging system
- Monitoring for security events
- Setting up health checks

## Firewall Configuration

```bash
# Allow HTTPS traffic
sudo ufw allow 443/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```