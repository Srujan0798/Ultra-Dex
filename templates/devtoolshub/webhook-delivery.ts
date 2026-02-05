export async function deliverWebhook(url: string, payload: unknown) {
  return { url, status: 'queued', attempts: 0, payload };
}
