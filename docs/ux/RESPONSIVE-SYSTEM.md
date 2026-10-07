# CivIQ Responsive System

**🚨 MOBILE-FIRST GLOBAL RULE 🚨**
All features must be designed and implemented mobile-first. 
Primary targets: Android phones and iPhones.
Secondary targets: Tablets, laptops, desktops.

## 1. Target Viewport QA Sizes
All UIs must be QA tested against these resolutions:
- **320x800**: Small phone
- **360x800**: Standard Android
- **390x844**: iPhone 14/15
- **412x915**: Large Android
- **430x932**: iPhone Pro Max
- **768x1024**: iPad
- **1280x800**: Laptop
- **1440x900**: Desktop

## 2. Breakpoints (Tailwind Standards)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 3. Container System
- **Mobile**: Full-width with 16px horizontal padding.
- **Tablet**: `max-width: 720px`, horizontally centered.
- **Desktop**: `max-width: 1200px`, horizontally centered.
- **Wide Dashboard**: `max-width: 1440px`.

## 4. Layout Patterns
- **Stacking**: Columns must stack to a single column on mobile viewports.
- **Sidebar**: Visible on `lg` and above; hidden behind a drawer/hamburger menu on mobile.
- **Bottom Navigation**: Visible on mobile, hidden on `lg` and above.
- **Sticky Actions**: Bottom-fixed on mobile (easily reachable), inline with content on desktop.
- **Mobile Drawers**: Expand full-width from the bottom or right side.
- **Bottom Sheets**: Must include drag-to-dismiss functionality and logical snap points (e.g., 25%, 50%, 90%).

## 5. UI Elements Adaptability
- **Responsive Tables**: Transform standard tables into stacked card layouts on mobile. Traditional table presentation is reserved for desktop viewports.
- **Responsive Charts**: Simplified, high-level overview on mobile. Full details and controls on desktop. Tooltips must be touch-friendly on mobile devices.
- **Map Behavior**: Full-viewport maps on mobile with a bottom sheet for displaying details. Use side-panels for details on desktop.
- **Image Handling**: Serve responsive images (WebP/AVIF with fallbacks). Implement lazy loading globally.
- **Typography Scaling**: Use slightly larger touch targets and easily readable base text on mobile devices (min 16px body, min 44x44px touch targets).
- **Navigation Patterns**: Bottom nav for mobile, sidebars/top nav for desktop.
- **Form Layouts**: Strictly single column on mobile. Multi-column can be used on desktop where appropriate to save vertical space.
