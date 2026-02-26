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
      { icon: '🔒', title: 'End-to-End Encryption', desc: 'Your reports are encrypted from the moment you submit. No one can access your data without authorization.' },
      { icon: '👁️', title: 'Anonymous Reporting', desc: 'Choose to report anonymously. Your identity stays protected throughout the entire process.' },
      { icon: '⚖️', title: 'Legal Protection', desc: 'Access legal resources and connect with verified advocates who can guide you through your options.' },
      { icon: '🔔', title: 'Real-Time Updates', desc: 'Track the status of your report with instant notifications at every stage.' },
      { icon: '🤝', title: 'Community Support', desc: 'Connect with support groups and a community of survivors to share your journey.' },
      { icon: '📄', title: 'Evidence Management', desc: 'Securely upload and store evidence. All files are encrypted and timestamped for legal validity.' }
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
      ['01', 'Submit Your Report', 'Fill out a secure form with details of the incident. You can choose to remain anonymous.'],
      ['02', 'Verification & Review', 'Our trained team reviews your report while maintaining strict confidentiality protocols.'],
      ['03', 'Action & Support', 'Appropriate action is taken and you receive support resources tailored to your situation.']
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
      ['1 in 3', 'women experience harassment in the workplace'],
      ['70%', 'of incidents go unreported due to fear'],
      ['85%', 'of survivors say they lacked a safe channel']
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