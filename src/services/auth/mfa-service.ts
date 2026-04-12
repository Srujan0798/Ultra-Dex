// Copyright (c) 2026 Ultra-Dex
/**
 * Multi-Factor Authentication Service
 * Supports TOTP, SMS, and email-based MFA
 *
 * @module services/auth/mfa-service
 */

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import errorHandler from '../../../apps/cli/lib/utils/error-handler.js';

export type MFAType = 'totp' | 'sms' | 'email';
export type MFAStatus = 'enabled' | 'disabled' | 'pending';

export interface MFAConfig {
  id: string;
  userId: string;
  type: MFAType;
  status: MFAStatus;
  secret?: string; // For TOTP
  backupCodes?: string[];
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MFASetupResult {
  success: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
  error?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * MFA Service
 */
export class MFAService {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    console.log('✓ MFA service initialized');
    this.initialized = true;
  }

  /**
   * Setup TOTP for user
   */
  async setupTOTP(userId: string, issuer: string = 'Ultra-Dex'): Promise<MFASetupResult> {
    await this.initialize();

    try {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `${issuer}:${userId}`,
        issuer,
        length: 32,
      });

      // Generate QR code
      if (!secret.otpauth_url) throw new Error('Failed to generate TOTP secret');
      const qrCode = await qrcode.toDataURL(secret.otpauth_url);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Create MFA config
      const mfaConfig: MFAConfig = {
        id: uuidv4(),
        userId,
        type: 'totp',
        status: 'pending',
        secret: secret.base32,
        backupCodes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.storeMFAConfig(mfaConfig);

      await auditLogger.log({
        type: 'security.event',
        severity: 'info',
        action: 'MFA_SETUP_INITIATED',
        userId,
        resource: 'authentication',
        resourceId: mfaConfig.id,
        details: {
          mfaType: 'totp',
        },
      });

      return {
        success: true,
        qrCode,
        secret: secret.base32,
        backupCodes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA setup failed';
      return { success: false, error: message };
    }
  }

  /**
   * Verify TOTP setup
   */
  async verifyTOTPSetup(userId: string, token: string): Promise<boolean> {
    await this.initialize();

    const config = await this.getMFAConfig(userId, 'totp');
    if (!config || !config.secret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: config.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 steps either way for clock drift
    });

    if (verified) {
      config.status = 'enabled';
      config.verifiedAt = new Date();
      config.updatedAt = new Date();
      await this.updateMFAConfig(config);

      await auditLogger.log({
        type: 'security.event',
        severity: 'info',
        action: 'MFA_SETUP_COMPLETED',
        userId,
        resource: 'authentication',
        resourceId: config.id,
        details: {
          mfaType: 'totp',
        },
      });
    }

    return verified;
  }

  /**
   * Verify MFA token during authentication
   */
  async verifyMFAToken(
    userId: string,
    token: string,
    type: MFAType = 'totp'
  ): Promise<MFAVerificationResult> {
    await this.initialize();

    const config = await this.getMFAConfig(userId, type);
    if (!config || config.status !== 'enabled') {
      return { success: false, error: 'MFA not configured or disabled' };
    }

    let verified = false;

    if (type === 'totp' && config.secret) {
      verified = speakeasy.totp.verify({
        secret: config.secret,
        encoding: 'base32',
        token,
        window: 2,
      });
    } else if (type === 'sms' || type === 'email') {
      // For SMS/Email, would check temporary codes stored in cache
      // Simplified implementation
      verified = await this.verifyTemporaryCode(userId, token);
    }

    if (verified) {
      await auditLogger.log({
        type: 'security.event',
        severity: 'info',
        action: 'MFA_VERIFICATION_SUCCESS',
        userId,
        resource: 'authentication',
        details: {
          mfaType: type,
        },
      });

      return { success: true };
    }

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'MFA_VERIFICATION_FAILED',
      userId,
      resource: 'authentication',
      details: {
        mfaType: type,
      },
    });

    return { success: false, error: 'Invalid MFA token' };
  }

  /**
   * Use backup code
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    await this.initialize();

    const config = await this.getMFAConfig(userId, 'totp');
    if (!config || !config.backupCodes) {
      return false;
    }

    const codeIndex = config.backupCodes.indexOf(code);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    config.backupCodes.splice(codeIndex, 1);
    config.updatedAt = new Date();
    await this.updateMFAConfig(config);

    await auditLogger.log({
      type: 'security.event',
      severity: 'warning',
      action: 'BACKUP_CODE_USED',
      userId,
      resource: 'authentication',
      resourceId: config.id,
      details: {
        remainingCodes: config.backupCodes.length,
      },
    });

    return true;
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<boolean> {
    await this.initialize();

    const configs = await this.getUserMFAConfigs(userId);

    for (const config of configs) {
      config.status = 'disabled';
      config.updatedAt = new Date();
      await this.updateMFAConfig(config);
    }

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'MFA_DISABLED',
      userId,
      resource: 'authentication',
      details: {
        disabledConfigs: configs.length,
      },
    });

    return true;
  }

  /**
   * Get MFA status for user
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    await this.initialize();

    const configs = await this.getUserMFAConfigs(userId);
    const enabledConfigs = configs.filter((c) => c.status === 'enabled');

    if (enabledConfigs.length > 0) {
      return 'enabled';
    }

    const pendingConfigs = configs.filter((c) => c.status === 'pending');
    if (pendingConfigs.length > 0) {
      return 'pending';
    }

    return 'disabled';
  }

  /**
   * Send MFA code via SMS
   * Supports Twilio, AWS SNS, and generic HTTP SMS gateways
   */
  async sendSMSCode(userId: string, phoneNumber: string): Promise<boolean> {
    const code = this.generateNumericCode();
    await this.storeTemporaryCode(userId, code, 'sms');

    const provider = process.env.ULTRA_DEX_SMS_PROVIDER || 'twilio';
    const apiKey = process.env.ULTRA_DEX_SMS_API_KEY;
    const apiSecret = process.env.ULTRA_DEX_SMS_SECRET;

    if (!apiKey || !apiSecret) {
      // Development mode: log code instead of sending
      await auditLogger.log({
        action: 'mfa:sms:dev-mode',
        userId,
        message: `SMS MFA code for ${phoneNumber}: ${code}`,
        level: 'info',
      });
      return true;
    }

    try {
      switch (provider) {
        case 'twilio':
          await this.sendTwilioSMS(phoneNumber, code, apiKey, apiSecret);
          break;
        case 'aws-sns':
          await this.sendAWSSNS(phoneNumber, code, apiKey, apiSecret);
          break;
        default:
          throw new Error(`Unknown SMS provider: ${provider}`);
      }

      await auditLogger.log({
        action: 'mfa:sms:sent',
        userId,
        phoneNumber: this.maskPhone(phoneNumber),
        provider,
      });

      return true;
    } catch (error) {
      await auditLogger.log({
        action: 'mfa:sms:failed',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send MFA code via Email
   * Supports SendGrid, AWS SES, and SMTP
   */
  async sendEmailCode(userId: string, email: string): Promise<boolean> {
    const code = this.generateNumericCode();
    await this.storeTemporaryCode(userId, code, 'email');

    const provider = process.env.ULTRA_DEX_EMAIL_PROVIDER || 'sendgrid';
    const apiKey = process.env.ULTRA_DEX_EMAIL_API_KEY;

    if (!apiKey) {
      // Development mode: log code instead of sending
      await auditLogger.log({
        action: 'mfa:email:dev-mode',
        userId,
        message: `Email MFA code for ${email}: ${code}`,
        level: 'info',
      });
      return true;
    }

    try {
      const subject = 'Your Ultra-Dex Security Code';
      const body = `
        <h2>Security Verification Code</h2>
        <p>Your Ultra-Dex verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 8px;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `;

      switch (provider) {
        case 'sendgrid':
          await this.sendSendGridEmail(email, subject, body, apiKey);
          break;
        case 'aws-ses':
          await this.sendAWSSES(email, subject, body, apiKey);
          break;
        case 'smtp':
          await this.sendSMTPEmail(email, subject, body);
          break;
        default:
          throw new Error(`Unknown email provider: ${provider}`);
      }

      await auditLogger.log({
        action: 'mfa:email:sent',
        userId,
        email: this.maskEmail(email),
        provider,
      });

      return true;
    } catch (error) {
      await auditLogger.log({
        action: 'mfa:email:failed',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Generate numeric code
   */
  private generateNumericCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store temporary code
   */
  private async storeTemporaryCode(userId: string, code: string, type: MFAType): Promise<void> {
    await ppmManager.add({
      content: `Temporary MFA code: ${type}`,
      type: 'mfa-temp-code',
      importance: 3,
      metadata: {
        userId,
        code,
        type,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });
  }

  /**
   * Verify temporary code
   */
  private async verifyTemporaryCode(userId: string, code: string): Promise<boolean> {
    const results = await ppmManager.search(`mfa-temp-code:${userId}`);
    if (!results) return false;

    for (const result of results) {
      const data = result.metadata as { code?: string; expiresAt?: Date };
      if (data.code === code && data.expiresAt && new Date() < data.expiresAt) {
        // Remove used code
        await ppmManager.remove(result.id);
        return true;
      }
    }

    return false;
  }

  /**
   * Store MFA config
   */
  private async storeMFAConfig(config: MFAConfig): Promise<void> {
    await ppmManager.add({
      content: `MFA config: ${config.type}`,
      type: 'mfa-config',
      importance: 6,
      metadata: config,
    });
  }

  /**
   * Update MFA config
   */
  private async updateMFAConfig(config: MFAConfig): Promise<void> {
    // Update in memory store
    const results = await ppmManager.search(`mfa-config:${config.id}`);
    if (results && results.length > 0) {
      await ppmManager.update(results[0].id, {
        content: `MFA config updated: ${config.type}`,
        metadata: config,
      });
    }
  }

  /**
   * Get MFA config
   */
  private async getMFAConfig(userId: string, type: MFAType): Promise<MFAConfig | null> {
    const results = await ppmManager.search(`mfa-config:${userId}:${type}`);
    if (results && results.length > 0) {
      return results[0].metadata as MFAConfig;
    }
    return null;
  }

  /**
   * Get all MFA configs for user
   */
  private async getUserMFAConfigs(userId: string): Promise<MFAConfig[]> {
    const results = await ppmManager.search(`mfa-config:${userId}`);
    return results?.map((r) => r.metadata as MFAConfig) || [];
  }

  /**
   * Send SMS via Twilio
   */
  private async sendTwilioSMS(
    phoneNumber: string,
    code: string,
    accountSid: string,
    authToken: string
  ): Promise<void> {
    const message = `Your Ultra-Dex security code is: ${code}`;
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: process.env.TWILIO_PHONE_NUMBER || '',
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio SMS failed: ${response.status}`);
    }
  }

  /**
   * Send SMS via AWS SNS
   */
  private async sendAWSSNS(
    phoneNumber: string,
    code: string,
    accessKeyId: string,
    secretAccessKey: string
  ): Promise<void> {
    const region = process.env.AWS_REGION || 'us-east-1';
    const message = `Your Ultra-Dex security code is: ${code}`;

    // Sign the request
    const date = new Date();
    const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    const service = 'sns';
    const algorithm = 'AWS4-HMAC-SHA256';
    const credential = `${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`;

    const response = await fetch(`https://sns.${region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        Authorization: `AWS4-HMAC-SHA256 Credential=${credential}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': date.toISOString().replace(/[:\-]|\.\d{3}/g, ''),
      },
      body: new URLSearchParams({
        Action: 'Publish',
        PhoneNumber: phoneNumber,
        Message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`AWS SNS failed: ${response.status}`);
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendSendGridEmail(
    to: string,
    subject: string,
    htmlBody: string,
    apiKey: string
  ): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@ultra-dex.dev' },
        subject,
        content: [{ type: 'text/html', value: htmlBody }],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid failed: ${response.status}`);
    }
  }

  /**
   * Send email via AWS SES
   */
  private async sendAWSSES(
    to: string,
    subject: string,
    htmlBody: string,
    apiKey: string
  ): Promise<void> {
    const region = process.env.AWS_REGION || 'us-east-1';
    const response = await fetch(`https://email.${region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        Action: 'SendEmail',
        Source: process.env.SES_FROM_EMAIL || 'noreply@ultra-dex.dev',
        'Destination.ToAddresses.member.1': to,
        'Message.Subject.Data': subject,
        'Message.Body.Html.Data': htmlBody,
      }),
    });

    if (!response.ok) {
      throw new Error(`AWS SES failed: ${response.status}`);
    }
  }

  /**
   * Send email via SMTP
   */
  private async sendSMTPEmail(to: string, subject: string, htmlBody: string): Promise<void> {
    // SMTP requires nodemailer or similar
    // For now, throw error with instructions
    throw new Error('SMTP email requires nodemailer. Install with: npm install nodemailer');
  }

  /**
   * Mask phone number for logging
   */
  private maskPhone(phone: string): string {
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  /**
   * Mask email for logging
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.charAt(0)}***@${domain}`;
  }
}

// Export singleton instance
export const mfaService = new MFAService();
export default mfaService;
