// API Base URL
const API_BASE_URL = 'https://cartify.runasp.net/api';

// Helper function to get auth token
function getAuthToken() {
  const authData = JSON.parse(localStorage.getItem('Auth') || sessionStorage.getItem('Auth') || '{}');
  return authData.jwt || null;
}

// Show notification
function showNotification(message, type) {
  const notification = $('#notification');
  if (notification.length) {
    notification.text(message).removeClass().addClass(`notification ${type} show`);
    setTimeout(() => {
      notification.removeClass('show');
    }, 4000);
  }
}

$(document).ready(function() {
  // FAQ accordion
  $('.faq-item .faq-question').click(function() {
    $('.faq-item').not($(this).closest('.faq-item')).removeClass('active');
    $(this).closest('.faq-item').toggleClass('active');
  });

  // Support form submission
  $('#supportForm').submit(function(e) {
    e.preventDefault();

    // Get form data
    const name = $('#name').val().trim();
    const email = $('#email').val().trim();
    const subject = $('#subject').val().trim();
    const categoryValue = $('#category').val();
    const message = $('#message').val().trim();

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

    // Prepare DTO matching the controller's DtoSubmitTicket structure
    const submitTicketDto = {
      Name: name,
      Email: email,
      IssueCategory: parseInt(categoryValue, 10),
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

    // AJAX call
    $.ajax({
      url: `${API_BASE_URL}/HelpPage`,
      type: 'POST',
      headers: headers,
      data: JSON.stringify(submitTicketDto),
      success: function(response) {
        console.log('Ticket submission successful:', response);
        showNotification(`Thank you, ${name}! Your support ticket has been submitted successfully. We'll get back to you within 24 hours.`, 'success');
        $('#supportForm')[0].reset();
      },
      error: function(xhr, status, error) {
        console.error('Ticket submission error:', {
          status: xhr.status,
          statusText: xhr.statusText,
          error: error,
          responseText: xhr.responseText
        });

        let errorMessage = 'Failed to submit support ticket. Please try again later.';
        
        if (xhr.status === 0) {
          errorMessage = 'Network error: Unable to connect to server. Please check your connection and try again.';
        } else if (xhr.status >= 500) {
          errorMessage = 'Server Error: The backend is experiencing an internal error. Please try again later.';
        } else if (xhr.responseJSON && xhr.responseJSON.message) {
          errorMessage = xhr.responseJSON.message;
        } else if (xhr.statusText) {
          errorMessage = xhr.statusText;
        }

        showNotification(errorMessage, 'error');
      }
    });
  });

  // Button event handlers
  $('#openTicketBtn').click(function() {
    $('#subject').focus();
    showNotification('Please fill out the form below to open a support ticket.', 'success');
  });

  $('#chatSupportBtn').click(function() {
    showNotification('Our chat support is currently offline. Please submit a support ticket or call us.', 'error');
  });

  $('#callSupportBtn').click(function() {
    showNotification('Call us at 1-800-123-4567. Our support hours are Mon-Fri 9AM-6PM EST.', 'success');
  });
});
