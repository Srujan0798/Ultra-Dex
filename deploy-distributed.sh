#!/bin/bash

# Ultra-Dex Distributed Deployment Script
# Spins up multiple Ultra-Dex instances that coordinate automatically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Build Docker image with NVIDIA support
build_image() {
    log_info "Building Ultra-Dex Docker image with NVIDIA support..."

    # Check for NVIDIA Docker runtime
    if docker info | grep -q "nvidia"; then
        log_info "NVIDIA Docker runtime detected"
        BUILD_ARGS="--build-arg NVIDIA_VISIBLE_DEVICES=all"
    else
        log_warning "NVIDIA Docker runtime not detected. NVIDIA features may not work."
        BUILD_ARGS=""
    fi

    cd "$PROJECT_ROOT"
    docker build $BUILD_ARGS -t ultradex-distributed:latest .
    log_success "Docker image built successfully"
}

# Start distributed cluster
start_cluster() {
    local instances="${1:-3}"
    log_info "Starting Ultra-Dex distributed cluster with $instances instances..."

    cd "$PROJECT_ROOT"

    # Set number of instances in docker-compose
    sed -i.bak "s/replicas: [0-9]\+/replicas: $instances/" docker-compose.yml

    docker-compose up -d --scale "ultradex-instance-1=$instances" --scale "ultradex-instance-2=$instances" --scale "ultradex-instance-3=$instances"

    log_success "Cluster started. Waiting for services to be healthy..."

    # Wait for services to be healthy
    sleep 15

    # Check health of services
    check_cluster_health
}

# Stop distributed cluster
stop_cluster() {
    log_info "Stopping Ultra-Dex distributed cluster..."
    cd "$PROJECT_ROOT"
    docker-compose down
    log_success "Cluster stopped"
}

# Check cluster health
check_cluster_health() {
    log_info "Checking cluster health..."

    local healthy_count=0
    local total_instances=0

    # Count total instances
    for i in {1..10}; do
        if docker ps --format "table {{.Names}}" | grep -q "ultradex-$i"; then
            ((total_instances++))
        fi
    done

    # Check health of each instance
    for i in {1..10}; do
        if docker ps --format "table {{.Names}}" | grep -q "ultradex-$i"; then
            if docker exec "ultradex-$i" curl -s -f http://localhost:8080/health > /dev/null 2>&1; then
                log_success "ultradex-$i: healthy"
                ((healthy_count++))
            else
                log_error "ultradex-$i: unhealthy"
            fi
        fi
    done

    if [ $healthy_count -eq $total_instances ] && [ $total_instances -gt 0 ]; then
        log_success "All $total_instances instances are healthy! 🎉"
        log_info "Dashboard available at: http://localhost (via nginx)"
        log_info "API endpoints: http://localhost:8081, :8082, :8083"
    else
        log_warning "$healthy_count/$total_instances instances healthy"
    fi
}

# View logs
view_logs() {
    local service="${1:-ultradex-1}"
    log_info "Viewing logs for $service..."
    cd "$PROJECT_ROOT"
    docker-compose logs -f "$service"
}

# Scale cluster
scale_cluster() {
    local instances="${1:-3}"
    log_info "Scaling cluster to $instances instances per service..."

    cd "$PROJECT_ROOT"

    # Stop current cluster
    docker-compose down

    # Update docker-compose for scaling
    # This is a simplified scaling - in production you'd want more sophisticated scaling
    log_info "Restarting with $instances instances..."
    start_cluster "$instances"
}

# Show cluster status
show_status() {
    log_info "Ultra-Dex Distributed Cluster Status"
    echo "====================================="

    cd "$PROJECT_ROOT"

    if docker-compose ps | grep -q "Up"; then
        log_success "Cluster is running"

        echo ""
        echo "Services:"
        docker-compose ps

        echo ""
        echo "Instance Health:"
        check_cluster_health

        echo ""
        echo "Resource Usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

    else
        log_warning "Cluster is not running"
        echo "Run '$0 start' to start the cluster"
    fi
}

# Test distributed functionality
test_distributed() {
    log_info "Testing distributed functionality..."

    # Check if instances can communicate
    if docker exec ultradex-1 curl -s http://ultradex-2:8080/api/v1/peers | grep -q "peers"; then
        log_success "Peer discovery working"
    else
        log_error "Peer discovery not working"
    fi

    # Check load balancing
    log_info "Testing load balancing by submitting a task..."
    # This would require implementing a test task submission
    log_info "Manual testing: Try submitting tasks to different instances"
}

# Deploy to Kubernetes
deploy_k8s() {
    log_info "Deploying distributed cluster to Kubernetes..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # Build and push image
    log_info "Building and pushing Docker image..."
    docker build -t ultradex-distributed:latest .

    # Apply Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f k8s-deployment.yaml

    log_success "Kubernetes deployment initiated"
    log_info "Check status with: kubectl get pods"
    log_info "Monitor with: kubectl logs -f deployment/ultradex-distributed"
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."
    cd "$PROJECT_ROOT"
    docker-compose down -v --remove-orphans
    docker system prune -f
    log_success "Cleanup complete"
}

# Main script logic
case "${1:-help}" in
    build)
        check_prerequisites
        build_image
        ;;
    start)
        check_prerequisites
        build_image
        start_cluster "$2"
        ;;
    stop)
        stop_cluster
        ;;
    restart)
        stop_cluster
        sleep 2
        start_cluster "$2"
        ;;
    logs)
        view_logs "$2"
        ;;
    scale)
        scale_cluster "$2"
        ;;
    status)
        show_status
        ;;
    health)
        check_cluster_health
        ;;
    test)
        test_distributed
        ;;
    k8s-deploy)
        deploy_k8s
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Ultra-Dex Distributed Deployment Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  build          Build Docker image with NVIDIA support"
        echo "  start [N]      Start distributed cluster (default: 3 instances)"
        echo "  stop           Stop distributed cluster"
        echo "  restart [N]    Restart distributed cluster"
        echo "  logs [service] View logs (default: ultradex-1)"
        echo "  scale <num>    Scale cluster to N instances per service"
        echo "  status         Show cluster status and health"
        echo "  health         Check cluster health"
        echo "  test           Test distributed functionality"
        echo "  k8s-deploy     Deploy to Kubernetes"
        echo "  cleanup        Clean up containers and volumes"
        echo ""
        echo "Examples:"
        echo "  $0 start          # Start 3-instance cluster"
        echo "  $0 start 5        # Start 5-instance cluster"
        echo "  $0 scale 10       # Scale to 10 instances"
        echo "  $0 logs ultradex-2 # View logs for instance 2"
        echo "  $0 status         # Show cluster status"
        echo "  $0 k8s-deploy    # Deploy to Kubernetes"
        ;;
esac