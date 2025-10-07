// Vercel API function for contact form
// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map();

// Rate limiting check
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;
  const key = `rate_limit_${ip}`;
  const requests = rateLimitStore.get(key) || [];

  // Clean old requests
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

  if (validRequests.length >= maxRequests) {
    throw new Error('Too many contact form submissions, please try again later.');
  }

  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return true;
}

// Validate form input
function validateInput(body) {
  const { name, email, company, phone, project_type, budget, timeline, message } = body;

  // Required fields
  if (!name || !email || !message) {
    throw new Error('Name, email, and message are required fields.');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please provide a valid email address.');
  }

  // Length validation
  if (name.length < 2 || name.length > 100) {
    throw new Error('Name must be between 2 and 100 characters.');
  }

  if (message.length < 10 || message.length > 2000) {
    throw new Error('Message must be between 10 and 2000 characters.');
  }

  // Basic spam detection
  const spamKeywords = ['viagra', 'casino', 'loan', 'credit', 'bitcoin', 'crypto'];
  const lowercaseMessage = message.toLowerCase();
  if (spamKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
    throw new Error('Message content flagged as potential spam.');
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: company?.trim() || '',
    phone: phone?.trim() || '',
    project_type: project_type || '',
    budget: budget || '',
    timeline: timeline || '',
    message: message.trim()
  };
}

// Generate email content
function generateEmailContent(data) {
  const { name, email, company, phone, project_type, budget, timeline, message } = data;

  return `
New contact form submission from Webstack Builders website:

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
Phone: ${phone || 'Not provided'}
Project Type: ${project_type || 'Not specified'}
Budget: ${budget || 'Not specified'}
Timeline: ${timeline || 'Not specified'}

Message:
${message}

---
Submitted: ${new Date().toISOString()}
IP: ${data.ip || 'Unknown'}
User Agent: ${data.userAgent || 'Unknown'}
`;
}

// Send email (placeholder - integrate with actual email service)
async function sendEmail(emailData) {
  // In production, integrate with Gmail API, SendGrid, or similar service
  console.log('Email would be sent:', emailData);

  return {
    messageId: `demo-${Date.now()}`,
    success: true
  };
}

// Main Vercel API handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    // Check rate limit
    checkRateLimit(ip);

    // Add request metadata
    const requestData = {
      ...req.body,
      ip: ip,
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    // Validate input
    const validatedData = validateInput(requestData);

    // Generate email content
    const emailContent = generateEmailContent(validatedData);

    // Send email (implement actual email service in production)
    const emailResult = await sendEmail({
      to: 'kevin@webstackbuilders.com',
      from: validatedData.email,
      subject: `New Contact Form Submission from ${validatedData.name}`,
      text: emailContent
    });

    // Success response
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!',
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error('Contact form error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (errorMessage.includes('rate limit')) {
      return res.status(429).json({ error: errorMessage });
    }

    if (errorMessage.includes('required fields') ||
        errorMessage.includes('valid email') ||
        errorMessage.includes('characters') ||
        errorMessage.includes('spam')) {
      return res.status(400).json({ error: errorMessage });
    }

    // Generic server error
    res.status(500).json({
      error: 'An error occurred while sending your message. Please try again later.'
    });
  }
}