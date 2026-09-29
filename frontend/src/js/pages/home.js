document.addEventListener('DOMContentLoaded', () => {
  // 1. Scroll suave al inicio
  window.scrollToTop = function(e) {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. ScrollSpy & Navbar
  const header = document.getElementById('mainHeader');
  const navLinks = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('main[id], section[id]');

  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;

    if (scrollPos > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if ((window.innerHeight + scrollPos) >= document.body.offsetHeight - 80) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === 'faq') {
          link.classList.add('active');
        }
      });
      return;
    }

    let currentSectionId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === currentSectionId) {
          link.classList.add('active');
        }
      });
    }
  });

  // 3. Menú móvil
  window.toggleMobileMenu = function() {
    const m = document.getElementById('mobileMenu');
    if (m) m.classList.toggle('open');
  };

  // 4. Toast
  let toastTimeout;
  window.showToast = function(title, msg) {
    const t = document.getElementById('toastBox');
    if (!t) return;
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { t.classList.remove('show'); }, 3200);
  };

  // 5. Canvas de partículas
  const canvas = document.getElementById('bgCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 0.5,
        speedY: -(Math.random() * 0.35 + 0.1),
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1db869';
      particles.forEach(p => {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speedY;
        if (p.y < 0) { p.y = h; p.x = Math.random() * w; }
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // 6. Parallax 3D Tracker del Celular
  const phone = document.getElementById('interactivePhone');
  window.addEventListener('mousemove', (e) => {
    if (!phone) return;
    const rect = phone.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / 30;
    const y = (e.clientY - (rect.top + rect.height / 2)) / 30;
    phone.style.transform = `rotateY(${-16 + x * 0.6}deg) rotateX(${7 - y * 0.6}deg) rotateZ(2deg)`;
  });

  // 7. Reloj en vivo
  function updateClock() {
    const d = new Date();
    const m = d.getMinutes().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const el = document.getElementById('liveClock');
    if (el) el.textContent = `${h}:${m}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 8. Actualización interactiva del Mockup
  let currentSelectedZoneId = 'centro-a';
  window.updateMockup = function(name, address, spots, price, zoneId) {
    currentSelectedZoneId = zoneId;
    document.getElementById('mkTitle').textContent = name;
    document.getElementById('mkAddress').textContent = address;
    document.getElementById('mkSpots').textContent = spots + ' espacios disponibles';
    document.getElementById('mkPrice').textContent = price;
    const btn = document.getElementById('btnReserveDemo');
    if (btn) {
      btn.textContent = 'Confirmar Reserva';
      btn.style.background = 'linear-gradient(90deg, #2b7ec9 0%, #1db869 100%)';
    }
    window.showToast(name, 'Zona seleccionada en el radar GPS');
  };

  // 9. Simular reserva celular
  window.executePhoneBooking = function() {
    const btn = document.getElementById('btnReserveDemo');
    if (btn) {
      btn.textContent = '✓ ¡CUPÓ APARTADO!';
      btn.style.background = '#1db869';
    }
    window.showToast('Reserva confirmada', 'Redirigiendo a pasarela de pago...');
    setTimeout(() => {
      window.location.href = '/pagos?zoneId=' + currentSelectedZoneId;
    }, 1200);
  };

  // 10. Calculadora
  window.calculateTotal = function() {
    const pricePerHr = parseInt(document.getElementById('calcZone').value);
    const hrs = parseInt(document.getElementById('calcHours').value);
    document.getElementById('calcHoursText').textContent = hrs + (hrs === 1 ? ' hora' : ' horas');
    const total = pricePerHr * hrs;
    document.getElementById('calcTotal').textContent = '$' + total.toLocaleString('es-CO') + ' COP';
  };

  window.goToBookingWithEstimate = function() {
    window.showToast('Tarifa fijada', 'Redirigiendo al proceso de reserva...');
    setTimeout(() => {
      window.location.href = '/zonas';
    }, 1000);
  };

  // 11. FAQ Acordeón
  window.toggleFaq = function(id) {
    const ans = document.getElementById('faqAns' + id);
    const icon = document.getElementById('faqIcon' + id);
    if (!ans || !icon) return;
    if (ans.style.display === 'none' || ans.style.display === '') {
      ans.style.display = 'block';
      icon.textContent = '−';
    } else {
      ans.style.display = 'none';
      icon.textContent = '+';
    }
  };
});