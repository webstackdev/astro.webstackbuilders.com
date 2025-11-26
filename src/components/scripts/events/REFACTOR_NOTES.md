# Refactor notes for animation play / pause system

## Affected components

The following components need to pause and resume their animations based on external events:

- Animations/Computers
- Carousel
- Testimonials

The following components need to send pause and resume events to animations:

- Navigation (on mobile, when the splash screen opens and closes)

## Requirements

1. We need to refactor from the existing events system for start / pause / resume animations, to a persistent store file that can be subscribed to. It should be named components/scripts/store/animationLifecycle.ts

2. Each component that has animation should have the ability to pause and resume within the component. For example, I want to be able to add a pause / play button in the Animations/Computers component after this refactor is done.

3. No component with animations will have persistent transition across pages using Astro's View Transitions API. They will always be loaded and initiated on each page.

4. We need to check the prefers-reduced-motion value of the browser with something like window.matchMedia('(prefers-reduced-motion: reduce)') on initial page load. If the user doesn't want animations, we should not auto-start them. The user should be able to override this by pressing the "play" button on any given animation. We should subscribe to this event to respond if it changes:

```typescript
const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');

function handlePreferenceChange(event) {
  if (event.matches) {
    console.log('Reduced motion is enabled.');
    // Disable animations here
  } else {
    console.log('Reduced motion is disabled.');
    // Enable animations here
  }
}

// Add the listener
mediaQueryList.addEventListener('change', handlePreferenceChange);

// Call the handler once to set the initial state
handlePreferenceChange(mediaQueryList);
```

We need to coordinate this across astro page transitions, where normal DOM navigation events do not occur (https://docs.astro.build/en/guides/view-transitions/)

5. When the navigation mobile splash screen is expanded by the user clicking or touching the hamburger menu icon, all animations should stop for the duration of the mobile splash screen opening until it is closed again.

6. We want to persist the user's preference on the local "play" and "pause" buttons across page navigations, and also if they close the browser and reopen it and then then load a page. For example, if a user presses "pause" on the home screen Animations/Computers animation, we should assume that they still want it paused if they navigate within the site and come back to the home page, or if they close the site and eventually go to the home page again.
