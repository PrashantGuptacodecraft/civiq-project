/**
 * Result of an integration sync operation
 */
export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  newCursor?: string;
  errorDetails?: Record<string, any>;
}

/**
 * Interface that all external integration adapters must implement.
 */
export interface IntegrationAdapter {
  /**
   * Identifies the provider/adapter.
   */
  providerName: string;

  /**
   * Synchronize data from the external source starting from an optional cursor.
   */
  sync(cursor?: string | null): Promise<SyncResult>;

  /**
   * Verify if an entity in the remote system is valid or still exists.
   */
  verify(externalId: string): Promise<boolean>;
}
