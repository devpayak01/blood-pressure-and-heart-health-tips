// Minimal site-wide enhancements: active nav, year, reveal animations, and tracker chart logic
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mark active nav by URL
  const links = document.querySelectorAll('a.nav-link');
  links.forEach((a) => {
    try {
      const href = a.getAttribute('href');
      if (!href) return;
      const isActive = location.pathname.endsWith(href) || (href === 'index.html' && (location.pathname.endsWith('/') || location.pathname.endsWith('index.html')));
      if (isActive) a.classList.add('text-brand-700');
    } catch (_) {}
  });

  // Initialize AOS if present
  if (window.AOS) {
    window.AOS.init({
      duration: 700,
      once: true,
      easing: 'ease-out-quart',
      offset: 60,
    });
  } else {
    // Fallback: simple reveal for elements marked card-reveal
    const revealEls = document.querySelectorAll('.card-reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeUp');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('animate-fadeUp'));
    }
  }

  // Tracker page logic
  const chartCanvas = document.getElementById('bpChart');
  if (chartCanvas && window.Chart) {
    const storageKey = 'bp-readings-v1';
    const readingDatetime = document.getElementById('reading-datetime');
    const readingSys = document.getElementById('reading-sys');
    const readingDia = document.getElementById('reading-dia');
    const readingNotes = document.getElementById('reading-notes');
    const form = document.getElementById('bp-form');
    const clearBtn = document.getElementById('clear-data');

    function loadReadings() {
      try {
        const json = localStorage.getItem(storageKey);
        return json ? JSON.parse(json) : [];
      } catch (e) {
        return [];
      }
    }
    function saveReadings(readings) {
      localStorage.setItem(storageKey, JSON.stringify(readings));
    }

    function sortReadings(readings) {
      return readings.sort((a, b) => new Date(a.dt).getTime() - new Date(b.dt).getTime());
    }

    let readings = sortReadings(loadReadings());

    const ctx = chartCanvas.getContext('2d');
    let chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: readings.map((r) => new Date(r.dt).toLocaleString()),
        datasets: [
          {
            label: 'Systolic',
            data: readings.map((r) => r.sys),
            borderColor: '#4d87ff',
            backgroundColor: 'rgba(77,135,255,0.15)',
            tension: 0.35,
            fill: true,
          },
          {
            label: 'Diastolic',
            data: readings.map((r) => r.dia),
            borderColor: '#ff2d57',
            backgroundColor: 'rgba(255,45,87,0.12)',
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false },
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: false, suggestedMin: 60, suggestedMax: 160 },
        },
      },
    });

    function refreshChart() {
      chart.data.labels = readings.map((r) => new Date(r.dt).toLocaleString());
      chart.data.datasets[0].data = readings.map((r) => r.sys);
      chart.data.datasets[1].data = readings.map((r) => r.dia);
      chart.update();
    }

    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dt = readingDatetime && readingDatetime.value ? readingDatetime.value : new Date().toISOString();
      const sys = readingSys && readingSys.value ? Number(readingSys.value) : NaN;
      const dia = readingDia && readingDia.value ? Number(readingDia.value) : NaN;
      const notes = readingNotes && readingNotes.value ? readingNotes.value.trim() : '';
      if (!Number.isFinite(sys) || !Number.isFinite(dia)) return;
      readings.push({ dt, sys, dia, notes });
      readings = sortReadings(readings);
      saveReadings(readings);
      refreshChart();
      if (form) form.reset();
    });

    clearBtn && clearBtn.addEventListener('click', () => {
      readings = [];
      saveReadings(readings);
      refreshChart();
    });
  }
})();


