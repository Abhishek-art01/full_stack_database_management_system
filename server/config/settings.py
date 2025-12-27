import os
import json
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

# ==========================================
# 1. ROBUST SECRET LOADING (MOVED TO TOP)
# ==========================================

# Calculate the path to the 'server' folder relative to this settings file
# settings.py is in: server/config/settings.py
SERVER_DIR = Path(__file__).resolve().parent.parent

# Point to: server/credintial/secrets.json
SECRETS_FILE = SERVER_DIR / '1credintial' / 'secrets.json'

try:
    with open(SECRETS_FILE) as f:
        secrets = json.loads(f.read())
except FileNotFoundError:
    raise ImproperlyConfigured(f"Secrets file not found at: {SECRETS_FILE}")
except json.JSONDecodeError:
    raise ImproperlyConfigured(f"Error decoding JSON in: {SECRETS_FILE}")

def get_secret(setting, secrets=secrets):
    try:
        return secrets[setting]
    except KeyError:
        raise ImproperlyConfigured(f"Set the {setting} variable in secrets.json")


# ==========================================
# 2. DJANGO SETTINGS
# ==========================================

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_secret('SECRET_KEY')  # Use the helper function

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'tracker',
    'rangefilter',
    'storages',  # Ensure 'storages' is added for Supabase/S3
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# ==========================================
# 3. DATABASE CONFIGURATION
# ==========================================
DATABASES = {
    'default': {
        'ENGINE': secrets.get('DB_ENGINE', 'django.db.backends.sqlite3'), # Fallback to sqlite if missing
        'NAME': secrets.get('DB_NAME', BASE_DIR / 'db.sqlite3'),
        'USER': secrets.get('DB_USER'),
        'PASSWORD': secrets.get('DB_PASSWORD'),
        'HOST': secrets.get('DB_HOST'),
        'PORT': secrets.get('DB_PORT'),
    }
}


# ==========================================
# 4. PASSWORD VALIDATION & I18N
# ==========================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# ==========================================
# 5. STATIC & MEDIA FILES (SUPABASE CONFIG)
# ==========================================

STATIC_URL = 'static/'

# This allows Django to seamlessly upload files to Supabase
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "access_key": get_secret("SUPABASE_ACCESS_KEY_ID"),
            "secret_key": get_secret("SUPABASE_SECRET_ACCESS_KEY"),
            "bucket_name": get_secret("SUPABASE_BUCKET_NAME"),
            "endpoint_url": get_secret("SUPABASE_ENDPOINT_URL"),
            "region_name": "us-east-1",
            "default_acl": "public-read",
            "querystring_auth": False,
            "object_parameters": {
                "CacheControl": "max-age=86400",
            },
        },
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}


# ==========================================
# 6. CORS SETTINGS
# ==========================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]