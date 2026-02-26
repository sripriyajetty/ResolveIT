// index.js - role selection handling

document.addEventListener('DOMContentLoaded', function() {
  // Get all role cards and buttons
  const userBtn = document.getElementById('userBtn');
  const committeeBtn = document.getElementById('committeeBtn');
  const adminBtn = document.getElementById('adminBtn');
  
  const userCard = document.getElementById('userCard');
  const committeeCard = document.getElementById('committeeCard');
  const adminCard = document.getElementById('adminCard');

  // User button - navigate to home.html
  if (userBtn) {
    userBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '../userfrontend/Home/home.html';
    });
  }

  if (committeeBtn) {
    committeeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '../comitteefrontend/Login/login.html';
    });
  }

  if (adminBtn) {
    adminBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '../adminfrontend/Login/login.html';
    });
  }

  if (userCard) {
    userCard.addEventListener('click', function(e) {
      // Don't trigger if the click was on the button itself (button has its own handler)
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        window.location.href = '../userfrontend/Home/home.html';
      }
    });
  }

  if (committeeCard) {
    committeeCard.addEventListener('click', function(e) {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        window.location.href = '../comitteefrontend/Login/login.html';
      }
    });
  }

  if (adminCard) {
    adminCard.addEventListener('click', function(e) {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        window.location.href = '../adminfrontend/Login/login.html';
      }
    });
  }

  // Add hover effects and keyboard accessibility
  const cards = [userCard, committeeCard, adminCard];
  cards.forEach(card => {
    if (card) {
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Trigger the appropriate action based on which card
          if (card.id === 'userCard') {
            window.location.href = '../userfrontend/Home/home.html';
          } else if (card.id === 'committeeCard') {
            window.location.href = '../comitteefrontend/Login/login.html';
          } else if (card.id === 'adminCard') {
            window.location.href = '../adminfrontend/Login/login.html';
          }
        }
      });
      // Make cards focusable for accessibility
      if (!card.getAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
      }
    }
  });
});