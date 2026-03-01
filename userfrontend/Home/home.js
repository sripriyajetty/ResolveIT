// home.js – dynamic content and navigation to login

// Redirect to login page (in a real multi-page setup, you'd change window.location)
// Here we simulate by opening login.html in the same tab.
function goToLogin() {
  window.location.href = '../Login/login.html';
}

// Attach event listeners after DOM loads
document.addEventListener('DOMContentLoaded', function () {
  // All "Report Now" / "File a Report" buttons
  const reportButtons = document.querySelectorAll('#reportNowBtn, #fileReportBtn, #ctaReportBtn');
  reportButtons.forEach(btn => {
    btn.addEventListener('click', goToLogin);
  });

  // Learn More smooth scroll
  const learnMore = document.getElementById('learnMoreBtn');
  if (learnMore) {
    learnMore.addEventListener('click', () => {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Populate features dynamically (same as React)
  const featuresGrid = document.querySelector('.features-grid');
  if (featuresGrid) {
    const features = [
  {
    icon: '🛡️',
    title: 'Confidential & Secure Complaints',
    desc: 'Submit grievances in a protected environment. Only authorized committee members can access case details, ensuring privacy and dignity.'
  },
  {
    icon: '🕵️',
    title: 'Anonymous Reporting Option',
    desc: 'Report incidents anonymously if you choose. Your identity remains hidden while your complaint is still reviewed seriously.'
  },
  {
    icon: '📊',
    title: 'Transparent Case Tracking',
    desc: 'Monitor the status of your grievance in real-time — from submission to resolution — with clear progress updates.'
  },
  {
    icon: '⚖️',
    title: 'Structured Review & Escalation',
    desc: 'Committee members analyze cases, update statuses, and escalate unresolved issues to ensure timely action.'
  },
  {
    icon: '👩‍💼',
    title: 'Administrative Oversight',
    desc: 'Admins manage users, assign committee members, monitor escalations, and maintain accountability through audit logs.'
  },
  {
    icon: '📂',
    title: 'Secure Evidence Upload',
    desc: 'Upload documents, screenshots, or media securely. All evidence is stored safely and linked to your grievance for review.'
  }
];
    featuresGrid.innerHTML = features.map(f => `
      <div class="feat-card">
        <div class="feat-icon"><span>${f.icon}</span></div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
      </div>
    `).join('');
  }

  // Steps (How it works)
  const stepsContainer = document.getElementById('stepsContainer');
  if (stepsContainer) {
    const steps = [
    ['01','Register & Submit Grievance','Login or register securely, fill in incident details, and upload supporting evidence. You may choose to report anonymously.'],
    ['02','Committee Review','Assigned committee members analyze the grievance, update its status, and communicate progress through the dashboard.'],
    ['03','Resolution or Escalation','The case is resolved with appropriate action or escalated to higher authorities if required. Admin monitors the entire process for accountability.']
    ];
    let stepsHtml = '';
    steps.forEach((step, index) => {
      stepsHtml += `
        <div class="step-item">
          <div class="step-number">${step[0]}</div>
          <h3 class="step-title">${step[1]}</h3>
          <p class="step-desc">${step[2]}</p>
        </div>
      `;
      if (index < steps.length - 1) {
        stepsHtml += `<div class="step-divider"><div class="divider-line"></div></div>`;
      }
    });
    stepsContainer.innerHTML = stepsHtml;
  }

  // Impact stats
  const impactGrid = document.getElementById('impactGrid');
  if (impactGrid) {
    const impactData = [
      ['1 in 3', 'women report experiencing harassment in professional or academic spaces'],
  ['Up to 70%', 'of incidents remain unreported due to fear of retaliation or lack of trust in systems'],
  ['Safe Reporting', 'increases accountability and improves institutional response times']
    ];
    impactGrid.innerHTML = impactData.map(([val, label]) => `
      <div class="impact-card">
        <div class="stat">${val}</div>
        <div class="label">${label}</div>
      </div>
    `).join('');
  }

  // Prevent default on footer links (they are #)
  document.querySelectorAll('.footer-links a[href="#"]').forEach(link => {
    link.addEventListener('click', e => e.preventDefault());
  });

  // Rotating hero background images
  const heroBackground = document.getElementById('heroBackground');
  if (heroBackground) {
    const backgroundImages = [
      '../assets/women.jpg',
      '../assets/women1.jpg',
      '../assets/women2.jpg'
      // Add more image paths as needed
    ];
    
    let currentImageIndex = 0;
    
    const changeBackgroundImage = () => {
      heroBackground.style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`;
      currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
    };
    
    // Set initial image
    changeBackgroundImage();
    
    // Change image every 5 seconds
    setInterval(changeBackgroundImage, 5000);
  }
});