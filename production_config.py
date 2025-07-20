# Production configuration for Classic Traveller Character Generator

import os

class Config:
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # HTTPS/SSL settings
    SSL_CERT_PATH = os.environ.get('SSL_CERT_PATH', '/path/to/cert.pem')
    SSL_KEY_PATH = os.environ.get('SSL_KEY_PATH', '/path/to/key.pem')
    
    # Server settings
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 443))
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'memory://')
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', '/var/log/traveller-gen.log')

class DevelopmentConfig(Config):
    HOST = '0.0.0.0'
    PORT = 5000
    LOG_LEVEL = 'DEBUG'

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        return Config()
    return DevelopmentConfig()