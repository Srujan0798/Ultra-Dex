import { createSSOProvider, type SSOProvider, type SSOProviderConfig } from './sso.ts';
import { SLAManager, type EnterpriseTier, type SLAComplianceResult } from './sla.ts';

export interface EnterpriseInitConfig {
  licenseKey: string;
  sso: SSOProviderConfig;
  complianceLevel: 'soc2' | 'gdpr' | 'hipaa' | 'iso27001';
  supportChannel: 'email' | 'slack' | 'pagerduty';
  governancePolicies?: string[];
  tier?: EnterpriseTier;
}

export interface EnterpriseStatus {
  initialized: boolean;
  tier: EnterpriseTier;
  licenseValid: boolean;
  ssoProvider: string | null;
  complianceLevel: EnterpriseInitConfig['complianceLevel'] | null;
  supportChannel: EnterpriseInitConfig['supportChannel'] | null;
  governancePolicies: string[];
  sla: SLAComplianceResult | null;
}

export class EnterpriseInit {
  private ssoProvider: SSOProvider | null = null;
  private readonly slaManager = new SLAManager();
  private status: EnterpriseStatus = {
    initialized: false,
    tier: 'free',
    licenseValid: false,
    ssoProvider: null,
    complianceLevel: null,
    supportChannel: null,
    governancePolicies: [],
    sla: null,
  };

  async initialize(config: EnterpriseInitConfig): Promise<EnterpriseStatus> {
    const licenseValid = this.validateLicenseKey(config.licenseKey);
    if (!licenseValid) {
      throw new Error('Invalid enterprise license key');
    }

    this.ssoProvider = createSSOProvider(config.sso);
    this.status = {
      initialized: true,
      tier: config.tier || 'enterprise',
      licenseValid,
      ssoProvider: config.sso.type,
      complianceLevel: config.complianceLevel,
      supportChannel: config.supportChannel,
      governancePolicies: config.governancePolicies || ['audit-required', 'rbac-enforced'],
      sla: this.slaManager.checkCompliance(config.tier || 'enterprise'),
    };

    return this.getStatus();
  }

  getStatus(): EnterpriseStatus {
    return {
      ...this.status,
      governancePolicies: [...this.status.governancePolicies],
      sla: this.status.sla ? { ...this.status.sla } : null,
    };
  }

  upgrade(tier: EnterpriseTier): EnterpriseStatus {
    const order: EnterpriseTier[] = ['free', 'pro', 'enterprise'];
    const currentIndex = order.indexOf(this.status.tier);
    const nextIndex = order.indexOf(tier);
    if (nextIndex < currentIndex) {
      throw new Error(`Downgrade is not supported via upgrade(): ${this.status.tier} -> ${tier}`);
    }
    this.status.tier = tier;
    this.status.sla = this.slaManager.checkCompliance(tier);
    return this.getStatus();
  }

  getSSOProvider(): SSOProvider | null {
    return this.ssoProvider;
  }

  private validateLicenseKey(licenseKey: string): boolean {
    return /^UDX-ENT-[A-Z0-9]{12,}$/.test(licenseKey);
  }
}

