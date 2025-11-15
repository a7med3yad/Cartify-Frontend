// API Base URL
const API_BASE_URL = 'https://cartify.runasp.net/api';

// Helper function to get auth token
function getAuthToken() {
  const authData = JSON.parse(localStorage.getItem('Auth') || sessionStorage.getItem('Auth') || '{}');
  return authData.jwt || null;
}

// DOM elements
const notification = document.getElementById('notification');
const faqItems = document.querySelectorAll('.faq-item');
const supportForm = document.getElementById('supportForm');
const openTicketBtn = document.getElementById('openTicketBtn');
const chatSupportBtn = document.getElementById('chatSupportBtn');
const callSupportBtn = document.getElementById('callSupportBtn');

// Show notification
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  setTimeout(() => {
    notification.className = `notification ${type}`;
  }, 4000);
}

// FAQ accordion
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    faqItems.forEach(other => {
      if (other !== item) other.classList.remove('active');
    });
    item.classList.toggle('active');
  });
});

// Support form submission
supportForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Form data
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const subject = document.getElementById('subject').value;
  const category = parseInt(document.getElementById('category').value, 10);
  const message = document.getElementById('message').value;

  if (!name || !email || !subject || isNaN(category) || !message) {
    showNotification('Please fill all required fields', 'error');
    return;
  }

  const token = getAuthToken();

  const helpPageData = {
    name,
    email,
    subject,
    category,
    message
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Debug logging
  console.log('Submitting help page request:', {
    url: `${API_BASE_URL}/HelpPage`,
    data: helpPageData,
    hasToken: !!token
  });

  try {
    const response = await fetch(`${API_BASE_URL}/HelpPage`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(helpPageData)
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.title || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.error('Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const resJson = await response.json();

    showNotification(`Thank you, ${name}! Your support request has been submitted. We'll get back to you within 24 hours.`, 'success');
    supportForm.reset();

  } catch (error) {
    console.error("Help page submission error:", error);
    
    // Handle CORS and network errors specifically
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      showNotification('Network error: Unable to connect to server. Please check your connection and try again.', 'error');
    } else if (error.message.includes('CORS')) {
      showNotification('CORS error: Server configuration issue. Please contact support.', 'error');
    } else {
      showNotification(error.message || 'Failed to submit support request. Please try again.', 'error');
    }
  }
});

// Buttons
openTicketBtn.addEventListener('click', () => {
  document.getElementById('subject').focus();
  showNotification('Please fill out the form below to open a support ticket.', 'success');
});

chatSupportBtn.addEventListener('click', () => {
  showNotification('Our chat support is currently offline. Please submit a support ticket or call us.', 'error');
});

callSupportBtn.addEventListener('click', () => {
  showNotification('Call us at 1-800-123-4567. Our support hours are Mon-Fri 9AM-6PM EST.', 'success');
});
