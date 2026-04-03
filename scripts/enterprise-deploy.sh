#!/bin/bash
# Ultra-Dex Enterprise Deployment Script
# Production-ready deployment with security and compliance

set -euo pipefail

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
REGION="${REGION:-us-west-2}"
CLUSTER_NAME="${CLUSTER_NAME:-ultra-dex-enterprise}"
DOMAIN="${DOMAIN:-ultra-dex-enterprise.com}"
CERT_ARN="${CERT_ARN:-arn:aws:acm:us-west-2:account:certificate/certificate-id}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%dT%H:%M:%S')]${NC} $1"
}

# Error handling
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    command -v aws >/dev/null 2>&1 || error_exit "AWS CLI is required but not installed"
    command -v kubectl >/dev/null 2>&1 || error_exit "kubectl is required but not installed"
    command -v helm >/dev/null 2>&1 || error_exit "helm is required but not installed"
    command -v docker >/dev/null 2>&1 || error_exit "docker is required but not installed"

    # Check if we're logged into AWS
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error_exit "AWS CLI not configured. Run 'aws configure' first."
    fi

    log "✅ Prerequisites verified"
}

# Create infrastructure
create_infrastructure() {
    log "Creating infrastructure in $REGION..."

    # Create VPC with private/public subnets
    log "Creating VPC..."
    aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ultra-dex-vpc},{Key=Environment,Value='$ENVIRONMENT'}]' \
        --region $REGION

    # Create EKS cluster
    log "Creating EKS cluster..."
    eksctl create cluster \
        --name $CLUSTER_NAME \
        --region $REGION \
        --nodegroup-name ultra-dex-workers \
        --node-type t3.medium \
        --nodes 3 \
        --nodes-min 1 \
        --nodes-max 10 \
        --managed

    # Create RDS instance for PostgreSQL
    log "Creating RDS instance..."
    aws rds create-db-instance \
        --db-instance-identifier ultra-dex-postgres \
        --db-instance-class db.t3.medium \
        --engine postgres \
        --master-username ultra_dex_user \
        --allocated-storage 100 \
        --region $REGION

    # Create ElastiCache cluster for Redis
    log "Creating ElastiCache cluster..."
    aws elasticache create-cache-cluster \
        --cache-cluster-id ultra-dex-redis \
        --cache-node-type cache.t3.micro \
        --engine redis \
        --num-cache-nodes 1 \
        --region $REGION

    log "✅ Infrastructure created"
}

# Deploy Ultra-Dex
deploy_ultra_dex() {
    log "Deploying Ultra-Dex to EKS cluster..."

    # Create namespace
    kubectl create namespace ultra-dex --dry-run=client -o yaml | kubectl apply -f -

    # Create secrets
    kubectl create secret generic ultra-dex-secrets \
        --namespace ultra-dex \
        --from-literal=jwt-secret="$JWT_SECRET" \
        --from-literal=audit-encryption-key="$AUDIT_ENCRYPTION_KEY" \
        --from-literal=encryption-key="$ENCRYPTION_KEY" \
        --from-literal=openai-api-key="$OPENAI_API_KEY" \
        --from-literal=anthropic-api-key="$ANTHROPIC_API_KEY" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Create config map
    kubectl create configmap ultra-dex-config \
        --namespace ultra-dex \
        --from-literal=DATABASE_URL="$DATABASE_URL" \
        --from-literal=REDIS_URL="$REDIS_URL" \
        --from-literal=NODE_ENV=production \
        --from-literal=TRUST_PROXY=true \
        --dry-run=client -o yaml | kubectl apply -f -

    # Deploy Ultra-Dex with Helm
    helm upgrade --install ultra-dex ./charts/ultra-dex \
        --namespace ultra-dex \
        --values ./charts/values-enterprise.yaml \
        --set image.tag="$IMAGE_TAG" \
        --set ingress.hosts[0].host="$DOMAIN" \
        --set ingress.annotations."kubernetes\\.io/ingress\\.class"=alb \
        --set ingress.annotations."alb\\.ingress\\.kubernetes\\.io/scheme"=internet-facing \
        --set ingress.annotations."alb\\.ingress\\.kubernetes\\.io/certificate-arn"="$CERT_ARN"

    # Wait for deployment to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=ultra-dex --timeout=300s --namespace ultra-dex

    log "✅ Ultra-Dex deployed"
}

# Configure security
configure_security() {
    log "Configuring enterprise security..."

    # Enable audit logging
    kubectl patch deployment ultra-dex \
        --namespace ultra-dex \
        --patch '{"spec":{"template":{"spec":{"containers":[{"name":"ultra-dex","env":[{"name":"AUDIT_LOGGING","value":"true"}]}]}}}}'

    # Configure RBAC
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ultra-dex-enterprise
  namespace: ultra-dex
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ultra-dex
  name: ultra-dex-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ultra-dex-rolebinding
  namespace: ultra-dex
subjects:
- kind: ServiceAccount
  name: ultra-dex-enterprise
  namespace: ultra-dex
roleRef:
  kind: Role
  name: ultra-dex-role
  apiGroup: rbac.authorization.k8s.io
EOF

    # Configure network policies
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ultra-dex-network-policy
  namespace: ultra-dex
spec:
  podSelector:
    matchLabels:
      app: ultra-dex
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 4000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
EOF

    log "✅ Security configured"
}

# Run compliance checks
run_compliance_checks() {
    log "Running compliance checks..."

    # Run security scan
    log "Running security scan..."
    ultra-dex security audit

    # Verify compliance
    log "Verifying compliance..."
    ultra-dex compliance verify --type SOC2

    # Generate compliance report
    log "Generating compliance report..."
    ultra-dex compliance report --type SOC2 --output /tmp/soc2-compliance-report.json

    log "✅ Compliance checks completed"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."

    # Check if all pods are running
    if ! kubectl get pods --namespace ultra-dex | grep ultra-dex | grep Running; then
        error_exit "Ultra-Dex pods are not running"
    fi

    # Check if services are available
    if ! kubectl get services --namespace ultra-dex | grep ultra-dex; then
        error_exit "Ultra-Dex services are not available"
    fi

    # Test health endpoint
    log "Testing health endpoint..."
    HEALTH_URL="https://$DOMAIN/health"
    if ! curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
        error_exit "Health endpoint not responding: $HEALTH_URL"
    fi

    # Run system diagnostics
    log "Running system diagnostics..."
    ultra-dex doctor

    log "✅ Deployment verified"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring and alerting..."

    # Install Prometheus and Grafana
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    helm upgrade --install prometheus prometheus-community/prometheus \
        --namespace monitoring --create-namespace

    # Install Ultra-Dex monitoring dashboard
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ultra-dex-dashboard
  namespace: monitoring
data:
  ultra-dex-dashboard.json: |
    {
      "dashboard": {
        "id": null,
        "title": "Ultra-Dex Enterprise Dashboard",
        "panels": [
          {
            "id": 1,
            "title": "System Health",
            "type": "singlestat",
            "targets": [
              {
                "expr": "ultra_dex_system_health",
                "legendFormat": "Health Score"
              }
            ]
          }
        ]
      }
    }
EOF

    # Setup alerting rules
    kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ultra-dex-alerts
  namespace: monitoring
spec:
  groups:
  - name: ultra-dex.rules
    rules:
    - alert: UltraDexDown
      expr: ultra_dex_system_health < 1
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Ultra-Dex is down"
        description: "Ultra-Dex service has been down for more than 1 minute"
EOF

    log "✅ Monitoring setup completed"
}

# Main execution
main() {
    log "🚀 Starting Ultra-Dex Enterprise Deployment"

    check_prerequisites
    create_infrastructure
    deploy_ultra_dex
    configure_security
    run_compliance_checks
    verify_deployment
    setup_monitoring

    log "🎉 Ultra-Dex Enterprise Deployment Complete!"
    log "🌐 Access your deployment at: https://$DOMAIN"
    log "📊 Monitor at: https://grafana.$DOMAIN"
    log "📋 Check compliance at: ultra-dex compliance report --type SOC2"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi