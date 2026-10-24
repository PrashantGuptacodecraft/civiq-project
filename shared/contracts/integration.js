/**
 * Result of an integration sync operation
 */
export interface SyncResult {
  success;
  recordsProcessed;
  newCursor?;
  errorDetails?, any>;
}

/**
 * Interface that all external integration adapters must implement.
 */
export interface IntegrationAdapter {
  /**
   * Identifies the provider/adapter.
   */
  providerName;

  /**
   * Synchronize data from the external source starting from an optional cursor.
   */
  sync(cursor?);

  /**
   * Verify if an entity in the remote system is valid or still exists.
   */
  verify(externalId);
}