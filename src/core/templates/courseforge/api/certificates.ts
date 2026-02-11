/**
 * @fileoverview Certificates module
 * @module api/certificates
 */

import { prisma } from '../lib/prisma';
import { generateCertificate } from '../lib/progress-tracker';

export async function issueCertificate(studentId: string, courseId: string) {
  return generateCertificate(studentId, courseId);
}

export async function getCertificate(certificateId: string) {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
  });

  if (!certificate) throw new Error('Certificate not found');

  return certificate;
}

export async function listCertificates(studentId: string) {
  return prisma.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: 'desc' },
  });
}

/**
 * Error handler for certificates
 * @param {Error} error - Error to handle
 */
function handleCertificatesError(error) {
  try {
    console.error('[certificates]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
