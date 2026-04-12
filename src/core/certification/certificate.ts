import crypto from 'crypto';

export type CertificationLevel = 'practitioner' | 'architect' | 'expert';

export interface CertificatePayload {
  id: string;
  candidateId: string;
  level: CertificationLevel;
  score: number;
  issuedAt: string;
}

export interface SignedCertificate {
  payload: CertificatePayload;
  signature: string;
  publicKey: string;
}

// Generate a key pair for signing certificates
// In production, the private key would be securely stored and public key distributed
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

export class CertificateManager {
  private privateKey: crypto.KeyObject;
  public publicKey: string;

  constructor(privKey?: crypto.KeyObject, pubKeyStr?: string) {
    this.privateKey = privKey || privateKey;
    this.publicKey = pubKeyStr || publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }

  generateCertificate(
    candidateId: string,
    level: CertificationLevel,
    percentage: number
  ): SignedCertificate {
    const payload: CertificatePayload = {
      id: crypto.randomUUID(),
      candidateId,
      level,
      score: Number(percentage.toFixed(2)),
      issuedAt: new Date().toISOString(),
    };

    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const signature = crypto.sign(null, dataBuffer, this.privateKey).toString('hex');

    return {
      payload,
      signature,
      publicKey: this.publicKey,
    };
  }

  verifyCertificate(certificate: SignedCertificate): boolean {
    try {
      const dataBuffer = Buffer.from(JSON.stringify(certificate.payload));
      const pubKey = crypto.createPublicKey(certificate.publicKey);
      return crypto.verify(null, dataBuffer, pubKey, Buffer.from(certificate.signature, 'hex'));
    } catch (e) {
      return false;
    }
  }
}

export const certificateManager = new CertificateManager();
