document.addEventListener('DOMContentLoaded', async function () {

  const API_BASE_URL  = 'http://localhost:8080';
  const AUTH_TOKEN_KEY = 'token';

  // ── Auth guard ──
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    window.location.href = '../Login/login.html';
    return;
  }

  // ── DOM ──
  const cardsPanel  = document.getElementById('cardsPanel');
  const detailPanel = document.getElementById('detailPanel');
  const searchInput = document.getElementById('searchInput');
  const clearBtn    = document.getElementById('clearBtn');
  const backBtn     = document.getElementById('backBtn');

  // ── Back button ──
  backBtn.addEventListener('click', () => {
    window.location.href = '../Dashboard/dashboard.html';
  });

  // ── API helper ──
  async function apiFetch(endpoint) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '../Login/login.html';
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Date helper ──
  function toDisplayDate(raw) {
    if (!raw) return 'N/A';
    const date = raw.split('T')[0]; // handles full ISO timestamps
    const [yyyy, mm, dd] = date.split('-');
    if (!yyyy || !mm || !dd) return raw;
    return `${dd}-${mm}-${yyyy}`;
  }

  // ── Label maps ──
  const statusColors = {
    pending:  'status-pending',
    review:   'status-review',
    resolved: 'status-resolved'
  };

  const statusLabels = {
    pending:  'Pending',
    review:   'Under Review',
    resolved: 'Resolved'
  };

  const typeLabels = {
    harassment:     'Harassment',
    discrimination: 'Discrimination',
    bullying:       'Bullying',
    safety:         'Safety Concern',
    other:          'Other'
  };

  // ── Fetch complaints ──
  let allComplaints = [];

  try {
    const data = await apiFetch('/complaints/my');
    allComplaints = Array.isArray(data) ? data : [];
  } catch (err) {
    cardsPanel.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load: ${err.message}</p>
      </div>`;
    return;
  }

  // ── Render cards ──
  function renderCards(list) {
    if (list.length === 0) {
      cardsPanel.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>No complaints found.</p>
        </div>`;
      return;
    }

    const sorted = [...list].sort((a, b) =>
      new Date(b.created_at || b.incident_date) - new Date(a.created_at || a.incident_date)
    );

    cardsPanel.innerHTML = sorted.map(c => {
      const status    = c.status || 'pending';
      const type      = typeLabels[c.type] || c.type || 'N/A';
      const incDate   = toDisplayDate(c.incident_date);
      const submitted = toDisplayDate(c.created_at || c.incident_date);

      return `
        <div class="complaint-card" data-id="${c.id}">
          <div class="card-top">
            <div>
              <div class="card-id">#${c.id}</div>
              <div class="card-title">${c.title}</div>
            </div>
            <span class="status-badge ${statusColors[status]}">${statusLabels[status]}</span>
          </div>
          <div class="card-meta">
            <span><i class="fas fa-tag"></i>${type}</span>
            <span><i class="fas fa-calendar-alt"></i>Incident: ${incDate}</span>
            <span><i class="fas fa-clock"></i>Submitted: ${submitted}</span>
          </div>
          <div class="card-description">${c.description || ''}</div>
          <div class="card-cta">View details <i class="fas fa-chevron-right" style="font-size:10px"></i></div>
        </div>
      `;
    }).join('');

    // Click → show detail
    document.querySelectorAll('.complaint-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.complaint-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const complaint = allComplaints.find(c => String(c.id) === card.dataset.id);
        if (complaint) renderDetail(complaint);
      });
    });
  }

  // ── Build fallback timeline ──
  function buildTimeline(c) {
    // If backend ever adds a real timeline array, use it
    if (Array.isArray(c.timeline) && c.timeline.length > 0) return c.timeline;

    const events = [{
      title: 'Complaint Submitted',
      date: c.created_at || c.incident_date,
      description: 'Your complaint was received and logged successfully.'
    }];

    if (c.status === 'review' || c.status === 'resolved') {
      events.push({
        title: 'Under Review',
        date: c.updated_at || c.created_at,
        description: 'Your complaint is currently being reviewed by our team.'
      });
    }

    if (c.status === 'resolved') {
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
    const status    = c.status || 'pending';
    const type      = typeLabels[c.type] || c.type || 'N/A';
    const incDate   = toDisplayDate(c.incident_date);
    const submitted = toDisplayDate(c.created_at || c.incident_date);
    const updated   = toDisplayDate(c.updated_at || c.created_at);
    const events    = buildTimeline(c);

    const timelineHtml = events.map((event, i) => {
      const isLast = i === events.length - 1;
      return `
        <div class="timeline-item">
          <div class="timeline-dot-col">
            <div class="timeline-dot ${isLast ? 'active' : ''}"></div>
            ${!isLast ? '<div class="timeline-line"></div>' : ''}
          </div>
          <div class="timeline-content">
            <div class="timeline-event-title">${event.title}</div>
            <div class="timeline-date">${toDisplayDate(event.date)}</div>
            ${event.description ? `<div class="timeline-desc">${event.description}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    detailPanel.classList.remove('hidden');
    detailPanel.innerHTML = `
      <div class="detail-top">
        <div>
          <div class="detail-id">#${c.id}</div>
          <div class="detail-title">${c.title}</div>
        </div>
        <span class="status-badge ${statusColors[status]}">${statusLabels[status]}</span>
      </div>

      <div class="detail-meta-grid">
        <div class="meta-item">
          <p>Type</p>
          <p>${type}</p>
        </div>
        <div class="meta-item">
          <p>Incident Date</p>
          <p>${incDate}</p>
        </div>
        <div class="meta-item">
          <p>Submitted On</p>
          <p>${submitted}</p>
        </div>
        <div class="meta-item">
          <p>Last Updated</p>
          <p>${updated}</p>
        </div>
      </div>

      <div class="detail-section-label">Description</div>
      <div class="detail-description">${c.description || 'No description provided.'}</div>

      <div class="detail-section-label">Status History</div>
      <div class="timeline">${timelineHtml}</div>
    `;
  }

  // ── Search ──
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    clearBtn.classList.toggle('hidden', !q);

    // Reset detail when search changes
    detailPanel.classList.add('hidden');
    document.querySelectorAll('.complaint-card').forEach(c => c.classList.remove('active'));

    if (!q) {
      renderCards(allComplaints);
      return;
    }

    const filtered = allComplaints.filter(c =>
      String(c.id).includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.type  || '').toLowerCase().includes(q)
    );
    renderCards(filtered);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    detailPanel.classList.add('hidden');
    renderCards(allComplaints);
  });

  // ── Initial render ──
  renderCards(allComplaints);
});