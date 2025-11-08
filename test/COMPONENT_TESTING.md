# Differentiating What to Test in Unit and E2E Test Cases

When testing Web Components with both unit tests and Playwright E2E tests, there should be a clear distinction in focus.

## Unit Tests (for Web Components):

Unit tests should focus on the isolated functionality of each Web Component, ensuring its internal logic and behavior are correct. Key areas to test include:

- **Property and Attribute Handling:** Verify that properties and attributes are correctly set, reflected, and updated within the component. This includes default values, type conversions, and reactivity.
- **Event Emission and Handling:** Test that the component correctly dispatches custom events and that any internal event listeners function as expected.
- **Shadow DOM Interaction:** If using Shadow DOM, ensure that elements within the Shadow DOM are correctly rendered, styled, and interact as intended.
- **Method Logic:** Test the individual methods of the component, ensuring they perform their specific tasks correctly and return expected outputs.
- **State Management:** If the component manages its own internal state, test that state changes are handled correctly and trigger appropriate updates.
- **Lifecycle Hooks:** Verify that lifecycle callbacks (e.g., connectedCallback, disconnectedCallback, attributeChangedCallback) are invoked at the correct times and perform their intended actions.

## E2E Tests (with Playwright):

Playwright E2E tests should focus on the overall user experience and how the Web Components interact within the larger application context. This includes:

- **User Flows:** Test critical user journeys and interactions involving multiple components, such as form submissions, navigation, and data display.
- **Component Integration:** Verify that different Web Components interact correctly with each other and with external services or APIs.
- **Visual Regression:** Ensure that the components render correctly and consistently across different browsers and viewports.
- **Accessibility:** Test for accessibility compliance, ensuring that components are usable by individuals with disabilities.
- **Performance:** Monitor loading times and responsiveness of the application and its components.
- **Data Persistence:** If applicable, verify that data is correctly stored and retrieved across sessions or interactions.

By clearly separating the concerns, unit tests provide granular feedback on individual component correctness, while E2E tests validate the end-to-end user experience and overall system integration.
