import crypto from 'crypto';

export type CertificationLevel = 'foundation' | 'professional' | 'expert';

export interface AssessmentSession {
  id: string;
  level: CertificationLevel;
  startedAt: number;
  expiresAt: number;
  score: number;
  maxScore: number;
}

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
}

const LEVEL_THRESHOLD: Record<CertificationLevel, number> = {
  foundation: 60,
  professional: 75,
  expert: 85,
};

export class CertificationEngine {
  private readonly secret: string;

  constructor(secret = 'ultra-dex-cert-secret') {
    this.secret = secret;
  }

  startAssessment(level: CertificationLevel, durationMs: number): AssessmentSession {
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      level,
      startedAt: now,
      expiresAt: now + durationMs,
      score: 0,
      maxScore: 0,
    };
  }

  scoreAnswer(session: AssessmentSession, earned: number, rubricMax: number): AssessmentSession {
    if (Date.now() > session.expiresAt) {
      throw new Error('Assessment expired');
    }
    if (rubricMax <= 0 || earned < 0 || earned > rubricMax) {
      throw new Error('Invalid scoring input');
    }
    return {
      ...session,
      score: session.score + earned,
      maxScore: session.maxScore + rubricMax,
    };
  }

  finalizeAssessment(session: AssessmentSession): { passed: boolean; percentage: number } {
    if (session.maxScore === 0) {
      throw new Error('Assessment has no scored questions');
    }
    const percentage = (session.score / session.maxScore) * 100;
    return {
      passed: percentage >= LEVEL_THRESHOLD[session.level],
      percentage,
    };
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
    return {
      payload,
      signature: this.sign(payload),
    };
  }

  verifyCertificate(certificate: SignedCertificate): boolean {
    return certificate.signature === this.sign(certificate.payload);
  }

  private sign(payload: CertificatePayload): string {
    return crypto.createHmac('sha256', this.secret).update(JSON.stringify(payload)).digest('hex');
  }
}

