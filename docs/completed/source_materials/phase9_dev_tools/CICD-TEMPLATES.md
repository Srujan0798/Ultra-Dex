# Ultra-Dex CI/CD Integration Templates

This directory contains ready-to-use CI/CD configurations for popular platforms.

## Available Templates

### GitHub Actions
- **basic.yml** - Basic Ultra-Dex validation on every push
- **advanced.yml** - Full pipeline with validation, tests, and deployment
- **pr-validation.yml** - Validate PRs against implementation plan
- **nightly.yml** - Nightly builds with full agent swarm

### GitLab CI
- **.gitlab-ci-basic.yml** - Basic pipeline configuration
- **.gitlab-ci-advanced.yml** - Multi-stage pipeline with caching

### CircleCI
- **config-basic.yml** - Simple validation workflow
- **config-advanced.yml** - Complete CI/CD with deployment stages

### Travis CI
- **.travis.yml** - Travis CI configuration

### Azure DevOps
- **azure-pipelines-basic.yml** - Basic pipeline
- **azure-pipelines-advanced.yml** - Advanced with stages

---

## Quick Start

### GitHub Actions (Basic)

1. Copy `.github/workflows/ultra-dex-basic.yml` to your repo
2. Ultra-Dex will validate your project on every push
3. Check the Actions tab for results

```yaml
# .github/workflows/ultra-dex-basic.yml
name: Ultra-Dex Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Ultra-Dex
        run: npm install -g ultra-dex
        
      - name: Validate Project Structure
        run: ultra-dex validate --scan
        
      - name: Check Alignment
        run: ultra-dex diff --json
        
      - name: Sync Context
        run: ultra-dex brain
```

### GitHub Actions (Advanced)

```yaml
# .github/workflows/ultra-dex-advanced.yml
name: Ultra-Dex CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    # Run every night at 2 AM
    - cron: '0 2 * * *'

env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

jobs:
  # Phase 1: Validation
  validate:
    name: Validate Project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full git history for brain sync
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install Ultra-Dex
        run: npm install -g ultra-dex
        
      - name: Doctor Check
        run: ultra-dex doctor
        
      - name: Validate Structure
        run: ultra-dex validate --scan
        
      - name: Sync Context
        run: ultra-dex brain
        
      - name: Check Alignment
        id: alignment
        run: |
          echo "ALIGNMENT_SCORE=$(ultra-dex diff --json | jq -r '.alignment')" >> $GITHUB_OUTPUT
          
      - name: Upload Validation Results
        uses: actions/upload-artifact@v4
        with:
          name: validation-results
          path: |
            CONTEXT.md
            .ultra/state.json

  # Phase 2: Test
  test:
    name: Run Tests
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Tests
        run: npm test
        
      - name: Ultra-Dex Verify
        run: ultra-dex verify

  # Phase 3: Build
  build:
    name: Build Project
    needs: [validate, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Export Context
        run: ultra-dex export --format json --output build-context.json
        
      - name: Upload Build
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            dist/
            build-context.json

  # Phase 4: Deploy (only on main branch)
  deploy:
    name: Deploy
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Build
        uses: actions/download-artifact@v4
        with:
          name: build-output
          
      - name: Deploy to Production
        run: |
          # Your deployment commands here
          echo "Deploying with Ultra-Dex context..."
          
      - name: Post-Deploy Validation
        run: |
          ultra-dex doctor
          ultra-dex health
```

### PR Validation Workflow

```yaml
# .github/workflows/ultra-dex-pr.yml
name: PR Validation

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate-pr:
    name: Validate PR
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Ultra-Dex
        run: npm install -g ultra-dex
        
      - name: Check PR against Implementation Plan
        run: |
          ALIGNMENT=$(ultra-dex diff --json | jq -r '.alignment')
          echo "Current alignment: $ALIGNMENT%"
          
          if [ "$ALIGNMENT" -lt 50 ]; then
            echo "::error::Alignment score ($ALIGNMENT%) is below 50%"
            exit 1
          fi
          
          echo "::notice::Alignment score: $ALIGNMENT% ✓"
        
      - name: Review Code with AI
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Run AI review on changed files
          ultra-dex review --provider claude --json > review-results.json
          
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = JSON.parse(fs.readFileSync('review-results.json', 'utf8'));
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Ultra-Dex Review Results\n\nAlignment: ${review.alignment}%\n\n${review.summary}`
            });
```

---

## GitLab CI

### Basic Configuration

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"
  ULTRA_DEX_VERSION: "latest"

validate:
  stage: validate
  image: node:20
  before_script:
    - npm install -g ultra-dex@$ULTRA_DEX_VERSION
  script:
    - ultra-dex doctor
    - ultra-dex validate --scan
    - ultra-dex brain
    - ultra-dex diff
  artifacts:
    reports:
      junit: validation-results.xml
    paths:
      - CONTEXT.md
      - .ultra/state.json
  cache:
    key: "$CI_COMMIT_REF_SLUG"
    paths:
      - .ultra/

test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm test
    - ultra-dex verify
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'

build:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
    - ultra-dex export --format json --output build-context.json
  artifacts:
    paths:
      - dist/
      - build-context.json
    expire_in: 1 week

deploy:
  stage: deploy
  image: node:20
  script:
    - echo "Deploying..."
    - ultra-dex health
  only:
    - main
```

---

## CircleCI

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.1.0

jobs:
  validate:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Install Ultra-Dex
          command: npm install -g ultra-dex
      - run:
          name: Validate Project
          command: |
            ultra-dex doctor
            ultra-dex validate --scan
            ultra-dex brain
      - persist_to_workspace:
          root: .
          paths:
            - CONTEXT.md
            - .ultra/

  test:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run Tests
          command: |
            npm test
            ultra-dex verify

  build:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - attach_workspace:
          at: .
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Build
          command: npm run build
      - store_artifacts:
          path: dist/

workflows:
  version: 2
  ultra-dex-pipeline:
    jobs:
      - validate
      - test:
          requires:
            - validate
      - build:
          requires:
            - test
```

---

## Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Validate
    jobs:
      - job: ValidateProject
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
            displayName: 'Install Node.js'
          
          - script: npm install -g ultra-dex
            displayName: 'Install Ultra-Dex'
          
          - script: |
              ultra-dex doctor
              ultra-dex validate --scan
              ultra-dex brain
              ultra-dex diff
            displayName: 'Validate with Ultra-Dex'
          
          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.SourcesDirectory)/.ultra'
              artifactName: 'ultra-dex-context'

  - stage: Test
    dependsOn: Validate
    jobs:
      - job: RunTests
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          
          - script: npm ci
            displayName: 'Install dependencies'
          
          - script: |
              npm test
              ultra-dex verify
            displayName: 'Run tests'

  - stage: Deploy
    dependsOn: Test
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployToProduction
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: |
                    echo "Deploying with Ultra-Dex..."
                    ultra-dex health
```

---

## Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    tools {
        nodejs 'Node20'
    }
    
    environment {
        ANTHROPIC_API_KEY = credentials('anthropic-api-key')
    }
    
    stages {
        stage('Validate') {
            steps {
                sh 'npm install -g ultra-dex'
                sh 'ultra-dex doctor'
                sh 'ultra-dex validate --scan'
                sh 'ultra-dex brain'
                sh 'ultra-dex diff'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm test'
                sh 'ultra-dex verify'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
                sh 'ultra-dex export --format json'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'ultra-dex health'
                // Add deployment steps
            }
        }
    }
    
    post {
        always {
            // Archive Ultra-Dex context
            archiveArtifacts artifacts: 'CONTEXT.md, .ultra/**/*', allowEmptyArchive: true
        }
    }
}
```

---

## Pre-commit Hooks

Add to your `.pre-commit-config.yaml`:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: ultra-dex-validate
        name: Ultra-Dex Validation
        entry: ultra-dex validate
        language: system
        pass_filenames: false
        always_run: true
        
      - id: ultra-dex-align
        name: Ultra-Dex Alignment Check
        entry: ultra-dex diff
        language: system
        pass_filenames: false
        always_run: true
```

Or install via CLI:

```bash
ultra-dex pre-commit --install
```

---

## Best Practices

### 1. Cache Ultra-Dex State
Always cache `.ultra/` directory for faster subsequent runs:

```yaml
cache:
  paths:
    - .ultra/
    - node_modules/
```

### 2. Set API Keys as Secrets
Never commit API keys. Use your CI/CD platform's secret management:

- GitHub: `Settings → Secrets and variables → Actions`
- GitLab: `Settings → CI/CD → Variables`
- CircleCI: `Project Settings → Environment Variables`

### 3. Use Artifacts
Always upload CONTEXT.md and .ultra/state.json as artifacts for debugging.

### 4. Parallel Jobs
Run independent checks in parallel:

```yaml
jobs:
  validate-structure:
    # ...
  check-alignment:
    # ...
  doctor-check:
    # ...
```

### 5. Conditional Deployments
Only deploy if alignment score is high:

```yaml
- name: Check Alignment
  run: |
    ALIGNMENT=$(ultra-dex diff --json | jq -r '.alignment')
    if [ "$ALIGNMENT" -lt 70 ]; then
      echo "Alignment too low: $ALIGNMENT%"
      exit 1
    fi
```

---

## Troubleshooting

### Issue: "ultra-dex: command not found"
**Solution:** Ensure global npm packages are in PATH:
```yaml
- run: export PATH="$PATH:$(npm bin -g)"
```

### Issue: "No IMPLEMENTATION-PLAN.md found"
**Solution:** Run init first or check out full git history:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### Issue: AI commands failing
**Solution:** Set API keys properly:
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

## Examples

See the `examples/` directory for complete working examples:
- `examples/ci-github-advanced.yml` - Full GitHub Actions pipeline
- `examples/ci-gitlab-advanced.yml` - Full GitLab CI pipeline

---

## Support

- Documentation: https://github.com/Srujan0798/Ultra-Dex#readme
- Issues: https://github.com/Srujan0798/Ultra-Dex/issues
- Discussions: https://github.com/Srujan0798/Ultra-Dex/discussions
