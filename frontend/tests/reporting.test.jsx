import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmergencyBanner, VerificationNotice, CategorySelector, LocationPicker, UploadZone, CitizenReportForm, } from '../features/reporting/index.js';
import { CIVIC_ISSUE_TAXONOMY_V1 } from '@civiq/contracts';
describe('Citizen Reporting UI Components', () => {
    describe('EmergencyBanner', () => {
        it('renders emergency notice with life-safety instructions', () => {
            const html = renderToStaticMarkup(<EmergencyBanner />);
            expect(html).toContain('Is this a life-threatening emergency?');
            expect(html).toContain('CivIQ is an asynchronous municipal triage platform');
        });
        it('provides high-visibility one-touch 112 emergency phone link', () => {
            const html = renderToStaticMarkup(<EmergencyBanner />);
            expect(html).toContain('href="tel:112"');
            expect(html).toContain('Call 112');
        });
    });
    describe('VerificationNotice', () => {
        it('sets clear verification expectations with a 3-step pipeline', () => {
            const html = renderToStaticMarkup(<VerificationNotice />);
            expect(html).toContain('What happens after you submit?');
            expect(html).toContain('Intake &amp; Deduplication');
            expect(html).toContain('Officer Review');
            expect(html).toContain('Resolution &amp; Proof');
        });
    });
    describe('CategorySelector', () => {
        it('renders all civic service groups from the versioned taxonomy', () => {
            const html = renderToStaticMarkup(<CategorySelector selectedCategoryId="roads_pothole" onSelectCategory={() => { }}/>);
            for (const group of CIVIC_ISSUE_TAXONOMY_V1.groups) {
                const expectedHtmlName = group.name.replace(/&/g, '&amp;');
                expect(html).toContain(expectedHtmlName);
            }
        });
        it('renders category cards with SLA turnaround and severity badges', () => {
            const html = renderToStaticMarkup(<CategorySelector selectedCategoryId="roads_pothole" onSelectCategory={() => { }}/>);
            expect(html).toContain('Pothole');
            expect(html).toContain('SLA: 7 days');
            expect(html).toContain('MEDIUM');
        });
        it('displays validation error message when provided', () => {
            const html = renderToStaticMarkup(<CategorySelector selectedCategoryId="" onSelectCategory={() => { }} errorMessage="Please select an issue category."/>);
            expect(html).toContain('Please select an issue category.');
        });
    });
    describe('LocationPicker', () => {
        it('renders jurisdiction select options with municipal authorities', () => {
            const html = renderToStaticMarkup(<LocationPicker location={{
                    address: '123 MG Road',
                    jurisdictionId: 'mh-pune',
                    state: 'Maharashtra',
                    district: 'Pune',
                    city: 'Pune',
                    latitude: 18.5204,
                    longitude: 73.8567,
                }} onChange={() => { }}/>);
            expect(html).toContain('Pune Municipal Corporation (PMC)');
            expect(html).toContain('Brihanmumbai Municipal Corporation (BMC)');
            expect(html).toContain('123 MG Road');
            expect(html).toContain('Lat: 18.5204');
            expect(html).toContain('Lng: 73.8567');
        });
        it('renders validation error when address is invalid', () => {
            const html = renderToStaticMarkup(<LocationPicker location={{
                    address: '',
                    jurisdictionId: '',
                    state: '',
                    district: '',
                    city: '',
                    latitude: null,
                    longitude: null,
                }} onChange={() => { }} errors={{
                    address: 'Address is required.',
                    jurisdictionId: 'Authority is required.',
                }}/>);
            expect(html).toContain('Address is required.');
            expect(html).toContain('Authority is required.');
        });
    });
    describe('UploadZone', () => {
        it('renders file intake upload button with accepted formats', () => {
            const html = renderToStaticMarkup(<UploadZone files={[]} onAddFiles={() => { }} onRemoveFile={() => { }}/>);
            expect(html).toContain('Attach Photos / Evidence');
            expect(html).toContain('Tap to take photo or upload');
            expect(html).toContain('PNG, JPG, or WebP up to 10MB');
        });
        it('displays file preview slots when files are attached', () => {
            const mockFiles = [
                { name: 'pothole-evidence-1.jpg', size: 1024 * 500, type: 'image/jpeg' },
            ];
            const html = renderToStaticMarkup(<UploadZone files={mockFiles} onAddFiles={() => { }} onRemoveFile={() => { }}/>);
            expect(html).toContain('pothole-evidence-1.jpg');
            expect(html).toContain('1 / 3 photos');
        });
    });
    describe('CitizenReportForm Integration', () => {
        it('renders full mobile-first form with header, actions, and sections', () => {
            const html = renderToStaticMarkup(<CitizenReportForm />);
            expect(html).toContain('Report a Civic Issue');
            expect(html).toContain('Is this a life-threatening emergency?');
            expect(html).toContain('What happens after you submit?');
            expect(html).toContain('Detailed Description');
            expect(html).toContain('Submit Report for Verification');
            expect(html).toContain('Discard');
        });
    });
});
