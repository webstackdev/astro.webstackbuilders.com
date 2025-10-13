/**
 * Newsletter subscription form client-side logic
 */

// Email validation pattern (matches server-side)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if email is valid
 */
function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

/**
 * Initialize the newsletter subscription form
 */
export function initNewsletterForm(): void {
  const form = document.getElementById('newsletter-form') as HTMLFormElement | null;
  const emailInput = document.getElementById('newsletter-email') as HTMLInputElement | null;
  const submitButton = document.getElementById('newsletter-submit') as HTMLButtonElement | null;
  const buttonText = document.getElementById('button-text') as HTMLSpanElement | null;
  const buttonArrow = document.getElementById('button-arrow') as SVGSVGElement | null;
  const buttonSpinner = document.getElementById('button-spinner') as SVGSVGElement | null;
  const message = document.getElementById('newsletter-message') as HTMLParagraphElement | null;

  if (!form || !emailInput || !submitButton || !buttonText || !buttonArrow || !buttonSpinner || !message) {
    console.warn('Newsletter form elements not found');
    return;
  }

  /**
   * Display a message to the user
   * @param text - Message text
   * @param type - Message type (success, error, or info)
   */
  function showMessage(text: string, type: 'success' | 'error' | 'info'): void {
    if (!message) return;

    message.textContent = text;
    message.classList.remove('text-[var(--color-text-offset)]', 'text-[var(--color-success)]', 'text-[var(--color-danger)]');

    if (type === 'success') {
      message.classList.add('text-[var(--color-success)]');
    } else if (type === 'error') {
      message.classList.add('text-[var(--color-danger)]');
    } else {
      message.classList.add('text-[var(--color-text-offset)]');
    }
  }

  /**
   * Set the loading state of the submit button
   * @param loading - Whether to show loading state
   */
  function setLoading(loading: boolean): void {
    if (!submitButton || !buttonText || !buttonArrow || !buttonSpinner) return;

    submitButton.disabled = loading;

    if (loading) {
      buttonText.textContent = 'Subscribing...';
      buttonArrow.classList.add('hidden');
      buttonSpinner.classList.remove('hidden');
      buttonSpinner.classList.add('inline-block');
    } else {
      buttonText.textContent = submitButton.getAttribute('data-original-text') || 'Subscribe';
      buttonArrow.classList.remove('hidden');
      buttonSpinner.classList.add('hidden');
      buttonSpinner.classList.remove('inline-block');
    }
  }

  // Save original button text
  submitButton.setAttribute('data-original-text', buttonText.textContent || 'Subscribe');

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    // Client-side validation
    if (!email) {
      showMessage('Please enter your email address.', 'error');
      emailInput.focus();
      return;
    }

    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    // Submit to API
    setLoading(true);
    showMessage('Subscribing...', 'info');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage(data.message || 'Successfully subscribed! Check your email.', 'success');
        form.reset();
      } else {
        showMessage(data.error || 'Failed to subscribe. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      setLoading(false);
    }
  });

  // Real-time email validation
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();

    if (email && !validateEmail(email)) {
      showMessage('Please enter a valid email address.', 'error');
    } else if (email) {
      showMessage('We respect your privacy. Unsubscribe at any time.', 'info');
    }
  });
}
