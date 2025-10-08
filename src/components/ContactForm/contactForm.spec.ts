import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContactFormHandler, initContactForm, type ContactFormElements } from './contactForm';

// Mock fetch
global.fetch = vi.fn();

describe('ContactFormHandler', () => {
  let mockElements: ContactFormElements;
  let handler: ContactFormHandler;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Create mock DOM elements
    const form = document.createElement('form');
    form.id = 'contactForm';

    const messages = document.createElement('div');
    messages.id = 'formMessages';
    messages.style.display = 'none';

    const successMessage = document.createElement('div');
    successMessage.className = 'message-success hidden';
    messages.appendChild(successMessage);

    const errorMessage = document.createElement('div');
    errorMessage.className = 'message-error hidden';
    messages.appendChild(errorMessage);

    const errorText = document.createElement('p');
    errorText.id = 'errorMessage';
    errorMessage.appendChild(errorText);

    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    submitBtn.type = 'submit';

    const btnText = document.createElement('span');
    btnText.className = 'btn-text';
    btnText.textContent = 'Send Project Details';
    submitBtn.appendChild(btnText);

    const btnLoading = document.createElement('span');
    btnLoading.className = 'btn-loading hidden';
    btnLoading.textContent = 'Sending...';
    submitBtn.appendChild(btnLoading);

    const messageTextarea = document.createElement('textarea');
    messageTextarea.id = 'message';
    messageTextarea.name = 'message';
    messageTextarea.required = true;
    messageTextarea.minLength = 10;
    messageTextarea.maxLength = 2000;

    const charCount = document.createElement('span');
    charCount.id = 'charCount';
    charCount.textContent = '0';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'name';
    nameInput.name = 'name';
    nameInput.required = true;
    nameInput.minLength = 2;
    nameInput.maxLength = 100;

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email';
    emailInput.name = 'email';
    emailInput.required = true;

    const uppyContainer = document.createElement('div');
    uppyContainer.id = 'uppyContainer';

    // Add elements to form
    form.appendChild(nameInput);
    form.appendChild(emailInput);
    form.appendChild(messageTextarea);
    form.appendChild(submitBtn);

    // Add elements to body
    document.body.appendChild(form);
    document.body.appendChild(messages);
    document.body.appendChild(charCount);
    document.body.appendChild(uppyContainer);

    mockElements = {
      form: form as HTMLFormElement,
      messages,
      successMessage,
      errorMessage,
      errorText,
      submitBtn: submitBtn as HTMLButtonElement,
      btnText,
      btnLoading,
      messageTextarea: messageTextarea as HTMLTextAreaElement,
      charCount,
      uppyContainer,
    };

    // Reset fetch mock
    vi.mocked(fetch).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default config', () => {
      handler = new ContactFormHandler(mockElements);
      expect(handler).toBeInstanceOf(ContactFormHandler);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        maxCharacters: 1500,
        warningThreshold: 1200,
        errorThreshold: 1400,
        apiEndpoint: '/api/custom-contact',
      };

      handler = new ContactFormHandler(mockElements, customConfig);
      expect(handler).toBeInstanceOf(ContactFormHandler);
    });

    it('should set up file upload placeholder', () => {
      handler = new ContactFormHandler(mockElements);
      expect(mockElements.uppyContainer!.innerHTML).toContain('File Upload Coming Soon');
    });
  });

  describe('Character Counter', () => {
    beforeEach(() => {
      handler = new ContactFormHandler(mockElements);
    });

    it('should update character count on input', () => {
      const testMessage = 'Hello, this is a test message';
      mockElements.messageTextarea.value = testMessage;

      // Trigger input event
      mockElements.messageTextarea.dispatchEvent(new Event('input'));

      expect(mockElements.charCount.textContent).toBe(testMessage.length.toString());
    });

    it('should change color when approaching limits', () => {
      // Test warning threshold (1500 characters)
      mockElements.messageTextarea.value = 'a'.repeat(1600);
      mockElements.messageTextarea.dispatchEvent(new Event('input'));
      expect(mockElements.charCount.style.color).toBe('rgb(245, 158, 11)'); // yellow

      // Test error threshold (1800 characters)
      mockElements.messageTextarea.value = 'a'.repeat(1900);
      mockElements.messageTextarea.dispatchEvent(new Event('input'));
      expect(mockElements.charCount.style.color).toBe('rgb(239, 68, 68)'); // red

      // Test normal state
      mockElements.messageTextarea.value = 'normal message';
      mockElements.messageTextarea.dispatchEvent(new Event('input'));
      expect(mockElements.charCount.style.color).toBe('rgb(107, 114, 128)'); // gray
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      handler = new ContactFormHandler(mockElements);
    });

    it('should validate required fields', () => {
      const nameInput = document.getElementById('name') as HTMLInputElement;
      nameInput.value = '';

      const isValid = handler.validateField(nameInput);

      expect(isValid).toBe(false);
      expect(nameInput.classList.contains('error')).toBe(true);
      expect(nameInput.parentNode?.querySelector('.field-error')?.textContent).toBe('This field is required');
    });

    it('should validate email format', () => {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      emailInput.value = 'invalid-email';

      const isValid = handler.validateField(emailInput);

      expect(isValid).toBe(false);
      expect(emailInput.classList.contains('error')).toBe(true);
      expect(emailInput.parentNode?.querySelector('.field-error')?.textContent).toBe('Please enter a valid email address');
    });

    it('should validate minimum length', () => {
      const nameInput = document.getElementById('name') as HTMLInputElement;
      nameInput.value = 'a'; // Too short (min 2 characters)

      const isValid = handler.validateField(nameInput);

      expect(isValid).toBe(false);
      expect(nameInput.classList.contains('error')).toBe(true);
      expect(nameInput.parentNode?.querySelector('.field-error')?.textContent).toBe('Minimum 2 characters required');
    });

    it('should validate maximum length', () => {
      const nameInput = document.getElementById('name') as HTMLInputElement;
      nameInput.value = 'a'.repeat(101); // Too long (max 100 characters)

      const isValid = handler.validateField(nameInput);

      expect(isValid).toBe(false);
      expect(nameInput.classList.contains('error')).toBe(true);
      expect(nameInput.parentNode?.querySelector('.field-error')?.textContent).toBe('Maximum 100 characters allowed');
    });

    it('should pass validation for valid input', () => {
      const nameInput = document.getElementById('name') as HTMLInputElement;
      nameInput.value = 'John Doe';

      const isValid = handler.validateField(nameInput);

      expect(isValid).toBe(true);
      expect(nameInput.classList.contains('error')).toBe(false);
      expect(nameInput.parentNode?.querySelector('.field-error')).toBeNull();
    });

    it('should clear previous error messages', () => {
      const nameInput = document.getElementById('name') as HTMLInputElement;

      // First validation failure
      nameInput.value = '';
      handler.validateField(nameInput);
      expect(nameInput.parentNode?.querySelector('.field-error')).toBeTruthy();

      // Second validation with valid input should clear error
      nameInput.value = 'John Doe';
      handler.validateField(nameInput);
      expect(nameInput.parentNode?.querySelector('.field-error')).toBeNull();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      handler = new ContactFormHandler(mockElements);
    });

    it('should handle successful form submission', async () => {
      // Mock successful API response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      // Fill form with valid data
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      nameInput.value = 'John Doe';
      emailInput.value = 'john@example.com';
      mockElements.messageTextarea.value = 'This is a test message for the contact form';

      // Submit form
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockElements.successMessage.classList.contains('hidden')).toBe(false);
      expect(mockElements.successMessage.style.display).toBe('flex');
      expect(mockElements.errorMessage.classList.contains('hidden')).toBe(true);
      expect(mockElements.messages.style.display).toBe('block');
    });

    it('should handle form submission error', async () => {
      // Mock failed API response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      // Fill form with valid data
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      nameInput.value = 'John Doe';
      emailInput.value = 'john@example.com';
      mockElements.messageTextarea.value = 'This is a test message for the contact form';

      // Submit form
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockElements.errorMessage.classList.contains('hidden')).toBe(false);
      expect(mockElements.errorMessage.style.display).toBe('flex');
      expect(mockElements.successMessage.classList.contains('hidden')).toBe(true);
      expect(mockElements.errorText.textContent).toBe('Server error');
    });

    it('should handle network error', async () => {
      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      // Fill form with valid data
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      nameInput.value = 'John Doe';
      emailInput.value = 'john@example.com';
      mockElements.messageTextarea.value = 'This is a test message for the contact form';

      // Submit form
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockElements.errorMessage.classList.contains('hidden')).toBe(false);
      expect(mockElements.errorText.textContent).toBe('Network error');
    });

    it('should show loading state during submission', async () => {
      // Mock slow API response
      vi.mocked(fetch).mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true }),
          } as Response), 100)
        )
      );

      // Fill form with valid data
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      nameInput.value = 'John Doe';
      emailInput.value = 'john@example.com';
      mockElements.messageTextarea.value = 'This is a test message for the contact form';

      // Submit form
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      // Check loading state immediately
      expect(mockElements.submitBtn.disabled).toBe(true);
      expect(mockElements.btnText.style.display).toBe('none');
      expect(mockElements.btnLoading.classList.contains('hidden')).toBe(false);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 150));

      // Check final state
      expect(mockElements.submitBtn.disabled).toBe(false);
      expect(mockElements.btnText.style.display).toBe('inline');
      expect(mockElements.btnLoading.classList.contains('hidden')).toBe(true);
    });
  });
});

describe('initContactForm', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return null when form is not found', () => {
    const result = initContactForm();
    expect(result).toBeNull();
  });

  it('should initialize handler when form exists', () => {
    // Create minimal DOM structure
    const form = document.createElement('form');
    form.id = 'contactForm';

    const messages = document.createElement('div');
    messages.id = 'formMessages';

    const successMessage = document.createElement('div');
    successMessage.className = 'message-success';
    messages.appendChild(successMessage);

    const errorMessage = document.createElement('div');
    errorMessage.className = 'message-error';
    messages.appendChild(errorMessage);

    const errorText = document.createElement('p');
    errorText.id = 'errorMessage';
    errorMessage.appendChild(errorText);

    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';

    const btnText = document.createElement('span');
    btnText.className = 'btn-text';
    submitBtn.appendChild(btnText);

    const btnLoading = document.createElement('span');
    btnLoading.className = 'btn-loading';
    submitBtn.appendChild(btnLoading);

    const messageTextarea = document.createElement('textarea');
    messageTextarea.id = 'message';

    const charCount = document.createElement('span');
    charCount.id = 'charCount';

    document.body.appendChild(form);
    document.body.appendChild(messages);
    document.body.appendChild(submitBtn);
    document.body.appendChild(messageTextarea);
    document.body.appendChild(charCount);

    const result = initContactForm();
    expect(result).toBeInstanceOf(ContactFormHandler);
  });
});