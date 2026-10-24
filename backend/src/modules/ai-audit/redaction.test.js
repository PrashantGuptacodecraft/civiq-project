import { describe, it, expect } from 'vitest';
import { redactPiiString, redactPiiAndSecrets } from './redaction.js';
describe('PII and Secrets Redaction', () => {
    describe('redactPiiString', () => {
        it('redacts formatted and raw 12-digit Aadhaar numbers', () => {
            const text1 = 'Citizen Aadhaar is 5432 1098 7654 for verification.';
            expect(redactPiiString(text1)).toBe('Citizen Aadhaar is [REDACTED_AADHAAR] for verification.');
            const text2 = 'Raw id 987654321098 provided at desk.';
            expect(redactPiiString(text2)).toBe('Raw id [REDACTED_AADHAAR] provided at desk.');
            const text3 = 'Hyphenated Aadhaar: 3210-9876-5432.';
            expect(redactPiiString(text3)).toBe('Hyphenated Aadhaar: [REDACTED_AADHAAR].');
        });
        it('redacts PAN card numbers', () => {
            const text = 'Tax PAN reference ABCDE1234F submitted with report.';
            expect(redactPiiString(text)).toBe('Tax PAN reference [REDACTED_PAN] submitted with report.');
        });
        it('redacts phone numbers across Indian and international formats', () => {
            const text1 = 'Call complainant on +91 9876543210 immediately.';
            expect(redactPiiString(text1)).toBe('Call complainant on [REDACTED_PHONE] immediately.');
            const text2 = 'Direct mobile: 8765432109 or +91-9123456780.';
            expect(redactPiiString(text2)).toBe('Direct mobile: [REDACTED_PHONE] or [REDACTED_PHONE].');
        });
        it('redacts email addresses', () => {
            const text = 'Forward civic alert to user.name@domain.gov.in and test+alias@gmail.com.';
            expect(redactPiiString(text)).toBe('Forward civic alert to [REDACTED_EMAIL] and [REDACTED_EMAIL].');
        });
        it('redacts 16-digit payment card numbers', () => {
            const text = 'Refund fee to card 4111 2222 3333 4444 on file.';
            expect(redactPiiString(text)).toBe('Refund fee to card [REDACTED_FINANCIAL] on file.');
        });
        it('leaves clean non-PII civic descriptions intact', () => {
            const text = 'Large pothole on 80 Feet Road near Metro Pillar 45 outside Park Gate.';
            expect(redactPiiString(text)).toBe(text);
        });
    });
    describe('redactPiiAndSecrets', () => {
        it('completely redacts values of blacklisted secret keys', () => {
            const input = {
                title: 'Water pipe leak',
                password: 'SuperSecretPassword123!',
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                apiKey: 'sk_live_998877665544332211',
                otp: '654321',
            };
            const redacted = redactPiiAndSecrets(input);
            expect(redacted.title).toBe('Water pipe leak');
            expect(redacted.password).toBe('[REDACTED_SECRET]');
            expect(redacted.token).toBe('[REDACTED_SECRET]');
            expect(redacted.apiKey).toBe('[REDACTED_SECRET]');
            expect(redacted.otp).toBe('[REDACTED_SECRET]');
        });
        it('deeply traverses nested objects and arrays redacting PII patterns', () => {
            const payload = {
                issueId: 'iss-999',
                reporter: {
                    fullName: 'Ramesh Kumar',
                    contact: {
                        email: 'ramesh.k@example.com',
                        phone: '+91 9988776655',
                        identityProof: 'Aadhaar 4532 9876 1234 and PAN BKZPK1234M',
                    },
                    auth: {
                        accessToken: 'secret_jwt_bearer_token',
                    },
                },
                comments: [
                    'First reported by ramesh.k@example.com on 9876543210',
                    'Followed up with municipal ward officer',
                ],
            };
            const redacted = redactPiiAndSecrets(payload);
            expect(redacted.reporter.contact.email).toBe('[REDACTED_EMAIL]');
            expect(redacted.reporter.contact.phone).toBe('[REDACTED_PHONE]');
            expect(redacted.reporter.contact.identityProof).toBe('Aadhaar [REDACTED_AADHAAR] and PAN [REDACTED_PAN]');
            expect(redacted.reporter.auth.accessToken).toBe('[REDACTED_SECRET]');
            expect(redacted.comments[0]).toBe('First reported by [REDACTED_EMAIL] on [REDACTED_PHONE]');
            expect(redacted.comments[1]).toBe('Followed up with municipal ward officer');
        });
        it('handles null, undefined, numbers, and booleans safely', () => {
            expect(redactPiiAndSecrets(null)).toBeNull();
            expect(redactPiiAndSecrets(undefined)).toBeUndefined();
            expect(redactPiiAndSecrets(42)).toBe(42);
            expect(redactPiiAndSecrets(true)).toBe(true);
        });
    });
});
