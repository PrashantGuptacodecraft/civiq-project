/**
 * Placeholder for the background job processing evidence files.
 * In a future phase, this worker will consume messages from BullMQ / SQS
 * to asynchronously compute expensive operations like perceptual hashes (pHash)
 * without blocking the main API HTTP request loop.
 */

export class EvidenceProcessorJob {
  async process(jobData: { evidenceId: string; storageKey: string }) {
    console.log(`[EvidenceProcessor] Starting async extraction for ${jobData.evidenceId}`);
    
    // 1. Fetch from S3/blob storage using jobData.storageKey
    // 2. Run heavy pHash generation via C++ bindings or sharp
    // 3. Update DB IssueEvidence perceptualHash field
    // 4. Trigger spatial/visual duplicate alert if needed
    
    console.log(`[EvidenceProcessor] Completed async extraction for ${jobData.evidenceId}`);
  }
}
