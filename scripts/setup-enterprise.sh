#!/bin/bash
# Copyright (c) 2026 Ultra-Dex
#
# Comprehensive Setup Script for Ultra-Dex Enterprise
# This script automates the complete setup process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║         Ultra-Dex Enterprise Setup Script                  ║${NC}"
echo -e "${BLUE}║         Version 6.0.0 - Production Ready                 ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm -v) found"
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Please install PostgreSQL 14+"
    else
        print_success "PostgreSQL found"
    fi
    
    # Check Redis
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis client not found. Please install Redis 7+"
    else
        print_success "Redis found"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git found"
    
    print_success "All prerequisites checked"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
            print_warning "Please edit .env with your configuration"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_warning ".env already exists, skipping"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    npm ci
    
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        if [ -f ".env" ]; then
            export $(cat .env | grep DATABASE_URL | xargs)
        fi
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not set, skipping database setup"
        return
    fi
    
    # Run migrations
    print_status "Running database migrations..."
    npm run migrate
    
    # Seed initial data
    print_status "Seeding database..."
    npm run seed
    
    print_success "Database setup complete"
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ ! -d "certs" ]; then
        mkdir -p certs
    fi
    
    if [ ! -f "certs/server.key" ]; then
        print_status "Generating self-signed SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout certs/server.key \
            -out certs/server.crt \
            -subj "/C=US/ST=State/L=City/O=Ultra-Dex/CN=localhost"
        print_success "SSL certificates generated"
    else
        print_warning "SSL certificates already exist"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backups
    mkdir -p tmp
    mkdir -p data
    
    print_success "Directories created"
}

# Build application
build_application() {
    print_status "Building application..."
    
    npm run build
    
    print_success "Application built successfully"
}

# Setup systemd service (Linux)
setup_systemd() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_status "Setting up systemd service..."
        
        sudo tee /etc/systemd/system/ultra-dex.service > /dev/null <<EOF
[Unit]
Description=Ultra-Dex Enterprise
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which npm) run start:enterprise
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        print_success "Systemd service created"
        print_status "Start with: sudo systemctl start ultra-dex"
        print_status "Enable on boot: sudo systemctl enable ultra-dex"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    npm test
    
    print_success "Tests completed"
}

# Print final instructions
print_instructions() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  Setup Complete!                           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Edit .env file with your configuration"
    echo "2. Ensure PostgreSQL and Redis are running"
    echo "3. Run: npm run start:enterprise"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  npm run start:enterprise  - Start enterprise services"
    echo "  npm run dev               - Start development mode"
    echo "  npm test                  - Run tests"
    echo "  npm run migrate           - Run database migrations"
    echo
    echo -e "${BLUE}Documentation:${NC}"
    echo "  https://docs.ultra-dex.io"
    echo
    echo -e "${BLUE}Support:${NC}"
    echo "  Email: support@ultra-dex.io"
    echo
}

# Main setup function
main() {
    check_prerequisites
    setup_environment
    install_dependencies
    create_directories
    setup_ssl
    setup_database
    build_application
    
    if [[ "$1" == "--with-tests" ]]; then
        run_tests
    fi
    
    if [[ "$1" == "--systemd" ]]; then
        setup_systemd
    fi
    
    print_instructions
}

# Run main function
main "$@"
