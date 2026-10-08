import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

export const redactionPaths = [
  'password',
  'token',
  'authorization',
  'cookie',
  'aadhar',
  'aadhar_number',
  'pan',
  'upi_id',
  '*.password'
];

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: redactionPaths,
    censor: '[REDACTED]'
  },
  formatters: {
    level: (label) => ({ level: label })
  }
});

export const createCorrelationId = (): string => {
  return uuidv4();
};
