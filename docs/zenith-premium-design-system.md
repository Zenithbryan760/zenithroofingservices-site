# Zenith Roofing Premium Design System

This is the authoritative design and implementation standard for the full Zenith Roofing Services website. It applies to the homepage, service pages, projects, reviews, service areas, financing, company pages, resources, contact and legal pages, plus all future pages.

## 1. Design promise

Every page must immediately feel like the same high-end local roofing company: established, technically knowledgeable, transparent, responsive and easy to contact. The experience should be clean, image-led, trustworthy and conversion-focused without feeling loud or generic.

Use these approved pages as the closest visual references:

1. `/blog/` for editorial/resource pages, premium cards and knowledge-led storytelling.
2. `/financing/` for process, disclosure and decision-support pages.
3. `/service-areas/` for geographic and local-authority pages.
4. The approved homepage for the broad brand, navigation and lead-generation experience.

## 2. Source of truth

- Shared foundation: `/css/zenith-premium-exact.css`
- Shared behavior: `/js/zenith-premium-exact.js`
- Brand logo: use the existing Zenith transparent logo asset already used by the premium header and footer.
- Page-specific CSS: add one scoped stylesheet only when the shared system cannot express the page.

Do not fork the header, footer, mobile dock or brand tokens into a new theme. Improve the shared source when a truly global change is required.

## 3. Brand tokens

Use the variables already defined in `/css/zenith-premium-exact.css`:

| Role | Token | Value |
| --- | --- | --- |
| Deep navy | `--navy-950` | `#031a30` |
| Primary navy | `--navy-900` | `#06294b` |
| Mid navy | `--navy-800` | `#0b3f70` |
| Supporting blue | `--blue-500` | `#2a83c4` |
| Brand orange | `--orange-500` | `#ff8200` |
| Deep orange | `--orange-600` | `#ed6a00` |
| Soft orange | `--orange-100` | `#fff0df` |
| Primary ink | `--ink-950` | `#0b1725` |
| Secondary ink | `--ink-700` | `#3c4c60` |
| Muted ink | `--ink-500` | `#657386` |
| Mist background | `--mist` | `#f4f7fa` |

Use gradients with restraint: deep navy for authority sections and orange for primary actions. Gold is a small premium accent, not a replacement brand color. Avoid neon colors, purple gradients and competing blues.

## 4. Typography and layout

- Font stack: `"Avenir Next", "Manrope", "Segoe UI", Helvetica, Arial, sans-serif`.
- Use bold, compact headings with comfortable body copy.
- Keep body text readable at approximately 16–19px with generous line height.
- Use `.shell` for the standard maximum content width.
- Prefer clear section rhythm, strong whitespace and alternating light/dark sections.
- Use one `h1`; keep heading levels sequential.
- Avoid dense walls of text. Break technical content into short explanations, proof points, cards, steps and FAQs.

## 5. Shared site chrome

Every primary page must include:

- Skip link.
- Licensing/trust strip where appropriate.
- Sticky premium desktop header.
- Complete desktop navigation: Home, Services, Projects, Reviews, Service Areas, Financing, About and Resources.
- Clearly visible phone number and Free Estimate action.
- Mobile menu containing the same destinations as desktop.
- Permanent mobile dock with Home, Call, Text, Estimate and Menu.
- Premium full footer with services, company links, contact information, license information and legal links.

Do not make mobile users scroll to the top to reach primary navigation or contact actions.

## 6. Page composition

Most pages should follow this sequence, adapted to the content rather than copied mechanically:

1. Image-led hero with one clear promise, supporting explanation and primary action.
2. Trust or proof bar using verified facts only.
3. Main educational/service content organized around the visitor's decision.
4. Real project photography and practical field knowledge.
5. Process, options, comparisons or service coverage.
6. Verified reviews or proof when relevant.
7. FAQs addressing actual objections and search intent.
8. Strong final CTA with Call and Free Estimate paths.
9. Shared footer and mobile dock.

Lead with usefulness. Calls to action should feel like the logical next step, not interruptions.

## 7. Components and interaction

- Use the shared `.button` variants. Primary actions use the orange gradient; secondary actions use navy, glass or outlined treatments.
- Use 12–30px radii according to component size and the shared shadow tokens.
- Cards should have clean borders, restrained shadows and subtle lift or border-color changes on hover.
- Keep hover movement small, typically 2–6px. Use the shared easing curve.
- Provide visible keyboard focus states.
- Respect `prefers-reduced-motion` and never make content dependent on animation.
- Avoid carousels unless the content truly needs them; stable grids are easier to scan and more reliable on mobile.

## 8. Photography and icons

- Prefer real Zenith jobsite, crew, roof-detail and completed-project photography from the repository.
- Match imagery to the exact service or lesson being discussed.
- Use descriptive alternative text that explains the visible roofing subject without keyword stuffing.
- Optimize images and include dimensions when practical to reduce layout shift.
- Use a consistent line-icon family. Do not mix cartoon, glossy 3D and unrelated icon styles.
- Never generate or present fabricated project evidence as real Zenith work.

## 9. Audience and voice

Write for property owners, homeowners, property managers, HOAs, commercial clients and real-estate professionals. Use Bryan and Zenith's real field experience in clear language.

Voice characteristics:

- Direct and professional.
- Educational rather than salesy.
- Honest about repair versus replacement.
- Specific about materials, failure points and inspection findings.
- Local to Southern California without stuffing city names.

Do not invent pricing, warranties, review counts, certifications, availability or technical claims. Confirm unstable facts before publishing.

## 10. Lead generation and SEO

- Give each page one primary search intent and one clear conversion goal.
- Preserve or improve the title, meta description, canonical URL, Open Graph data and appropriate JSON-LD.
- Retain useful existing copy and links; do not reduce a strong authority page to decorative marketing text.
- Connect related services, projects, service areas and resources with relevant internal links.
- Use descriptive link text instead of repeated “learn more.”
- Keep the phone and estimate actions prominent without repeating identical banners excessively.
- Use verified trust signals near decision points.

## 11. Functional protection contract

A design task does not authorize functional changes. Before editing, inventory and preserve:

- Form `action`, `method`, field `name` values and hidden inputs.
- Netlify form attributes, honeypots, reCAPTCHA and validation hooks.
- Phone, SMS, email and estimate destinations.
- Analytics, conversion scripts and event attributes.
- Canonical URLs, redirects and internal article/service URLs.
- Structured data and business identity.
- Existing JavaScript behavior required by forms, menus, galleries or tracking.

Restyling form controls is allowed. Rebuilding submission logic is not allowed unless expressly requested.

## 12. Responsive requirements

Design mobile-first and verify at minimum around 390px, 768px, 1024px and a wide desktop viewport.

- No horizontal scrolling.
- No clipped headings, buttons, navigation or form fields.
- Minimum 44px interactive targets.
- Mobile dock stays visible and does not cover the last content or form controls.
- Full desktop navigation remains reachable through the mobile menu.
- Cards stack in a deliberate order.
- Images retain useful focal points.
- Long phone numbers, emails and headings wrap safely.

## 13. Definition of done

Before publishing a page change:

- Compare it visually with the approved reference pages.
- Validate HTML and CSS syntax.
- Confirm every local image exists and loads.
- Check internal links and preserve established URLs.
- Check forms without submitting real customer data.
- Confirm no duplicate IDs or browser console errors.
- Inspect desktop and mobile rendering, including menu and mobile dock.
- Confirm accessible focus, headings, labels and alternative text.
- Verify metadata and JSON-LD parse correctly.
- Use a separate draft pull request and a deploy preview for substantial page redesigns.

If a page looks like a different company or a different theme, it is not finished.
