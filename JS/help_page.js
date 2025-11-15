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

  // Get form data
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const categoryValue = document.getElementById('category').value;
  const message = document.getElementById('message').value.trim();

  // Validation
  if (!name || !email || !subject || !categoryValue || !message) {
    showNotification('Please fill all required fields', 'error');
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }

  // Convert category to integer (IssueCategory enum)
  const issueCategory = parseInt(categoryValue, 10);

  // Prepare DTO matching the controller's DtoSubmitTicket structure
  const submitTicketDto = {
    Name: name,
    Email: email,
    IssueCategory: issueCategory,
    Subject: subject,
    Message: message
  };

  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Debug logging
  console.log('Submitting ticket:', {
    url: `${API_BASE_URL}/HelpPage`,
    data: submitTicketDto,
    hasToken: !!token
  });

  try {
    const response = await fetch(`${API_BASE_URL}/HelpPage`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(submitTicketDto)
    });

    // Check if response is ok
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.title || errorMessage;
        console.error('Server error details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response. Status:', response.status, response.statusText);
      }
      throw new Error(errorMessage);
    }

    // Parse response (controller returns Ok() which may be empty or contain data)
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (e) {
        // Response might be empty, which is fine
        console.log('Response is empty or not JSON');
      }
    }

    console.log('Ticket submission successful:', responseData);

    showNotification(`Thank you, ${name}! Your support ticket has been submitted successfully. We'll get back to you within 24 hours.`, 'success');
    supportForm.reset();

  } catch (error) {
    console.error("Ticket submission error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle different error types
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      showNotification('Network error: Please check your internet connection and try again.', 'error');
    } else if (error.message.includes('CORS')) {
      showNotification('CORS error: Server configuration issue. Please contact support.', 'error');
    } else if (error.message.includes('500')) {
      showNotification('Server Error (500): The backend is experiencing an internal error. Please try again later.', 'error');
    } else {
      showNotification(error.message || 'Failed to submit support ticket. Please try again later.', 'error');
    }
  }
});

// Button event handlers
if (openTicketBtn) {
  openTicketBtn.addEventListener('click', () => {
    document.getElementById('subject').focus();
    showNotification('Please fill out the form below to open a support ticket.', 'success');
  });
}

if (chatSupportBtn) {
  chatSupportBtn.addEventListener('click', () => {
    showNotification('Our chat support is currently offline. Please submit a support ticket or call us.', 'error');
  });
}

if (callSupportBtn) {
  callSupportBtn.addEventListener('click', () => {
    showNotification('Call us at 1-800-123-4567. Our support hours are Mon-Fri 9AM-6PM EST.', 'success');
  });
}

