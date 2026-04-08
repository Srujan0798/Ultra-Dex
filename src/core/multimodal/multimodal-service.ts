export class MultimodalService {
  async process(input: { type: string; content: string }): Promise<string> {
    return `Processed ${input.type}: ${input.content}`;
  }
}
export const multimodalService = new MultimodalService();
