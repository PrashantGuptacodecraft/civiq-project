# CivIQ Mobile PWA Specification

This document defines the Progressive Web App (PWA) and mobile requirements for the CivIQ platform. Any future coding agents implementing mobile features or PWA functionality MUST adhere to these specifications.

## 1. Progressive Web App Requirements

- **Web App Manifest**: Must include CivIQ branding, icons, and configuration for standalone display.
- **Service Worker**: Must be implemented for offline caching of core application shells and critical assets.
- **App-like Experience**: The application must behave like a native application when installed on a device.
- **Add-to-Homescreen Prompt**: Prompt users to add the application to their homescreen.
- **Splash Screen**: Display a branded splash screen during application load.
- **Theme Color**: Must match the primary brand color of CivIQ in the manifest and meta tags.

## 2. Offline Capabilities

- **Cache Strategy**: Cache the application shell and static assets for fast initial load.
- **Data Caching**: Cache recently viewed data to allow read-only access while offline.
- **Background Sync**: Queue mutations (e.g., submitting a report) when offline and synchronize in the background when connectivity is restored.
- **Offline Indicator**: Clearly display an offline indicator to the user when no network connection is available.
- **Graceful Degradation**: Show cached data along with a banner indicating offline status. Do not show generic browser offline pages.

## 3. Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s on a 4G connection.
- **Largest Contentful Paint (LCP)**: < 2.5s on a 4G connection.
- **Time to Interactive (TTI)**: < 3.5s on a 4G connection.
- **Cumulative Layout Shift (CLS)**: < 0.1.
- **Lighthouse Scores**:
  - Target Lighthouse PWA score: 90+
  - Target Lighthouse Performance score: 85+

## 4. Mobile-Specific Features

- **Camera API**: Utilize the device camera for evidence capture in reports.
- **Geolocation API**: Use geolocation for accurate location detection of civic issues.
- **Push Notifications**: Support push notifications for critical updates and emergency alerts.
- **Background Sync**: Support background sync for offline mutations.
- **Share API**: Implement the native Share API for sharing reports or incidents.

## 5. Device Support

- **Android**: Android 10+ using Google Chrome.
- **iOS**: iOS 15+ using Safari.
- **Responsive Design**: Must be responsive across all target viewports (mobile, tablet, desktop).

## 6. Installation

- **Prompt Strategy**: Prompt installation on the second visit to avoid overwhelming first-time users.
- **Custom Banner**: Use a custom install banner rather than relying solely on the default browser prompt.
- **Display Mode**: Run in full-screen mode when installed to provide an immersive app experience.

## 7. Updates

- **Update Strategy**: Define a clear service worker update strategy.
- **User Notification**: Notify the user when a new version of the application is available.
- **Apply Updates**: Apply updates on the next launch, never interrupting an active user session.
