# Cloud SDK Usage Scan Report

| Package | Import Count | Files | Status |
|---------|--------------|-------|--------|
| @azure/functions | 0 | - | ❌ Remove |
| @azure/identity | 0 | - | ❌ Remove |
| @azure/monitor-query | 0 | - | ❌ Remove |
| @azure/openai | 0 | - | ❌ Remove |
| @azure/storage-blob | 0 | - | ❌ Remove |
| @google-cloud/aiplatform | 0 | - | ❌ Remove |
| @google-cloud/logging | 0 | - | ❌ Remove |
| @google-cloud/monitoring | 0 | - | ❌ Remove |
| @google-cloud/storage | 0 | - | ❌ Remove |
| @aws-sdk/client-cloudwatch | 0 | - | ❌ Remove |
| @aws-sdk/client-iam | 0 | - | ❌ Remove |
| @aws-sdk/client-lambda | 0 | - | ❌ Remove |
| @aws-sdk/client-s3 | 3 | src/services/file-storage/s3-adapter.js, apps/cli/assets/live-templates/... | ✅ Keep |
| @aws-sdk/client-bedrock-runtime | 0 | - | ❌ Remove |

## Summary
- Total packages scanned: 14
- Packages in use: 1 (@aws-sdk/client-s3)
- Packages to remove: 13
