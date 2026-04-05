#!/bin/bash

# Ultra-Dex Deployment Script
# Automates deployment to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
REGISTRY=${3:-docker.io}
IMAGE_NAME="ultra-dex"
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${VERSION}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        log_warn ".env file not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warn "Please edit .env file with your configuration"
        else
            log_error ".env.example not found. Cannot create environment file."
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_info "Building Docker image ${FULL_IMAGE_NAME}..."
    
    docker build \
        --target production \
        -t "${FULL_IMAGE_NAME}" \
        -t "${REGISTRY}/${IMAGE_NAME}:latest" \
        .
    
    log_success "Docker image built successfully"
}

# Run tests
run_tests() {
    log_info "Running validation tests..."
    
    # Unit tests
    if [ -f "test-validation.cjs" ]; then
        node test-validation.cjs
        if [ $? -ne 0 ]; then
            log_error "Unit tests failed"
            exit 1
        fi
    fi
    
    # Integration tests
    if [ -f "tests/integration/core-integration.test.cjs" ]; then
        node tests/integration/core-integration.test.cjs
        if [ $? -ne 0 ]; then
            log_error "Integration tests failed"
            exit 1
        fi
    fi
    
    log_success "All tests passed"
}

# Push to registry
push_image() {
    log_info "Pushing image to registry..."
    
    docker push "${FULL_IMAGE_NAME}"
    docker push "${REGISTRY}/${IMAGE_NAME}:latest"
    
    log_success "Image pushed to registry"
}

# Deploy locally with Docker Compose
deploy_local() {
    log_info "Deploying locally with Docker Compose..."
    
    # Pull latest images
    docker-compose pull
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Ultra-Dex is running at http://localhost:3000"
    else
        log_warn "Health check failed. Check logs with: docker-compose logs"
    fi
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Apply configurations
    kubectl apply -f config/k8s/
    
    # Wait for deployment
    kubectl rollout status deployment/ultra-dex
    
    log_success "Deployed to Kubernetes"
}

# Create environment file template
create_env_template() {
    log_info "Creating .env.example template..."
    
    cat > .env.example << EOF
# Ultra-Dex Configuration
NODE_ENV=production
PORT=3000
ULTRA_DEX_DATA_PATH=./data
ULTRA_DEX_LOG_LEVEL=info

# AI Provider API Keys
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
GROQ_API_KEY=your_groq_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ultra_dex

# Neo4j
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Security
JWT_SECRET=your_jwt_secret_here_change_in_production

# Monitoring
GRAFANA_PASSWORD=admin
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Budget Control (optional)
DAILY_BUDGET=50.00
EOF

    log_success ".env.example created"
}

# Backup data
backup_data() {
    log_info "Creating backup..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "${BACKUP_DIR}"
    
    # Backup data directory
    if [ -d "./data" ]; then
        tar -czf "${BACKUP_DIR}/data.tar.gz" ./data
    fi
    
    # Backup configuration
    if [ -f ".env" ]; then
        cp .env "${BACKUP_DIR}/env.backup"
    fi
    
    log_success "Backup created at ${BACKUP_DIR}"
}

# Rollback deployment
rollback() {
    log_info "Rolling back deployment..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
        docker-compose up -d
    fi
    
    log_success "Rollback complete"
}

# Main deployment logic
main() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║     Ultra-Dex Deployment Script        ║"
    echo "║              Version 6.0.0             ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Version: ${VERSION}"
    log_info "Registry: ${REGISTRY}"
    echo ""
    
    case "${ENVIRONMENT}" in
        local)
            check_prerequisites
            create_env_template
            run_tests
            build_image
            deploy_local
            ;;
        staging)
            check_prerequisites
            run_tests
            build_image
            push_image
            deploy_kubernetes
            ;;
        production)
            check_prerequisites
            backup_data
            run_tests
            build_image
            push_image
            deploy_kubernetes
            ;;
        test)
            check_prerequisites
            run_tests
            log_success "All tests passed!"
            ;;
        rollback)
            rollback
            ;;
        *)
            echo "Usage: $0 {local|staging|production|test|rollback} [version] [registry]"
            echo ""
            echo "Environments:"
            echo "  local      - Deploy locally with Docker Compose"
            echo "  staging    - Deploy to staging Kubernetes cluster"
            echo "  production - Deploy to production Kubernetes cluster"
            echo "  test       - Run all tests without deploying"
            echo "  rollback   - Rollback to previous version"
            echo ""
            echo "Examples:"
            echo "  $0 local"
            echo "  $0 production 6.0.0 docker.io/ultra-dex"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "Deployment complete! 🚀"
}

# Run main function
main "$@"
