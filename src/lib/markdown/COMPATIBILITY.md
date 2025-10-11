# Test Compatibility Issues

## Plugin Compatibility with Remark v15

During test implementation, we discovered that some plugins have compatibility issues with the standalone remark v15 setup used in our tests:

### ❌ Incompatible Plugins:

1. **remark-abbr** (v1.x)
   - **Issue**: Uses old remark API (`Parser.prototype.inlineTokenizers`)
   - **Error**: `Cannot read properties of undefined (reading 'prototype')`
   - **Cause**: Plugin written for remark v11/v12, not compatible with remark v15+ unified architecture
   - **Status**: Works in Astro (Astro handles compatibility), fails in standalone tests

2. **remark-attr** (v2.x)
   - **Issue**: Requires micromark parser attachment
   - **Error**: `Missing parser to attach 'remark-attr' [link] (to)`
   - **Cause**: Plugin expects micromark-based parser, our test setup doesn't provide it
   - **Status**: Works in Astro (Astro provides micromark), fails in standalone tests

### ✅ Compatible Plugins:

Working plugins that pass all tests:
- remark-attribution (custom plugin - 17/17 tests passing)
- remark-breaks
- remark-emoji
- remark-linkify-regex
- remark-toc
- rehype-accessible-emojis
- rehype-autolink-headings
- rehype-tailwind-classes

## Solutions

### Option 1: Skip Testing Incompatible Plugins ⭐ RECOMMENDED
- Continue with the 8 working plugins
- Document the 2 incompatible plugins
- They work fine in Astro's environment (proven by production use)
- Testing them would require duplicating Astro's internal parser setup

### Option 2: Update Dependencies
- Replace `remark-abbr` with `remark-abbr-plus` or similar modern alternative
- Replace `remark-attr` with `remark-directive` + custom directives
- This would be a breaking change to the markdown pipeline

### Option 3: Mock Astro's Environment
- Try to replicate Astro's exact internal parser configuration
- Very complex and fragile
- Not recommended

## Recommendation

**Use Option 1**: Skip testing `remark-abbr` and `remark-attr` in our test suite.

**Rationale**:
1. Both plugins work correctly in production (Astro handles compatibility)
2. Testing requires replicating Astro's complex internal setup
3. We have comprehensive tests for the other 8 plugins
4. The 4-layer strategy still provides value with partial coverage
5. Layer 4 (E2E) will test these plugins in the actual Astro environment

**Action Items**:
- ✅ Document compatibility issues
- ✅ Continue implementation with 8 compatible plugins
- ⏳ Add notes to README.md about limitations
- ⏳ Consider E2E tests for full pipeline validation including these plugins
