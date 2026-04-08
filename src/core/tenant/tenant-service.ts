export interface Tenant { id: string; name: string; domain: string; }
export class TenantService {
  async createTenant(name: string, domain: string): Promise<Tenant> {
    return { id: `t_${Date.now()}`, name, domain };
  }
}
export const tenantService = new TenantService();
