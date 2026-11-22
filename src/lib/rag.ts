interface Chunk {
  text: string;
  metadata?: Record<string, any>;
}

export class EmbeddingService {
  constructor() {}

  splitTextIntoChunks(text: string, chunkSize: number): string[] {}
}
