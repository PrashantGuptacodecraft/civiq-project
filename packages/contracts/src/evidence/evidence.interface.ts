export interface IImageHasher {
  /**
   * Generates a cryptographic hash (e.g. SHA-256) for exact match deduplication.
   */
  generateFileHash(buffer: Buffer): Promise<string>;

  /**
   * Generates a perceptual hash (e.g. pHash) for finding visually similar images,
   * resistant to slight cropping, resizing, or compression artifacts.
   */
  generatePerceptualHash(buffer: Buffer): Promise<string>;

  /**
   * Compares two perceptual hashes and returns a similarity score (0 to 1).
   * E.g. using Hamming distance.
   */
  comparePerceptualHashes(hashA: string, hashB: string): number;
}
