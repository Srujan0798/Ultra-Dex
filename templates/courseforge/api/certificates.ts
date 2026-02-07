import { prisma } from '../lib/prisma';
import { generateCertificate } from '../progress-tracker';

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
