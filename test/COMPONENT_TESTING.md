# Differentiating What to Test in Unit and E2E Test Cases

This document outlines the testing strategy for Web Components in this project, distinguishing between unit tests (isolated component logic) and E2E tests (integrated user experience). Following this separation ensures comprehensive coverage while avoiding redundant testing.

## Testing Tools

- **Unit Tests:** Vitest with Astro Container API
- **E2E Tests:** Playwright

## Unit Tests (for Web Components)

Unit tests should focus on the isolated functionality of each Web Component, ensuring its internal logic and behavior are correct. Key areas to test include:

- **Component Isolation:** Test components in isolation from external dependencies. Use mocks, stubs, or test doubles for external services, APIs, global state, or other components. This ensures tests are fast, deterministic, and only fail when the component itself has issues, not due to external factors.
- **Property and Attribute Handling:** Verify that properties and attributes are correctly set, reflected, and updated within the component. This includes default values, type conversions, and reactivity.
- **Event Emission and Handling:** Test that the component correctly dispatches custom events and that any internal event listeners function as expected.
- **Method Logic:** Test the individual methods of the component, ensuring they perform their specific tasks correctly and return expected outputs.
- **State Management:** If the component manages its own internal state, test that state changes are handled correctly and trigger appropriate updates.
- **Lifecycle Hooks:** Verify that lifecycle callbacks (e.g., connectedCallback, disconnectedCallback, attributeChangedCallback) are invoked at the correct times and perform their intended actions.
- **Edge Cases and Error Handling:** Test boundary conditions, invalid inputs, null/undefined values, and error states to ensure robust component behavior. Examples include empty strings, negative numbers, maximum length inputs, missing required attributes, and network failures.

## E2E Tests (with Playwright)

Playwright E2E tests should focus on the overall user experience and how the Web Components interact within the larger application context. This includes:

- **User Flows:** Test critical user journeys and interactions involving multiple components, such as form submissions, navigation, and data display.
- **Component Integration:** Verify that different Web Components interact correctly with each other and with external services or APIs.
- **Visual Regression:** Ensure that the components render correctly and consistently across different browsers and viewports.
- **Cross-Browser Compatibility:** Verify consistent behavior across different browsers (Chromium, Firefox, WebKit) and browser versions, catching browser-specific quirks or rendering differences.
- **Accessibility:** Test for accessibility compliance, ensuring that components are usable by individuals with disabilities.
- **Performance:** Monitor loading times and responsiveness of the application and its components.
- **Data Persistence:** Verify that localStorage/sessionStorage maintains data across page reloads, form inputs persist when expected, and state management works correctly across View Transitions. For Astro applications, also verify that session data survives client-side navigation.
- **View Transitions Persistence:** For components using Astro's transition:persist directive, verify that DOM identity is maintained across page navigations. This includes testing that event listeners survive navigation, custom properties remain attached to the element, and internal component state persists without re-initialization.

By clearly separating the concerns, unit tests provide granular feedback on individual component correctness, while E2E tests validate the end-to-end user experience and overall system integration.
