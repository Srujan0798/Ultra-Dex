#!/bin/bash
# Copyright (c) 2026 Ultra-Dex
#
# Enterprise Deployment Script
# Automates deployment of Ultra-Dex enterprise services
#
# Usage: ./deploy-enterprise.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION="6.0.0"
DOCKER_REGISTRY="registry.ultra-dex.io"
NAMESPACE="ultra-dex"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build core API
    docker build -t $DOCKER_REGISTRY/ultra-dex-core-api:$VERSION -f apps/core-api/Dockerfile .
    docker tag $DOCKER_REGISTRY/ultra-dex-core-api:$VERSION $DOCKER_REGISTRY/ultra-dex-core-api:latest
    
    # Build dashboard
    docker build -t $DOCKER_REGISTRY/ultra-dex-dashboard:$VERSION -f apps/dashboard/Dockerfile .
    docker tag $DOCKER_REGISTRY/ultra-dex-dashboard:$VERSION $DOCKER_REGISTRY/ultra-dex-dashboard:latest
    
    log_success "Docker images built"
}

# Push Docker images
push_images() {
    log_info "Pushing Docker images..."
    
    docker push $DOCKER_REGISTRY/ultra-dex-core-api:$VERSION
    docker push $DOCKER_REGISTRY/ultra-dex-core-api:latest
    docker push $DOCKER_REGISTRY/ultra-dex-dashboard:$VERSION
    docker push $DOCKER_REGISTRY/ultra-dex-dashboard:latest
    
    log_success "Docker images pushed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if database is accessible
    if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER &> /dev/null; then
        log_error "Database is not accessible"
        exit 1
    fi
    
    # Run enterprise schema migration
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f src/core/database/migrations/001-enterprise-schema.sql
    
    log_success "Database migrations completed"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes ($ENVIRONMENT)..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configurations
    kubectl apply -f config/k8s/configmap-$ENVIRONMENT.yaml -n $NAMESPACE
    kubectl apply -f config/k8s/secrets-$ENVIRONMENT.yaml -n $NAMESPACE
    kubectl apply -f config/k8s/deployment-enterprise.yaml -n $NAMESPACE
    kubectl apply -f config/k8s/service-enterprise.yaml -n $NAMESPACE
    kubectl apply -f config/k8s/ingress-enterprise.yaml -n $NAMESPACE
    
    # Wait for deployment
    kubectl rollout status deployment/ultra-dex-enterprise -n $NAMESPACE --timeout=300s
    
    log_success "Kubernetes deployment completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pod status
    kubectl get pods -n $NAMESPACE -l app=ultra-dex-enterprise
    
    # Check service endpoints
    kubectl get svc -n $NAMESPACE
    
    # Health check
    ENDPOINT=$(kubectl get svc ultra-dex-enterprise -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ ! -z "$ENDPOINT" ]; then
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$ENDPOINT:8866/health)
        if [ "$HEALTH_STATUS" == "200" ]; then
            log_success "Health check passed"
        else
            log_error "Health check failed with status $HEALTH_STATUS"
            exit 1
        fi
    fi
    
    log_success "Deployment verification completed"
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Test enterprise services
    npm run test:enterprise -- --testNamePattern="Smoke"
    
    log_success "Smoke tests passed"
}

# Main deployment function
main() {
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}Ultra-Dex Enterprise Deployment${NC}"
    echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
    echo -e "${GREEN}Version: $VERSION${NC}"
    echo -e "${GREEN}================================${NC}"
    echo
    
    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        export $(cat .env.$ENVIRONMENT | xargs)
    fi
    
    check_prerequisites
    build_images
    push_images
    run_migrations
    deploy_kubernetes
    verify_deployment
    run_smoke_tests
    
    echo
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}Deployment Successful!${NC}"
    echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
    echo -e "${GREEN}Version: $VERSION${NC}"
    echo -e "${GREEN}================================${NC}"
}

# Execute main function
main
