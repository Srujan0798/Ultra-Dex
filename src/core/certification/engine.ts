import crypto from 'crypto';
import { certificateManager, SignedCertificate, CertificationLevel } from './certificate.js';

export interface AssessmentSession {
  id: string;
  level: CertificationLevel;
  startedAt: number;
  expiresAt: number;
  score: number;
  maxScore: number;
}

const LEVEL_THRESHOLD: Record<CertificationLevel, number> = {
  practitioner: 70,
  architect: 75,
  expert: 80,
};

export class CertificationEngine {
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
    return certificateManager.generateCertificate(candidateId, level, percentage);
  }

  verifyCertificate(certificate: SignedCertificate): boolean {
    return certificateManager.verifyCertificate(certificate);
  }
}
