#!/usr/bin/env node

/**
 * Deployment Automation
 * Generates Terraform, Docker, and Kubernetes configurations
 * Addresses devin_ceo_1.md Gap #8: No deployment automation
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

// Terraform templates
const TERRAFORM_TEMPLATES = {
  main: `# Main Terraform Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "{{PROJECT_NAME}}-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "{{REGION}}"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "{{PROJECT_NAME}}-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["{{REGION}}a", "{{REGION}}b", "{{REGION}}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = {
    Name        = "{{PROJECT_NAME}}"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "{{PROJECT_NAME}}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier        = "{{PROJECT_NAME}}-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  skip_final_snapshot    = true
}
`,
  variables: `# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "{{REGION}}"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "{{PROJECT_NAME}}"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
`,
  outputs: `# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "db_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}
`
};

// Docker templates
const DOCKER_TEMPLATES = {
  dockerfile: `# Multi-stage build
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
`,
  dockerCompose: `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/{{PROJECT_NAME}}
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB={{PROJECT_NAME}}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
`,
  dockerIgnore: `# Dependencies
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log

# Next.js
.next
out

# Environment
.env
.env.local
.env.*.local

# Version control
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# Testing
coverage
.nyc_output

# Misc
*.log
README.md
CHANGELOG.md
Dockerfile.dev
docker-compose.override.yml
`
};

// Kubernetes templates
const K8S_TEMPLATES = {
  deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{PROJECT_NAME}}
  namespace: default
  labels:
    app: {{PROJECT_NAME}}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: {{PROJECT_NAME}}
  template:
    metadata:
      labels:
        app: {{PROJECT_NAME}}
    spec:
      containers:
      - name: {{PROJECT_NAME}}
        image: {{PROJECT_NAME}}:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{PROJECT_NAME}}-secrets
              key: database-url
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: {{PROJECT_NAME}}-secrets
              key: nextauth-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
`,
  service: `apiVersion: v1
kind: Service
metadata:
  name: {{PROJECT_NAME}}-service
  namespace: default
spec:
  selector:
    app: {{PROJECT_NAME}}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
`,
  ingress: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{PROJECT_NAME}}-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - {{DOMAIN}}
    secretName: {{PROJECT_NAME}}-tls
  rules:
  - host: {{DOMAIN}}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{PROJECT_NAME}}-service
            port:
              number: 80
`,
  secrets: `apiVersion: v1
kind: Secret
metadata:
  name: {{PROJECT_NAME}}-secrets
  namespace: default
type: Opaque
stringData:
  database-url: "postgresql://user:password@host:5432/dbname"
  nextauth-secret: "your-secret-key"
  stripe-secret-key: "sk_test_..."
`,
  namespace: `apiVersion: v1
kind: Namespace
metadata:
  name: {{PROJECT_NAME}}
  labels:
    name: {{PROJECT_NAME}}
`
};

// GitHub Actions templates
const GITHUB_ACTIONS_TEMPLES = {
  deploy: `name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run quality checks
      run: npx ultra-dex quality --fail-fast

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ghcr.io/\${{ github.repository }}:latest
          ghcr.io/\${{ github.repository }}:\${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
    
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f k8s/
        kubectl rollout status deployment/{{PROJECT_NAME}}
`
};

// Generate deployment configurations
async function generateTerraform(projectPath, config) {
  const spinner = ora('Generating Terraform configuration...').start();
  
  try {
    const tfDir = path.join(projectPath, 'infrastructure', 'terraform');
    await fs.mkdir(tfDir, { recursive: true });
    
    // Replace placeholders
    const replacements = {
      '{{PROJECT_NAME}}': config.projectName,
      '{{REGION}}': config.region || 'us-east-1'
    };
    
    const replacePlaceholders = (template) => {
      let result = template;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(key, 'g'), value);
      }
      return result;
    };
    
    await fs.writeFile(path.join(tfDir, 'main.tf'), replacePlaceholders(TERRAFORM_TEMPLATES.main));
    await fs.writeFile(path.join(tfDir, 'variables.tf'), replacePlaceholders(TERRAFORM_TEMPLATES.variables));
    await fs.writeFile(path.join(tfDir, 'outputs.tf'), replacePlaceholders(TERRAFORM_TEMPLATES.outputs));
    
    spinner.succeed(chalk.green('Terraform configuration generated'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Terraform generation failed: ${error.message}`));
    return false;
  }
}

async function generateDocker(projectPath, config) {
  const spinner = ora('Generating Docker configuration...').start();
  
  try {
    const replacements = {
      '{{PROJECT_NAME}}': config.projectName
    };
    
    const replacePlaceholders = (template) => {
      let result = template;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(key, 'g'), value);
      }
      return result;
    };
    
    await fs.writeFile(path.join(projectPath, 'Dockerfile'), replacePlaceholders(DOCKER_TEMPLATES.dockerfile));
    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), replacePlaceholders(DOCKER_TEMPLATES.dockerCompose));
    await fs.writeFile(path.join(projectPath, '.dockerignore'), DOCKER_TEMPLATES.dockerIgnore);
    
    spinner.succeed(chalk.green('Docker configuration generated'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Docker generation failed: ${error.message}`));
    return false;
  }
}

async function generateKubernetes(projectPath, config) {
  const spinner = ora('Generating Kubernetes manifests...').start();
  
  try {
    const k8sDir = path.join(projectPath, 'k8s');
    await fs.mkdir(k8sDir, { recursive: true });
    
    const replacements = {
      '{{PROJECT_NAME}}': config.projectName,
      '{{DOMAIN}}': config.domain || 'example.com'
    };
    
    const replacePlaceholders = (template) => {
      let result = template;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(key, 'g'), value);
      }
      return result;
    };
    
    await fs.writeFile(path.join(k8sDir, 'namespace.yaml'), replacePlaceholders(K8S_TEMPLATES.namespace));
    await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), replacePlaceholders(K8S_TEMPLATES.deployment));
    await fs.writeFile(path.join(k8sDir, 'service.yaml'), replacePlaceholders(K8S_TEMPLATES.service));
    await fs.writeFile(path.join(k8sDir, 'ingress.yaml'), replacePlaceholders(K8S_TEMPLATES.ingress));
    await fs.writeFile(path.join(k8sDir, 'secrets.yaml'), replacePlaceholders(K8S_TEMPLATES.secrets));
    
    spinner.succeed(chalk.green('Kubernetes manifests generated'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Kubernetes generation failed: ${error.message}`));
    return false;
  }
}

async function generateGitHubActions(projectPath, config) {
  const spinner = ora('Generating GitHub Actions workflow...').start();
  
  try {
    const workflowsDir = path.join(projectPath, '.github', 'workflows');
    await fs.mkdir(workflowsDir, { recursive: true });
    
    const replacements = {
      '{{PROJECT_NAME}}': config.projectName
    };
    
    const replacePlaceholders = (template) => {
      let result = template;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(key, 'g'), value);
      }
      return result;
    };
    
    await fs.writeFile(path.join(workflowsDir, 'deploy.yml'), replacePlaceholders(GITHUB_ACTIONS_TEMPLES.deploy));
    
    spinner.succeed(chalk.green('GitHub Actions workflow generated'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`GitHub Actions generation failed: ${error.message}`));
    return false;
  }
}

// Export registration function
export function registerDeployCommand(program) {
  program
    .command('deploy')
    .description('Generate deployment configurations (Terraform, Docker, K8s)')
    .option('-p, --project <path>', 'Project root path', '.')
    .option('-n, --name <name>', 'Project name')
    .option('--terraform', 'Generate Terraform only')
    .option('--docker', 'Generate Docker only')
    .option('--k8s', 'Generate Kubernetes only')
    .option('--ci', 'Generate CI/CD only')
    .option('--all', 'Generate all configurations')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .option('-d, --domain <domain>', 'Domain name')
    .action(async (options) => {
      console.log(chalk.blue('\n🚀 Deployment Automation\n'));
      
      const projectPath = path.resolve(options.project);
      
      // Get project name from options or package.json
      let projectName = options.name;
      if (!projectName) {
        try {
          const pkg = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
          projectName = JSON.parse(pkg).name;
        } catch {
          projectName = 'my-app';
        }
      }
      
      const config = {
        projectName,
        region: options.region,
        domain: options.domain || `${projectName}.com`
      };
      
      const results = [];
      
      // Determine what to generate
      const generateAll = options.all || (!options.terraform && !options.docker && !options.k8s && !options.ci);
      
      if (generateAll || options.terraform) {
        results.push({ name: 'Terraform', success: await generateTerraform(projectPath, config) });
      }
      
      if (generateAll || options.docker) {
        results.push({ name: 'Docker', success: await generateDocker(projectPath, config) });
      }
      
      if (generateAll || options.k8s) {
        results.push({ name: 'Kubernetes', success: await generateKubernetes(projectPath, config) });
      }
      
      if (generateAll || options.ci) {
        results.push({ name: 'GitHub Actions', success: await generateGitHubActions(projectPath, config) });
      }
      
      // Summary
      console.log(chalk.blue('\n📊 Generation Summary\n'));
      
      results.forEach(result => {
        const icon = result.success ? chalk.green('✓') : chalk.red('✗');
        console.log(`${icon} ${result.name}`);
      });
      
      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        console.log(chalk.green('\n✅ All deployment configurations generated!'));
        console.log(chalk.yellow('\n⚠️  Next Steps:'));
        console.log(chalk.gray('  1. Review generated files'));
        console.log(chalk.gray('  2. Update environment variables'));
        console.log(chalk.gray('  3. Configure cloud provider credentials'));
        console.log(chalk.gray('  4. Run: terraform init && terraform plan'));
        console.log(chalk.gray('  5. Deploy: docker-compose up -d OR kubectl apply -f k8s/'));
      } else {
        console.log(chalk.red('\n❌ Some configurations failed. Check errors above.'));
        process.exit(1);
      }
    });
}
