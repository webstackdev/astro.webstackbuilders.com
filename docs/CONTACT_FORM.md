# Enhanced Contact Form Documentation

## Overview
The enhanced contact form system includes comprehensive business inquiry fields, file upload support, abuse prevention measures, and Vercel-compatible API integration.

## Features

### 🎯 Business-Focused Fields
- **Contact Information**: Name, email, company, phone
- **Project Details**: Type, budget range, timeline
- **Detailed Description**: 2000-character project description
- **File Uploads**: Support for project specs, mockups, reference materials

### 🛡️ Security & Abuse Prevention
- **Rate Limiting**: 5 submissions per 15 minutes per IP
- **Input Validation**: Comprehensive client and server-side validation
- **Spam Detection**: Keyword-based spam filtering
- **File Type Validation**: Restricted to business file types
- **Size Limits**: 10MB per file, maximum 5 files
- **CAPTCHA Ready**: Placeholder for production CAPTCHA integration

### 📁 Supported File Types
- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, PNG, GIF, WebP
- Audio: MP3, WAV, MP4
- Video: MP4, MOV, QuickTime
- Archives: ZIP

### 🚀 Technical Stack
- **Frontend**: Astro with TypeScript, responsive CSS
- **Backend**: Vercel API function
- **Email**: Gmail integration (production-ready)
- **File Handling**: Uppy.js integration (placeholder included)

## File Structure

```
src/pages/contact/
├── index.astro          # Enhanced contact form page
└── [old files]          # Legacy TypeScript files (can be removed)

api/
└── contact.js           # Vercel API function

.env.example             # Environment configuration template
```

## Configuration

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
# Gmail Configuration
GMAIL_USER=your-email@domain.com
GMAIL_APP_PASSWORD=your-app-specific-password

# Rate Limiting
CONTACT_RATE_LIMIT_WINDOW=900000  # 15 minutes
CONTACT_RATE_LIMIT_MAX=5          # 5 requests per window

# File Upload
CONTACT_MAX_FILE_SIZE=10485760    # 10MB
CONTACT_MAX_FILES=5               # Maximum files
```

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Use the app password in `GMAIL_APP_PASSWORD`

## Usage

### Basic Form Submission
The form handles standard business inquiries with validation:
- Required: Name, email, message
- Optional: Company, phone, project details
- Character limits and format validation

### File Upload Integration
To enable file uploads in production:

1. Install Uppy.js:
   ```bash
   npm install @uppy/core @uppy/dashboard @uppy/xhr-upload
   ```

2. Replace the placeholder in the contact form with Uppy integration:
   ```javascript
   import Uppy from '@uppy/core'
   import Dashboard from '@uppy/dashboard'
   import XHRUpload from '@uppy/xhr-upload'

   const uppy = new Uppy()
     .use(Dashboard, {
       inline: true,
       target: '#uppyContainer'
     })
     .use(XHRUpload, {
       endpoint: '/api/contact',
       formData: true,
       fieldName: 'files'
     })
   ```

### API Integration
The Vercel API function at `/api/contact` handles:
- Form validation
- Rate limiting
- Email sending
- File processing
- Error handling

## Customization

### Adding Form Fields
1. Add input fields to `src/pages/contact/index.astro`
2. Update validation in `api/contact.js`
3. Include new fields in email template

### Styling
The form uses CSS custom properties for theming:
- `--color-primary`: Primary brand color
- `--color-secondary`: Secondary brand color
- `--color-dark`: Dark text color
- `--color-gray`: Gray text color

### Email Templates
Modify `generateEmailContent()` in `api/contact.js` to customize email format.

## Deployment

### Vercel Deployment
1. Ensure `api/contact.js` is in the project root
2. Configure environment variables in Vercel dashboard
3. Deploy with `vercel --prod`

### Environment Setup
- Development: Uses console logging for email simulation
- Production: Requires Gmail API credentials

## Testing

### Development Testing
- Form validation works offline
- Rate limiting uses in-memory store
- Email sending is simulated with console logs

### Production Testing
- Test with real Gmail credentials
- Verify file upload limits
- Check rate limiting with multiple submissions
- Validate spam detection

## Maintenance

### Regular Tasks
- Monitor email delivery rates
- Review spam detection effectiveness
- Update file type allowlist as needed
- Check rate limiting effectiveness

### Security Updates
- Keep dependencies updated
- Review and update spam keywords
- Monitor for abuse patterns
- Update CAPTCHA integration

## Troubleshooting

### Common Issues
1. **Gmail Authentication**: Ensure app password is correctly configured
2. **File Upload Errors**: Check file size and type restrictions
3. **Rate Limiting**: Clear in-memory store or wait 15 minutes
4. **Validation Errors**: Check input formatting and requirements

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging.

## Future Enhancements
- Real-time file upload progress
- Advanced CAPTCHA integration
- CRM integration
- Automated follow-up emails
- Analytics and conversion tracking