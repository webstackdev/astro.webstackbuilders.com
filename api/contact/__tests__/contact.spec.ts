// Test script for the contact form API with Resend integration
// Run with: node api/contact.spec.js
// Requires RESEND_API_KEY environment variable to be set

const testContactAPI = async () => {
  const testData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'Test Company',
    phone: '+1 (555) 123-4567',
    project_type: 'website',
    budget: '10k-25k',
    timeline: '2-3-months',
    message: 'This is a test message for the contact form. It contains enough characters to pass validation and demonstrates the form functionality.'
  };

  try {
    console.log('Testing contact form API...');
    console.log('Test data:', testData);

    const response = await fetch('http://localhost:4322/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', result);

    if (response.ok) {
      console.log('✅ Test passed! Contact form API is working.');
    } else {
      console.log('❌ Test failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error instanceof Error ? error.message : String(error));
  }
};

// Rate limiting test
const testRateLimit = async () => {
  console.log('\nTesting rate limiting...');

  const testData = {
    name: 'Rate Test',
    email: 'test@example.com',
    message: 'Rate limiting test message.'
  };

  for (let i = 1; i <= 7; i++) {
    try {
      const response = await fetch('http://localhost:4322/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      console.log(`Request ${i}: Status ${response.status} - ${result.success ? 'Success' : result.error}`);

      if (response.status === 429) {
        console.log('✅ Rate limiting is working correctly!');
        break;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Request ${i} error:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
};

// Input validation test
const testValidation = async () => {
  console.log('\nTesting input validation...');

  const invalidData = [
    { name: '', email: 'valid@example.com', message: 'Valid message' },
    { name: 'Valid Name', email: 'invalid-email', message: 'Valid message' },
    { name: 'Valid Name', email: 'valid@example.com', message: 'Short' },
    { name: 'Valid Name', email: 'valid@example.com', message: 'This message contains spam keywords like bitcoin and crypto and casino' }
  ];

  for (let i = 0; i < invalidData.length; i++) {
    try {
      const response = await fetch('http://localhost:4322/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData[i]),
      });

      const result = await response.json();
      console.log(`Validation test ${i + 1}: ${result.error || 'Unexpected success'}`);

    } catch (error) {
      console.error(`Validation test ${i + 1} error:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  console.log('✅ Input validation tests completed!');
};

// Run all tests
const runAllTests = async () => {
  console.log('🧪 Contact Form API Test Suite\n');

  await testContactAPI();
  await testRateLimit();
  await testValidation();

  console.log('\n🏁 All tests completed!');
  console.log('\nNote: In development mode, emails are logged to console instead of being sent.');
};

// Check if running directly (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testContactAPI,
  testRateLimit,
  testValidation,
  runAllTests
};