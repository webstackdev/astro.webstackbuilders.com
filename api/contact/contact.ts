// Vercel API function for contact form
import { Resend } from 'resend';

// Types
interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  project_type?: string;
  budget?: string;
  timeline?: string;
  message: string;
  ip?: string;
  userAgent?: string;
}

interface EmailData {
  from: string;
  to: string;
  subject: string;
  text: string;
}

interface FileData {
  name: string;
  type: string;
  size: number;
  buffer?: Buffer;
  data?: Buffer;
}

// Initialize Resend
const resend = new Resend(process.env['RESEND_API_KEY']);

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, number[]>();

// File upload configuration
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Rate limiting check
function checkRateLimit(ip: string): boolean {
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
function validateInput(body: ContactFormData): ContactFormData {
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
function generateEmailContent(data: ContactFormData, files: FileData[] = []): string {
  const { name, email, company, phone, project_type, budget, timeline, message } = data;

  let emailBody = `
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

  // Add file information if files are attached
  if (files && files.length > 0) {
    emailBody += `\n\nAttached Files (${files.length}):\n`;
    files.forEach((file, index) => {
      emailBody += `${index + 1}. ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)}KB)\n`;
    });
  }

  return emailBody;
}

// Send email with attachments using Resend
async function sendEmail(emailData: EmailData, files: FileData[] = []): Promise<any> {
  try {
    // Prepare email options
    const emailOptions = {
      from: 'contact@webstackbuilders.com', // Use your verified domain
      to: 'kevin@webstackbuilders.com',
      replyTo: emailData.from,
      subject: emailData.subject,
      text: emailData.text,
      attachments: files && files.length > 0 ? files.map(file => ({
        filename: file.name,
        content: file.buffer || file.data || Buffer.from(''), // Use buffer or data depending on multipart parser
        contentType: file.type
      })) : []
    };

    // Send email via Resend
    const response = await resend.emails.send(emailOptions);

    console.log('Email sent successfully via Resend:', response.data?.id);
    return {
      messageId: response.data?.id || 'unknown',
      success: true,
      attachments: files.length
    };

  } catch (error) {
    console.error('Resend email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}

// Main Vercel API handler
export default async function handler(req: any, res: any): Promise<void> {
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

    // Parse form data (handle both JSON and multipart)
    let formData = {};
    let files = [];

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Handle multipart form data with files
      // In a real implementation, you'd use a library like 'multiparty' or 'formidable'
      // For now, assume files are parsed and available in req.files
      formData = req.body || {};
      files = req.files || [];

      // Validate file types and sizes
      if (files.length > 0) {
        for (const file of files) {
          // Check file size
          if (file.size > MAX_ATTACHMENT_SIZE) {
            throw new Error(`File "${file.name}" exceeds ${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB limit`);
          }

          // Check file type
          const allowedTypes = [
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'audio/mpeg', 'audio/wav', 'audio/mp4',
            'video/mp4', 'video/mpeg', 'video/quicktime',
            'application/zip', 'text/plain'
          ];

          if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type "${file.type}" is not allowed`);
          }
        }

        // Limit number of files
        if (files.length > 5) {
          throw new Error('Maximum 5 files allowed');
        }
      }
    } else {
      // Handle regular JSON data
      formData = req.body || {};
    }

    // Add request metadata
    const requestData = {
      ...formData,
      ip: ip,
      userAgent: req.headers['user-agent'] || 'Unknown'
    } as ContactFormData;

    // Validate input
    const validatedData = validateInput(requestData);

    // Generate email content (include file info)
    const emailContent = generateEmailContent(validatedData, files);

    // Send email with attachments (implement actual email service in production)
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