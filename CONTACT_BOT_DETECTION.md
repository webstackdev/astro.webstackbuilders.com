# Contact Form Bot Detection

We added a honey pot to the contact form - a hidden input field that a real user won't see, but a bot will automatically fill out when scanning the form's HTML.

If we still have issues:

https://www.cloudflare.com/application-services/products/turnstile/
https://cloud.google.com/security/products/recaptcha

## Quick Comparison

| Feature            | Google reCAPTCHA v3                                  | Cloudflare Turnstile                                |
| :----------------- | :--------------------------------------------------- | :-------------------------------------------------- |
| **User Friction**  | Totally invisible; never shows a puzzle.             | Mostly invisible; might show a small checkbox.      |
| **Privacy**        | High data collection (cookies, Google account data). | Privacy-focused; no cookies or cross-site tracking. |
| **Bot Detection**  | High accuracy via massive Google dataset.            | Emerging; may struggle with very advanced bots.     |
| **Free Tier**      | Up to **10,000 checks/month**.                       | **Unlimited** checks on the free tier.              |
| **Implementation** | Returns a 0.0–1.0 score; you decide what to block.   | Simple Pass/Fail token verification.                |

### Google reCAPTCHA v3

reCAPTCHA v3 is "invisible" because it doesn't interrupt the user. Instead, it monitors behavior (mouse movements, clicks) to give you a **risk score** from 0.0 (bot) to 1.0 (human).

- **Pros**:
  - **Proven Accuracy**: Leverages Google's vast intelligence to identify sophisticated bots.
  - **Granular Control**: You can set different "strictness" levels for different actions (e.g., a login vs. a contact form).
- **Cons**:
  - **Privacy Concerns**: It tracks users across the web using Google cookies, which often requires a [GDPR consent banner](https://friendlycaptcha.com/insights/recaptcha-v3/) in the EU.
  - **Limited Free Tier**: As of 2024, Google cut the free limit to 10k/month, which can be expensive if you get a sudden surge of bot traffic.

### Cloudflare Turnstile 

Turnstile is Cloudflare's privacy-first alternative. It uses "browser challenges" (like proof-of-work) that happen automatically in the background without needing a Google account.

- **Pros**:
  - **Privacy-Friendly**: Does not use tracking cookies and is designed for easy GDPR/CCPA compliance.
  - **Better Performance**: The script size is much smaller (~60 KB vs ~180 KB), which helps your site load faster.
  - **Truly Free**: There are no monthly limits on the number of assessments you can run.
- **Cons**:
  - **Detection Gaps**: Some research suggests it may only catch about 33% of sophisticated bots compared to reCAPTCHA's ~69%.
  - **VPN/Proxy Issues**: Because it relies on network signals, it may occasionally block legitimate users using VPNs or privacy browsers.
