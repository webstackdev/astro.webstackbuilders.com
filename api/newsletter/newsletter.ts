// Vercel API function for ConvertKit newsletter subscription

// Types
interface NewsletterFormData {
  email: string;
  firstName?: string;
}

interface ConvertKitSubscriber {
  email_address: string;
  first_name?: string;
  state?: 'active' | 'inactive';
  fields?: Record<string, string>;
}

interface ConvertKitResponse {
  subscriber: {
    id: number;
    first_name: string | null;
    email_address: string;
    state: string;
    created_at: string;
    fields: Record<string, string>;
  };
}

interface ConvertKitErrorResponse {
  errors: string[];
}

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, number[]>();

/**
 * Check if the IP address has exceeded the rate limit
 * @param ip - Client IP address
 * @returns true if within rate limit, false if exceeded
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10; // More lenient for newsletter signups
  const key = `newsletter_rate_limit_${ip}`;
  const requests = rateLimitStore.get(key) || [];

  // Clean old requests
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

  if (validRequests.length >= maxRequests) {
    return false;
  }

  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return true;
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns Validated and normalized email address
 */
function validateEmail(email: string): string {
  if (!email) {
    throw new Error('Email address is required.');
  }

  // Email validation - same pattern as client-side
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Email address is invalid');
  }

  return email.trim().toLowerCase();
}

/**
 * Subscribe email to ConvertKit
 * @param data - Newsletter form data
 * @returns ConvertKit API response
 */
async function subscribeToConvertKit(data: NewsletterFormData): Promise<ConvertKitResponse> {
  const apiKey = process.env['CONVERTKIT_API_KEY'];

  if (!apiKey) {
    throw new Error('ConvertKit API key is not configured.');
  }

  /* eslint-disable camelcase */
  // ConvertKit API requires snake_case property names
  const subscriberData: ConvertKitSubscriber = {
    email_address: data.email,
    state: 'active',
  };

  // Add first name if provided
  if (data.firstName) {
    subscriberData.first_name = data.firstName.trim();
  }
  /* eslint-enable camelcase */

  try {
    const response = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': apiKey,
      },
      body: JSON.stringify(subscriberData),
    });

    const responseData = await response.json();

    // Handle different response codes
    if (response.status === 401) {
      const errorData = responseData as ConvertKitErrorResponse;
      console.error('ConvertKit API authentication failed:', errorData.errors);
      throw new Error('Newsletter service configuration error. Please contact support.');
    }

    if (response.status === 422) {
      const errorData = responseData as ConvertKitErrorResponse;
      throw new Error(errorData.errors[0] || 'Invalid email address');
    }

    // Success: 200 (updated), 201 (created), 202 (accepted)
    if (response.status === 200 || response.status === 201 || response.status === 202) {
      return responseData as ConvertKitResponse;
    }

    // Unexpected response
    throw new Error('An unexpected error occurred. Please try again later.');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to newsletter service. Please try again later.');
  }
}

/**
 * Main API handler for newsletter subscriptions
 * @param req - Vercel request object
 * @param res - Vercel response object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Get client IP for rate limiting
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
               req.socket.remoteAddress ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Too many subscription requests. Please try again later.',
      });
    }

    // Parse and validate input
    const { email, firstName } = req.body as NewsletterFormData;
    const validatedEmail = validateEmail(email);

    // Subscribe to ConvertKit
    const result = await subscribeToConvertKit({
      email: validatedEmail,
      ...(firstName && { firstName }),
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: result.subscriber.id
        ? 'Successfully subscribed to newsletter!'
        : 'Thank you for subscribing!',
      subscriber: {
        email: result.subscriber.email_address,
        firstName: result.subscriber.first_name,
      },
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);

    // Return user-friendly error
    const errorMessage = error instanceof Error
      ? error.message
      : 'An unexpected error occurred. Please try again.';

    return res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
}
