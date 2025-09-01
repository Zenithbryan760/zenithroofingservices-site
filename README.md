# Hero + Lead-Capture Form Component

## File structure
- `components/hero-section.html` — Hero video + form HTML
- `css/hero.css`             — Combined video, card, and form styles
- `js/hero.js`               — Vanilla JS: phone formatting, autocomplete, honeypot, fetch submission
- `index.html`               — Fetches & injects `hero-section.html`

## Integration
1. Link `css/hero.css` in your `<head>` **after** header/base CSS.  
2. Include `<div id="hero-placeholder"></div>` where the hero goes.  
3. Load the component:
   ```html
   <script>
     fetch('components/hero-section.html')
       .then(r => r.text())
       .then(html => document.getElementById('hero-placeholder').innerHTML = html);
   </script>

