// API Base URL
const API_BASE_URL = 'https://cartify7373.runasp.net/api';

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

// Function to show notification
function showNotification(message, type) {
  notification.textContent = message;
  
  notification.className = `notification ${type} show`;
  
  setTimeout(() => {
    notification.className = `notification ${type}`;
  }, 4000);
}

// FAQ accordion functionality
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  
  question.addEventListener('click', () => {
    // Close all other FAQ items
    faqItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove('active');
      }
    });
    
    // Toggle current item
    item.classList.toggle('active');
  });
});

// Support form submission
supportForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Get form data
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const subject = document.getElementById('subject').value;
const category = parseInt(document.getElementById('category').value, 10);
  const message = document.getElementById('message').value;
  
  // Validate required fields
  if (!name || !email || !subject || isNaN(category) || !message) {
    showNotification('Please fill all required fields', 'error');
    return;
  }
  
  // Get auth token (optional - may not be required for help page)
  const token = getAuthToken();
  
  // Prepare data for API
  const helpPageData = {
    name: name,
    email: email,
    subject: subject,
    category: category,
    message: message
  };
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make AJAX call to API
  fetch(`${API_BASE_URL}/HelpPage`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(helpPageData)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  })
  .then(response => {
    console.log('Help page submission success:', response);
    showNotification(`Thank you, ${name}! Your support request has been submitted. We'll get back to you within 24 hours.`, 'success');
    
    // Reset form
    supportForm.reset();
  })
  .catch(error => {
    console.error('Help page submission error:', error);
    const errorMsg = error.message || 'Failed to submit support request. Please try again.';
    showNotification(errorMsg, 'error');
  });
});

// Support buttons functionality
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
