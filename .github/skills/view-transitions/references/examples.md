# View Transitions references

Use these files as the baseline examples for Astro View Transitions behavior in this repo:

- `test/e2e/helpers/pageObjectModels/BasePage.ts`
- `test/e2e/specs/04-components/theme-picker.spec.ts`
- `test/e2e/specs/09-persistence/themepicker.spec.ts`
- `test/e2e/specs/09-persistence/footer.spec.ts`
- `src/components/ThemePicker/index.astro`
- `src/components/Footer/index.astro`

Key patterns already established here:

- `navigateToPage()` for client-side navigation
- `waitForPageLoad()` for `astro:page-load` synchronization
- `transition:persist` applied to actual rendered elements
