// dashboard.js - User Dashboard functionality with API integration
// Updated with improved error handling and debugging

document.addEventListener('DOMContentLoaded', function () {
  // ==================== CONFIGURATION ====================
  const API_BASE_URL = 'http://localhost:8080'; // Replace with your actual API base URL (without trailing slash)
  const AUTH_TOKEN_KEY = 'token'; // Key for storing JWT in localStorage

  // ==================== AUTHENTICATION CHECK ====================
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    // No token, redirect to login immediately
    window.location.href = '../Login/login.html';
    return;
  }

  // ==================== STATE MANAGEMENT ====================
  let currentPage = 'dashboard';
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT payload:', payload);
  // Read user info directly from localStorage (set at login time)
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'User';
  const userId = localStorage.getItem('userId') || '';
  // Avatar = first letter of the name, uppercased
  const userAvatar = userName.charAt(0).toUpperCase();

  // ==================== DOM ELEMENTS ====================
  const mainContent = document.getElementById('mainContent');
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');

  // ==================== HELPER FUNCTIONS ====================
  function getAuthHeaders() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async function apiFetch(endpoint, options = {}) {
    // Ensure endpoint starts with /api if not already
    const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${API_BASE_URL}${fullEndpoint}`;
    const headers = getAuthHeaders();
    const config = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };

    console.log(`API Request: ${options.method || 'GET'} ${url}`, options.body || '');

    try {
      const response = await fetch(url, config);
      console.log(`API Response Status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - token expired or invalid
          localStorage.removeItem(AUTH_TOKEN_KEY);
          window.location.href = '../Login/login.html';
          return;
        }
        // Try to parse error response
        let errorMsg = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }

      // For 204 No Content, return null
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API Fetch Error:', error);
      throw error; // Re-throw so calling function can handle
    }
  }

  function showLoading(container, message = 'Loading...') {
    container.innerHTML = `<div class="loading-spinner">${message}</div>`;
  }

  function showError(container, message) {
    container.innerHTML = `<div class="error-message">${message}</div>`;
  }

  // ==================== SIDEBAR USER INFO ====================
  // Populates the sidebar footer with real user data decoded from the JWT.
  // Call once on load; safe to call again after any profile update.
  function populateSidebarUser() {
    const avatarEl = document.querySelector('.user-avatar');
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');

    if (avatarEl) avatarEl.textContent = userAvatar;
    if (nameEl) nameEl.textContent = userName;
    if (roleEl) roleEl.textContent = userRole;
  }

  // ==================== PAGE RENDERING FUNCTIONS ====================
  async function renderDashboardPage() {
    showLoading(mainContent, 'Loading your dashboard...');
    try {
      // Fetch all complaints for the logged-in user
      const complaints = await apiFetch('/complaints/my'); // Will become /api/complaints/my

      // Ensure complaints is an array
      if (!Array.isArray(complaints)) {
        console.error('Expected array of complaints, got:', complaints);
        throw new Error('Invalid data format received from server');
      }

      // Compute stats
      const stats = {
        total: complaints.length,
        reviewed: complaints.filter(c => c.status === 'IN_PROGRESS').length,
        resolved: complaints.filter(c => c.status === 'RESOLVED').length
      };

      // userName is decoded from the JWT at the top of DOMContentLoaded

      const statusColors = {
        PENDING: 'status-pending',
        IN_PROGRESS: 'status-review',
        RESOLVED: 'status-resolved'
      };

      const statusLabels = {
        PENDING: 'Pending',
        IN_PROGRESS: 'Under Review',
        RESOLVED: 'Resolved'
      };


      const mappedComplaints = complaints.map(c => ({
        id: c.id,
        date: c.incident_date,
        status: c.status || 'PENDING',
        title: c.title
      }));
      const recentComplaints = [...mappedComplaints]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      const complaintsHtml = recentComplaints.map(complaint => `
        <tr>
          <td><strong>${complaint.id}</strong></td>
          <td>${toDisplayDate(complaint.date)}</td>
          <td><span class="status-badge ${statusColors[complaint.status] || 'status-pending'}">${statusLabels[complaint.status] || 'Pending'}</span></td>
          <td>${complaint.title}</td>
          <td><button class="btn-view" data-id="${complaint.id}">View Details</button></td>
        </tr>
      `).join('');

      const html = `
        <div class="dashboard-page">
          <div class="page-header">
            <h1>Welcome back, ${userName}!</h1>
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
                <div class="stat-number">${stats.total}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon reviewed">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-info">
                <h3>Reviewed Cases</h3>
                <div class="stat-number">${stats.reviewed}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon resolved">
                <i class="fas fa-check-double"></i>
              </div>
              <div class="stat-info">
                <h3>Resolved Cases</h3>
                <div class="stat-number">${stats.resolved}</div>
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
      mainContent.innerHTML = html;
      attachDashboardListeners();
    } catch (error) {
      console.error('Dashboard error:', error);
      showError(mainContent, `Failed to load dashboard: ${error.message}. Please try again later.`);
    }
  }

  function renderGrievancePage() {
    const html = `
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
    mainContent.innerHTML = html;
    attachGrievanceListeners();
  }

  function renderTrackPage() {
    const html = `
    <div class="track-page">
      <div class="page-header">
        <h1>Track Your Complaint</h1>
        <p>Search by ID or browse all your submitted complaints below.</p>
      </div>

      <!-- Search -->
      <div class="track-search">
        <h3>Search Complaint</h3>
        <div class="search-box">
          <input type="text" placeholder="Enter complaint ID or title..." id="complaintSearch">
          <button id="searchBtn"><i class="fas fa-search"></i> Track</button>
          <button id="clearBtn" style="display:none;background:#f1f5f9;color:#64748b;border:1px solid #e5e7eb;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:14px;">
            <i class="fas fa-times"></i> Clear
          </button>
        </div>
      </div>

      <!-- Two column layout: cards + detail -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;margin-top:24px;">

        <!-- Left: complaint cards -->
        <div id="cardsPanel">
          <div class="loading-spinner">Loading your complaints...</div>
        </div>

        <!-- Right: detail panel -->
        <div id="detailPanel" style="display:none;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:28px;position:sticky;top:24px;">
        </div>

      </div>
    </div>
  `;
    mainContent.innerHTML = html;
    attachTrackListeners();
  }

  function renderFeedbackPage(preselectedComplaint = null) {
    const html = `
    <div class="feedback-page">
      <div class="page-header">
        <h1>Provide Feedback</h1>
        <p>Help us improve our services by sharing your experience.</p>
      </div>

      <form id="feedbackForm">

        <!-- Pre-selected complaint display -->
        <div class="form-group">
          <label>Complaint</label>
          <div id="selectedComplaintBox" style="
            padding: 14px 16px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            font-size: 14px;
            color: #166534;
            display: ${preselectedComplaint ? 'flex' : 'none'};
            align-items: center;
            gap: 10px;
          ">
            <i class="fas fa-check-circle"></i>
            <span id="selectedComplaintText">
              ${preselectedComplaint ? `#${preselectedComplaint.id} — ${preselectedComplaint.title}` : ''}
            </span>
          </div>

          <!-- Shown if user navigates here directly without a complaint -->
          <div id="noComplaintWarning" style="
            display: ${preselectedComplaint ? 'none' : 'block'};
            padding: 14px 16px;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            font-size: 14px;
            color: #9a3412;
          ">
            <i class="fas fa-exclamation-triangle" style="margin-right:8px"></i>
            Please go to <strong>Track Complaint</strong>, open a resolved complaint, and click
            <strong>"Give Feedback"</strong> from there.
          </div>

          <input type="hidden" id="complaintId" value="${preselectedComplaint ? preselectedComplaint.id : ''}">
        </div>

        <div id="feedbackFormFields" style="display:${preselectedComplaint ? 'block' : 'none'}">

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
            <textarea id="feedbackMessage" rows="5"
              placeholder="Please share your thoughts..." required></textarea>
          </div>

          <button type="submit" class="btn-submit">Submit Feedback</button>
        </div>

      </form>
    </div>
  `;
    mainContent.innerHTML = html;
    attachFeedbackListeners();
  }

  // ==================== EVENT LISTENERS ATTACHMENT ====================
  function attachDashboardListeners() {
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const complaintId = e.target.dataset.id;
        window._trackComplaintId = complaintId; // pass ID to track page
        navigateTo('track');
      });
    });

    const viewAllLink = document.querySelector('.view-all');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('track');
      });
    }
  }
  function toDisplayDate(isoDate) {
    if (!isoDate) return 'N/A';
    const [yyyy, mm, dd] = isoDate.split("T")[0].split("-"); // handles "2026-03-11T00:00:00" too
    return `${dd}-${mm}-${yyyy}`;
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
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
          const result = await apiFetch('/complaints', {
            method: 'POST',
            body: JSON.stringify({
              title: document.getElementById('complaintTitle').value,
              incident_date: document.getElementById('incidentDate').value,
              type: document.getElementById('complaintType').value,
              description: document.getElementById('description').value,
              status: 'PENDING'
            })
          });

          alert(`Complaint submitted successfully! Your reference ID is ${result.id}`);
          form.reset();
          if (fileUpload) {
            fileUpload.querySelector('p').textContent = 'Click to upload or drag and drop';
          }
        } catch (error) {
          alert('Error submitting complaint: ' + error.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Complaint Securely';
        }
      });
    }
  }

  async function attachTrackListeners() {
    const searchInput = document.getElementById('complaintSearch');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const cardsPanel = document.getElementById('cardsPanel');
    const detailPanel = document.getElementById('detailPanel');

    const statusColors = {
      PENDING: 'status-pending',
      IN_PROGRESS: 'status-review',
      RESOLVED: 'status-resolved'
    };

    const statusLabels = {
      PENDING: 'Pending',
      IN_PROGRESS: 'Under Review',
      RESOLVED: 'Resolved'
    };

    const typeLabels = {
      harassment: 'Harassment',
      discrimination: 'Discrimination',
      bullying: 'Bullying',
      safety: 'Safety Concern',
      other: 'Other'
    };

    // ── Fetch all complaints ──
    let allComplaints = [];
    try {
      const data = await apiFetch('/complaints/my');
      allComplaints = Array.isArray(data) ? data : [];
    } catch (err) {
      cardsPanel.innerHTML = `<div class="error-message">Failed to load: ${err.message}</div>`;
      return;
    }

    // ── Build fallback timeline from status ──
    function buildTimeline(c) {
      if (Array.isArray(c.timeline) && c.timeline.length > 0) return c.timeline;

      const events = [{
        title: 'Complaint Submitted',
        date: c.created_at || c.incident_date,
        description: 'Your complaint was received and logged successfully.'
      }];

      if (c.status === 'IN_PROGRESS' || c.status === 'RESOLVED') {
        events.push({
          title: 'Under Review',
          date: c.updated_at || c.created_at,
          description: 'Your complaint is being reviewed by our team.'
        });
      }

      if (c.status === 'RESOLVED') {
        events.push({
          title: 'Resolved',
          date: c.updated_at,
          description: 'Your complaint has been resolved.'
        });
      }

      return events;
    }

    // ── Render detail panel ──
    function renderDetail(c) {
      const status = c.status || 'PENDING';
      const type = typeLabels[c.type] || c.type || 'N/A';
      const incDate = toDisplayDate(c.incident_date);
      const submitted = toDisplayDate(c.created_at || c.incident_date);
      const updated = toDisplayDate(c.updated_at || c.created_at);
      const events = buildTimeline(c);

      const timelineHtml = events.map((event, i) => {
        const isLast = i === events.length - 1;
        return `
      <div style="display:flex;gap:14px;margin-bottom:${isLast ? '0' : '20px'}">
        <div style="display:flex;flex-direction:column;align-items:center">
          <div style="width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:3px;
            background:${isLast ? '#0d9488' : '#cbd5e1'};"></div>
          ${!isLast ? '<div style="width:2px;flex:1;background:#e5e7eb;margin-top:4px;min-height:20px"></div>' : ''}
        </div>
        <div style="padding-bottom:4px">
          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a2e">${event.title}</p>
          <p style="margin:3px 0;font-size:12px;color:#94a3b8">${toDisplayDate(event.date)}</p>
          ${event.description
            ? `<p style="margin:0;font-size:13px;color:#64748b">${event.description}</p>`
            : ''}
        </div>
      </div>
    `;
      }).join('');

      detailPanel.style.display = 'block';
      detailPanel.innerHTML = `

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;
      gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <div>
        <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:700;
          letter-spacing:0.5px;text-transform:uppercase">#${c.id}</p>
        <h2 style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1a1a2e">${c.title}</h2>
      </div>
      <span class="status-badge ${statusColors[status]}">${statusLabels[status]}</span>
    </div>

    <!-- Meta grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;
      background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:20px">
      <div>
        <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;
          letter-spacing:0.5px;font-weight:700">Type</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1a1a2e;font-weight:500">${type}</p>
      </div>
      <div>
        <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;
          letter-spacing:0.5px;font-weight:700">Incident Date</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1a1a2e;font-weight:500">${incDate}</p>
      </div>
      <div>
        <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;
          letter-spacing:0.5px;font-weight:700">Submitted On</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1a1a2e;font-weight:500">${submitted}</p>
      </div>
      <div>
        <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;
          letter-spacing:0.5px;font-weight:700">Last Updated</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1a1a2e;font-weight:500">${updated}</p>
      </div>
    </div>

    <!-- Description -->
    <p style="margin:0 0 6px;font-size:10px;color:#94a3b8;text-transform:uppercase;
      letter-spacing:0.5px;font-weight:700">Description</p>
    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7">
      ${c.description || 'No description provided.'}
    </p>

    <!-- Timeline -->
    <p style="margin:0 0 14px;font-size:10px;color:#94a3b8;text-transform:uppercase;
      letter-spacing:0.5px;font-weight:700">Status History</p>
    ${timelineHtml}

    <!-- Give Feedback button — only for RESOLVED complaints -->
    ${c.status === 'RESOLVED' ? `
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb">
        <button id="giveFeedbackBtn" style="
          width:100%;padding:12px;
          background:#0d9488;color:#fff;
          border:none;border-radius:10px;
          font-size:14px;font-weight:600;cursor:pointer;
          transition:opacity 0.2s;
        ">
          <i class="fas fa-star" style="margin-right:8px"></i>Give Feedback
        </button>
      </div>
    ` : ''}
  `;

      const feedbackBtn = document.getElementById('giveFeedbackBtn');
      if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
          window._feedbackComplaint = c;
          navigateTo('feedback');
        });
      }
    }
    // ── Render complaint cards ──
    function renderCards(list) {
      if (list.length === 0) {
        cardsPanel.innerHTML = `
        <div style="text-align:center;padding:48px 16px;color:#94a3b8">
          <i class="fas fa-folder-open" style="font-size:36px;display:block;margin-bottom:12px;color:#cbd5e1"></i>
          <p>No complaints found.</p>
        </div>`;
        detailPanel.style.display = 'none';
        return;
      }

      const sorted = [...list].sort((a, b) =>
        new Date(b.created_at || b.incident_date) - new Date(a.created_at || a.incident_date)
      );

      cardsPanel.innerHTML = sorted.map(c => {
        const status = c.status || 'pending';
        const type = typeLabels[c.type] || c.type || 'N/A';
        const incDate = toDisplayDate(c.incident_date);
        const submitted = toDisplayDate(c.created_at || c.incident_date);

        return `
        <div class="complaint-card-item" data-id="${c.id}" style="
          background:#fff;border:2px solid #e5e7eb;border-radius:12px;
          padding:18px 20px;margin-bottom:12px;cursor:pointer;
          transition:border-color 0.2s,box-shadow 0.2s;
        ">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px">
            <div>
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:0.5px">#${c.id}</p>
              <p style="margin:3px 0 0;font-size:15px;font-weight:600;color:#1a1a2e">${c.title}</p>
            </div>
            <span class="status-badge ${statusColors[status]}">${statusLabels[status]}</span>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:8px">
            <span style="font-size:12px;color:#64748b"><i class="fas fa-tag" style="margin-right:4px;color:#94a3b8"></i>${type}</span>
            <span style="font-size:12px;color:#64748b"><i class="fas fa-calendar-alt" style="margin-right:4px;color:#94a3b8"></i>Incident: ${incDate}</span>
            <span style="font-size:12px;color:#64748b"><i class="fas fa-clock" style="margin-right:4px;color:#94a3b8"></i>Submitted: ${submitted}</span>
          </div>

          <p style="margin:0;font-size:13px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${c.description || ''}
          </p>

          <p style="margin:10px 0 0;font-size:12px;color:#0d9488;font-weight:600">
            View details <i class="fas fa-chevron-right" style="font-size:10px"></i>
          </p>
        </div>
      `;
      }).join('');

      // Click to show detail
      document.querySelectorAll('.complaint-card-item').forEach(card => {
        card.addEventListener('click', () => {
          // Highlight active card
          document.querySelectorAll('.complaint-card-item').forEach(c => {
            c.style.borderColor = '#e5e7eb';
            c.style.boxShadow = 'none';
          });
          card.style.borderColor = '#0d9488';
          card.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.12)';

          const complaint = allComplaints.find(c => String(c.id) === card.dataset.id);
          if (complaint) renderDetail(complaint);
        });
      });
    }

    // ── Search ──
    function doSearch() {
      const q = searchInput.value.trim().toLowerCase();
      clearBtn.style.display = q ? 'inline-block' : 'none';
      detailPanel.style.display = 'none';
      document.querySelectorAll('.complaint-card-item').forEach(c => {
        c.style.borderColor = '#e5e7eb';
        c.style.boxShadow = 'none';
      });

      const filtered = q
        ? allComplaints.filter(c =>
          String(c.id).includes(q) ||
          (c.title || '').toLowerCase().includes(q) ||
          (c.type || '').toLowerCase().includes(q)
        )
        : allComplaints;

      renderCards(filtered);
    }

    searchInput.addEventListener('input', doSearch);
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      detailPanel.style.display = 'none';
      renderCards(allComplaints);
    });

    // ── Also handle "View Details" button clicks from dashboard page ──
    // If navigated here with a pre-filled ID (from dashboard btn-view), auto-click
    const prefilledId = window._trackComplaintId;
    if (prefilledId) {
      window._trackComplaintId = null;
      searchInput.value = prefilledId;
      doSearch();
      setTimeout(() => {
        const card = document.querySelector(`.complaint-card-item[data-id="${prefilledId}"]`);
        if (card) card.click();
      }, 100);
    }

    // ── Initial render ──
    renderCards(allComplaints);
  }

  function attachFeedbackListeners() {
    const starsContainer = document.getElementById('ratingStars');
    const stars = document.querySelectorAll('.rating-stars i');
    const form = document.getElementById('feedbackForm');
    let selectedRating = 0;

    if (stars.length) {
      stars.forEach(star => {
        star.addEventListener('mouseenter', function () {
          const rating = parseInt(this.dataset.rating);
          stars.forEach((s, i) => {
            s.classList.toggle('fas', i < rating);
            s.classList.toggle('active', i < rating);
            s.classList.toggle('far', i >= rating);
          });
        });

        star.addEventListener('click', function () {
          selectedRating = parseInt(this.dataset.rating);
        });
      });

      if (starsContainer) {
        starsContainer.addEventListener('mouseleave', () => {
          stars.forEach((s, i) => {
            s.classList.toggle('fas', i < selectedRating);
            s.classList.toggle('active', i < selectedRating);
            s.classList.toggle('far', i >= selectedRating);
          });
        });
      }
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const complaintId = document.getElementById('complaintId').value;

        if (!complaintId) {
          alert('Please select a resolved complaint first.');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
          await apiFetch('/feedback', {
            method: 'POST',
            body: JSON.stringify({
              complaint_id: parseInt(complaintId),
              feedback_type: document.getElementById('feedbackType').value,
              rating: selectedRating,
              message: document.getElementById('feedbackMessage').value
            })
          });

          alert('Thank you for your feedback!');
          form.reset();
          selectedRating = 0;
          stars.forEach(s => {
            s.classList.remove('fas', 'active');
            s.classList.add('far');
          });

        } catch (error) {
          alert('Error: ' + error.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Feedback';
        }
      });
    }
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
    switch (page) {
      case 'dashboard':
        renderDashboardPage();
        break;
      case 'grievance':
        renderGrievancePage();
        break;
      case 'track':
        //window.location.href = '../Track/track.html';
        renderTrackPage();
        break;
      case 'feedback':
        const preselected = window._feedbackComplaint || null;
        window._feedbackComplaint = null;  // clear after use
        renderFeedbackPage(preselected);
        break;
    }

    // Close mobile menu if open
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('active');
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
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        window.location.href = '../Login/login.html';
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
  populateSidebarUser(); // Inject real name/role/avatar from JWT into sidebar
  navigateTo('dashboard');

  // ==================== WINDOW RESIZE HANDLER ====================
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('active');
    }
  });
});