import { describe, it, expect } from 'vitest';
import pino from 'pino';
import { logger, createCorrelationId, redactionPaths } from './logger';

describe('Observability Logger', () => {
  it('should redact sensitive information', () => {
    let loggedObj: any;
    const stream = {
      write: (msg: string) => {
        loggedObj = JSON.parse(msg);
      }
    };
    
    const testLogger = pino({
      level: 'info',
      redact: { paths: redactionPaths, censor: '[REDACTED]' }
    }, stream);
    
    testLogger.info({
      message: 'User login',
      aadhar_number: '1234-5678-9012',
      password: 'supersecretpassword',
      normal_field: 'safe'
    });
    
    expect(loggedObj.aadhar_number).toBe('[REDACTED]');
    expect(loggedObj.password).toBe('[REDACTED]');
    expect(loggedObj.normal_field).toBe('safe');
  });

  it('should generate a correlation id', () => {
    const id = createCorrelationId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
