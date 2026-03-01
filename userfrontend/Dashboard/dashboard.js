// dashboard.js - User Dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
  // ==================== STATE MANAGEMENT ====================
  let currentPage = 'dashboard';
  
  // Sample data for demonstration
  const complaintStats = {
    total: 12,
    reviewed: 8,
    resolved: 4
  };

  const recentComplaints = [
    { id: 'CMP-2024-001', date: '2024-02-20', status: 'pending', title: 'Workplace harassment' },
    { id: 'CMP-2024-002', date: '2024-02-18', status: 'review', title: 'Discrimination complaint' },
    { id: 'CMP-2024-003', date: '2024-02-15', status: 'resolved', title: 'Unfair treatment' },
    { id: 'CMP-2024-004', date: '2024-02-12', status: 'review', title: 'Safety concern' },
    { id: 'CMP-2024-005', date: '2024-02-10', status: 'pending', title: 'Bullying incident' }
  ];

  // ==================== DOM ELEMENTS ====================
  const mainContent = document.getElementById('mainContent');
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');

  // ==================== PAGE RENDERING FUNCTIONS ====================

  function renderDashboardPage() {
    const statusColors = {
      pending: 'status-pending',
      review: 'status-review',
      resolved: 'status-resolved'
    };

    const statusLabels = {
      pending: 'Pending',
      review: 'Under Review',
      resolved: 'Resolved'
    };

    const complaintsHtml = recentComplaints.map(complaint => `
      <tr>
        <td><strong>${complaint.id}</strong></td>
        <td>${complaint.date}</td>
        <td><span class="status-badge ${statusColors[complaint.status]}">${statusLabels[complaint.status]}</span></td>
        <td>${complaint.title}</td>
        <td><button class="btn-view" data-id="${complaint.id}">View Details</button></td>
      </tr>
    `).join('');

    return `
      <div class="dashboard-page">
        <div class="page-header">
          <h1>Welcome back, Priya!</h1>
          <p>Here's what's happening with your complaints today.</p>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <i class="fas fa-folder-open"></i>
            </div>
            <div class="stat-info">
              <h3>Total Cases</h3>
              <div class="stat-number">${complaintStats.total}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon reviewed">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
              <h3>Reviewed Cases</h3>
              <div class="stat-number">${complaintStats.reviewed}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon resolved">
              <i class="fas fa-check-double"></i>
            </div>
            <div class="stat-info">
              <h3>Resolved Cases</h3>
              <div class="stat-number">${complaintStats.resolved}</div>
            </div>
          </div>
        </div>

        <!-- Recent Complaints -->
        <div class="recent-complaints">
          <div class="section-header">
            <h2>Recent Complaints</h2>
            <a href="#" class="view-all" data-page="track">
              View All <i class="fas fa-arrow-right"></i>
            </a>
          </div>

          <div class="complaints-table">
            <table>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${complaintsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderGrievancePage() {
    return `
      <div class="grievance-page">
        <div class="page-header">
          <h1>Submit a Grievance</h1>
          <p>Please provide details about your complaint. All information is confidential and encrypted.</p>
        </div>

        <form class="grievance-form" id="grievanceForm">
          <div class="form-group">
            <label for="complaintTitle">Complaint Title</label>
            <input type="text" id="complaintTitle" placeholder="e.g., Workplace harassment incident" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="incidentDate">Date of Incident</label>
              <input type="date" id="incidentDate" required>
            </div>

            <div class="form-group">
              <label for="complaintType">Complaint Type</label>
              <select id="complaintType" required>
                <option value="">Select type</option>
                <option value="harassment">Harassment</option>
                <option value="discrimination">Discrimination</option>
                <option value="bullying">Bullying</option>
                <option value="safety">Safety Concern</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Detailed Description</label>
            <textarea id="description" rows="6" placeholder="Please describe the incident in detail..." required></textarea>
          </div>

          <div class="form-group">
            <label>Supporting Documents (Optional)</label>
            <div class="file-upload" id="fileUpload">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Click to upload or drag and drop</p>
              <small>PDF, JPG, PNG up to 10MB</small>
              <input type="file" id="fileInput" multiple style="display: none;">
            </div>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" required> I confirm that the information provided is true to the best of my knowledge
            </label>
          </div>

          <button type="submit" class="btn-submit">Submit Complaint Securely</button>
        </form>
      </div>
    `;
  }

  function renderTrackPage() {
    return `
      <div class="track-page">
        <div class="page-header">
          <h1>Track Your Complaint</h1>
          <p>Enter your complaint ID to check the status and progress.</p>
        </div>

        <div class="track-search">
          <h3>Search Complaint</h3>
          <div class="search-box">
            <input type="text" placeholder="Enter complaint ID (e.g., CMP-2024-001)" id="complaintSearch">
            <button id="searchBtn">
              <i class="fas fa-search"></i> Track
            </button>
          </div>
        </div>

        <div class="track-result hidden" id="trackResult">
          <h3>Complaint Status: CMP-2024-001</h3>
          <div class="timeline" id="timeline">
            <!-- Timeline will be populated dynamically -->
          </div>
        </div>
      </div>
    `;
  }

  function renderFeedbackPage() {
    return `
      <div class="feedback-page">
        <div class="page-header">
          <h1>Provide Feedback</h1>
          <p>Help us improve our services by sharing your experience.</p>
        </div>

        <form id="feedbackForm">
          <div class="form-group">
            <label for="feedbackType">Feedback Type</label>
            <select id="feedbackType" required>
              <option value="">Select type</option>
              <option value="suggestion">Suggestion</option>
              <option value="complaint">Complaint about service</option>
              <option value="appreciation">Appreciation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="rating-section">
            <label>How would you rate your experience?</label>
            <div class="rating-stars" id="ratingStars">
              <i class="far fa-star" data-rating="1"></i>
              <i class="far fa-star" data-rating="2"></i>
              <i class="far fa-star" data-rating="3"></i>
              <i class="far fa-star" data-rating="4"></i>
              <i class="far fa-star" data-rating="5"></i>
            </div>
          </div>

          <div class="form-group">
            <label for="feedbackMessage">Your Feedback</label>
            <textarea id="feedbackMessage" rows="5" placeholder="Please share your thoughts..." required></textarea>
          </div>

          <button type="submit" class="btn-submit">Submit Feedback</button>
        </form>
      </div>
    `;
  }

  // ==================== NAVIGATION HANDLER ====================
  function navigateTo(page) {
    currentPage = page;
    
    // Update active nav item
    navItems.forEach(item => {
      if (item.dataset.page === page) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Render appropriate page
    switch(page) {
      case 'dashboard':
        mainContent.innerHTML = renderDashboardPage();
        attachDashboardListeners();
        break;
      case 'grievance':
        mainContent.innerHTML = renderGrievancePage();
        attachGrievanceListeners();
        break;
      case 'track':
        mainContent.innerHTML = renderTrackPage();
        attachTrackListeners();
        break;
      case 'feedback':
        mainContent.innerHTML = renderFeedbackPage();
        attachFeedbackListeners();
        break;
    }

    // Close mobile menu if open
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('active');
    }
  }

  // ==================== EVENT LISTENERS ATTACHMENT ====================
  function attachDashboardListeners() {
    // View buttons in complaints table
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const complaintId = e.target.dataset.id;
        alert(`Viewing details for complaint: ${complaintId}\n(This would open a detailed view in a real application.)`);
      });
    });

    // View all link
    const viewAllLink = document.querySelector('.view-all');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('track');
      });
    }
  }

  function attachGrievanceListeners() {
    const form = document.getElementById('grievanceForm');
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('fileInput');

    if (fileUpload && fileInput) {
      fileUpload.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', (e) => {
        const fileCount = e.target.files.length;
        if (fileCount > 0) {
          const fileNames = Array.from(e.target.files).map(f => f.name).join(', ');
          fileUpload.querySelector('p').textContent = `Selected: ${fileNames}`;
        } else {
          fileUpload.querySelector('p').textContent = 'Click to upload or drag and drop';
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Complaint submitted successfully! Your reference ID will be sent to your email.');
        form.reset();
      });
    }
  }

  function attachTrackListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('complaintSearch');
    const trackResult = document.getElementById('trackResult');
    const timeline = document.getElementById('timeline');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const complaintId = searchInput.value.trim();
        
        if (!complaintId) {
          alert('Please enter a complaint ID');
          return;
        }

        // Sample timeline data
        const timelineHtml = `
          <div class="timeline-item completed">
            <div class="timeline-date">Feb 20, 2024</div>
            <div class="timeline-content">
              <h4>Complaint Submitted</h4>
              <p>Your complaint was successfully submitted and registered.</p>
            </div>
          </div>
          <div class="timeline-item completed">
            <div class="timeline-date">Feb 21, 2024</div>
            <div class="timeline-content">
              <h4>Under Initial Review</h4>
              <p>Your complaint is being reviewed by our team.</p>
            </div>
          </div>
          <div class="timeline-item pending">
            <div class="timeline-date">Feb 23, 2024</div>
            <div class="timeline-content">
              <h4>Committee Assignment</h4>
              <p>Assigned to review committee for further action.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-date">Pending</div>
            <div class="timeline-content">
              <h4>Final Resolution</h4>
              <p>Awaiting committee decision.</p>
            </div>
          </div>
        `;

        timeline.innerHTML = timelineHtml;
        trackResult.classList.remove('hidden');
      });
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchBtn.click();
        }
      });
    }
  }

  function attachFeedbackListeners() {
    const stars = document.querySelectorAll('.rating-stars i');
    const form = document.getElementById('feedbackForm');

    stars.forEach(star => {
      star.addEventListener('mouseenter', function() {
        const rating = parseInt(this.dataset.rating);
        stars.forEach((s, index) => {
          if (index < rating) {
            s.classList.remove('far');
            s.classList.add('fas', 'active');
          } else {
            s.classList.remove('fas', 'active');
            s.classList.add('far');
          }
        });
      });

      star.addEventListener('click', function() {
        const rating = parseInt(this.dataset.rating);
        // You can store the rating value here
        console.log('Selected rating:', rating);
      });
    });

    stars[stars.length - 1].addEventListener('mouseleave', () => {
      stars.forEach(s => {
        s.classList.remove('fas', 'active');
        s.classList.add('far');
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your feedback! It helps us improve our services.');
        form.reset();
      });
    }
  }

  // ==================== NAVIGATION EVENT LISTENERS ====================
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });

  // ==================== LOGOUT HANDLER ====================
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../Home/home.html'; 
      }
    });
  }

  // ==================== MOBILE MENU TOGGLE ====================
  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    // Close menu when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
          sidebar.classList.remove('active');
        }
      }
    });
  }

  // ==================== INITIAL RENDER ====================
  navigateTo('dashboard');

  // ==================== WINDOW RESIZE HANDLER ====================
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('active');
    }
  });
});