/**
 * In general, we want to use the Page Visibility API to stop unnecessary processes
 * when the user doesn't see the page or, on the other hand, to perform background
 * actions. Some specific cases can be: to pause videos, image carousels, or animations
 * when the user leaves the page;
 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // page is visible
  } else {
    // page is hidden:
    // @TODO: 1. Does the GreenSocks animation stop on visibility change?
  }
})
