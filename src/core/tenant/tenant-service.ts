/**
 * Tenant Service
 * Manages organization tenants and multi-tenant configurations
 */

export interface TenantConfig {
  plan: 'free' | 'pro' | 'enterprise';
  maxUsers: number;
  features: string[];
  customDomain?: string;
  metadata?: Record<string, unknown>;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  config: TenantConfig;
  createdAt: string;
  updatedAt: string;
}

export class TenantService {
  private tenants: Map<string, Tenant> = new Map();

  /**
   * Create a new tenant with initial configuration
   */
  async createTenant(
    name: string,
    domain: string,
    config?: Partial<TenantConfig>
  ): Promise<Tenant> {
    const id = `tnt_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    const tenant: Tenant = {
      id,
      name,
      domain,
      config: {
        plan: 'free',
        maxUsers: 10,
        features: [],
        ...config,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.tenants.set(id, tenant);
    return tenant;
  }

  /**
   * Get a tenant by its ID
   */
  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  /**
   * List all registered tenants
   */
  async listTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  /**
   * Delete a tenant by ID
   */
  async deleteTenant(id: string): Promise<boolean> {
    return this.tenants.delete(id);
  }

  /**
   * Update tenant configuration
   */
  async updateTenantConfig(id: string, config: Partial<TenantConfig>): Promise<Tenant> {
    const tenant = this.tenants.get(id);
    if (!tenant) throw new Error(`Tenant ${id} not found`);

    tenant.config = { ...tenant.config, ...config };
    tenant.updatedAt = new Date().toISOString();

    this.tenants.set(id, tenant);
    return tenant;
  }
}

export const tenantService = new TenantService();
