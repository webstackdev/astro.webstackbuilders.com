import type { VercelServerlessConfig } from '@astrojs/vercel'

export const vercelConfig: VercelServerlessConfig = {
  /** Whether to use Vercel's image service */
  //imageService: true,
  /** Image service used to optimize images in dev environment */
  //devImageService: "sharp",
  //imagesConfig: {
  /**
   * Supported image widths.
   */
  //sizes: number[];
  /**
   * Allowed external domains that can use Image Optimization. Set to `[]` to only allow the deployment domain to use Image Optimization.
   */
  //domains?: string[];
  /**
   * Allowed external patterns that can use Image Optimization. Similar to `domains` but provides more control with RegExp.
   */
  //remotePatterns?: RemotePattern[];
  /**
   * Cache duration (in seconds) for the optimized images.
   */
  //minimumCacheTTL?: number;
  /**
   * Supported output image formats
   */
  //formats?: ImageFormat[];
  /**
   * Allow SVG input image URLs. This is disabled by default for security purposes.
   */
  //dangerouslyAllowSVG?: boolean;
  /**
   * Change the [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) of the optimized images.
   */
  //contentSecurityPolicy?: string;
  //},
  /** Maximum time in seconds that Lambda functions can run */
  maxDuration: 30,
  /** Whether to use Vercel's web analytics features */
  //webAnalytics: {
  //  enabled: true,
  //},
}
