# Zenith Roofing Website Standard

Apply this instruction to every file in this repository.

Before designing, rebuilding, or reviewing a page, read `docs/zenith-premium-design-system.md` completely. Treat it as the authoritative full-site visual and implementation standard.

## Non-negotiable rules

- Reuse `/css/zenith-premium-exact.css` for the shared brand foundation, header, navigation, buttons, footer, and permanent mobile dock.
- Use the current `/blog/`, `/financing/`, `/service-areas/`, and approved homepage implementations as visual references. Do not introduce a competing theme.
- Preserve existing URLs, forms, field names, form actions, validation, Netlify attributes, reCAPTCHA, analytics, conversion tracking, structured data, canonical tags, and internal links unless the task explicitly authorizes functional changes.
- Keep the complete desktop information architecture available on mobile through the menu. Keep persistent mobile access to Home, Call, Text, Estimate, and Menu.
- Use Zenith's approved navy, orange, white, mist, and restrained gold accents. Use real Zenith project photography when available.
- Design for property owners, property managers, HOAs, commercial clients, and real-estate professionals—not homeowners alone.
- Maintain accessible focus states, semantic headings, useful alternative text, touch targets of at least 44px, readable contrast, and reduced-motion support.
- Avoid placeholder content, fabricated reviews, fabricated credentials, invented service claims, stock-looking gimmicks, excessive animation, and unrelated visual styles.
- Validate every changed page at desktop and mobile widths. Confirm there is no horizontal overflow, broken imagery, duplicate IDs, console errors, or lost navigation.

Page-specific styles may extend the shared system in a dedicated stylesheet, but must not override the shared brand or navigation into a visibly different website.
