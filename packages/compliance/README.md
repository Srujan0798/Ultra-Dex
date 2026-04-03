# @ultra-dex/compliance

Comprehensive compliance and audit logging package for Ultra-Dex.

## Features

- **Audit Logging Engine**: Comprehensive audit trail for all system operations
- **SOC 2 Type II**: Service Organization Control 2 compliance framework
- **GDPR**: General Data Protection Regulation compliance with data processing and consent management
- **HIPAA**: Health Insurance Portability and Accountability Act compliance for healthcare data
- **PCI DSS**: Payment Card Industry Data Security Standard compliance for payment data
- **Data Classification**: Automated data classification and handling policies
- **Retention & Deletion**: Automated data retention and deletion policies
- **Compliance Reporting**: Automated compliance reports and monitoring

## Installation

```bash
npm install @ultra-dex/compliance
```

## Usage

```typescript
import { ComplianceService, AuditLogger } from '@ultra-dex/compliance';

// Initialize services
const complianceService = new ComplianceService();
await complianceService.initialize();

const auditLogger = new AuditLogger();
await auditLogger.initialize();

// Log audit events
await auditLogger.log({
  type: 'user.login',
  severity: 'info',
  userId: 'user123',
  action: 'USER_LOGIN',
  resource: 'authentication',
  resourceId: 'user123',
  details: { success: true },
});

// Generate compliance reports
const soc2Report = await complianceService.generateSOC2Report(
  'org123',
  {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  'admin123'
);
```

## Compliance Frameworks

### SOC 2 Type II

Automated collection of evidence for trust service criteria:

- Security
- Availability
- Processing Integrity
- Confidentiality
- Privacy

### GDPR

- Data subject access requests
- Right to erasure (deletion)
- Data portability
- Consent management
- Automated data processing records

### HIPAA

- Protected Health Information (PHI) handling
- Security Rule compliance
- Privacy Rule compliance
- Breach notification workflows

### PCI DSS

- Cardholder data protection
- Payment processing security
- Compliance monitoring
- Security assessments

## Data Classification

Automatic classification of data based on sensitivity:

- **Public**: Non-sensitive information
- **Internal**: Business-sensitive data
- **Confidential**: Customer data, intellectual property
- **Restricted**: PHI, PCI data, secrets

## Retention Policies

Configurable retention periods:

- Audit logs: 7 years
- User data: Based on account lifecycle
- Transaction data: 7 years
- Temporary files: 30 days

## Monitoring & Alerts

Real-time compliance monitoring:

- Policy violations
- Access anomalies
- Data retention compliance
- Security incidents

## API Reference

See [API Documentation](./docs/api.md) for detailed API reference.
