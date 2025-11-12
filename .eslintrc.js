import eslint from "@eslint/js"
import astroPlugin from "eslint-plugin-astro"
import importPlugin from "eslint-plugin-import"
import jsdocPlugin from "eslint-plugin-jsdoc"
import securityPlugin from "eslint-plugin-security"
import ymlPlugin from "eslint-plugin-yml"
import tsPlugin from "typescript-eslint"
import restrictedGlobals from "confusing-browser-globals"

// eslint-disable-next-line no-undef
const level = process.env["NODE_ENV"] === "production" ? "error" : "warn"

export default [
  eslint.configs.strict,
  ...tsPlugin.configs.strict,
  ...astroPlugin.configs.recommended,
  ...astroPlugin.configs['jsx-a11y-strict'],
  importPlugin.flatConfigs.recommended,
  jsdocPlugin.configs['flat/recommended-typescript'],
  securityPlugin.configs.recommended,
  ...ymlPlugin.configs['flat/recommended'],
  {
    rules: {
      /** eslint-plugin-comments */
      'eslint-comments/no-unused-disable': level,
    }
  }
]
