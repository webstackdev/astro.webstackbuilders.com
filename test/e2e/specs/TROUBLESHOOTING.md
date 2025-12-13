# Troubleshooting Flakiness with E2E Test Suite

What failed

Only 1 test failed: [Mobile Chrome] Theme Picker Component › View Transitions - Regression › theme preference persists across View Transitions

Failure point: BasePage.waitForPageLoad() timed out waiting for window.__astroPageLoadCounter to increment (15s), called from navigateWithMobileSupport() after basePage.navigateToPage(href).
What the error context shows

At timeout, the page is still the homepage, and the theme picker is still open (toggle theme switcher is expanded; modal content "Select theme" is present).

That implies the "navigate to another page" click did not actually result in a View Transitions navigation (or any navigation) in this run.

Most likely cause (based on code + why it's Mobile-only)

This test is the only one that tries to navigate while the theme picker is open.

On Mobile, navigateWithMobileSupport() opens the hamburger menu first, then clicks the nav link.

With the theme picker open, something is intermittently preventing the nav link click from triggering navigation (overlay stacking / pointer interception / event handler preventing default without completing navigation). Result: URL doesn't change, __astroPageLoadCounter doesn't increment, and waitForPageLoad() times out.

Minimal fix directions (pick the intended behavior)

If "modal stays open across navigation" is a real requirement on mobile:

Fix the UI layering/event handling so nav link clicks still trigger View Transitions even when the theme picker is open.

If that requirement isn't meaningful on mobile (or it's acceptable to close it before navigating):
Adjust the test to close t

If you want, I can rerun just this one failing test in Mobile Chrome with tracing (--trace on) to confirm whether the nav click is being intercepted vs navigation starting but not firing the counter—still without making any code changes.
