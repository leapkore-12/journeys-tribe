

## Update Splash Screen with Login & Sign Up Buttons

### Current behavior
The splash screen shows the logo with a loading animation, then auto-navigates to `/login` after 2.5 seconds.

### New behavior
- Show the logo animation as before
- Remove the auto-navigate timer and loading dots
- After the logo animates in, fade in two buttons: "Login" and "Sign Up"
- Use the logo-white-tagline SVG (same as login/signup pages) for brand consistency
- Buttons styled: Login as primary filled, Sign Up as outline variant

### Changes

**`src/pages/Splash.tsx`** — Replace auto-nav with buttons
- Remove the `navTimer` and loading dots
- Add `showButtons` state triggered ~1.2s after logo appears
- Render two animated buttons: "Login" → `/login`, "Sign Up" → `/signup`
- Switch to `logo-white-tagline.svg` for consistency
- Layout: logo centered with buttons below, full-width max-w-sm

