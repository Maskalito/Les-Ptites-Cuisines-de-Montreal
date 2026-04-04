/* =====================================================
   Les P'tites Cuisines de Montréal — Script JS
   ===================================================== */

const API = '/api';

document.addEventListener('DOMContentLoaded', () => {
  loadTestimonials();
  initStarPicker();
  initNavScroll();
  initRevealAnimations();
  initMobileMenu();
});

async function loadTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;
  try {
    const res  = await fetch(`${API}/testimonials`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (data.length === 0) {
      grid.innerHTML = '<p class="testimonials__empty">Aucun témoignage pour l\'instant. Sois le premier !</p>';
      return;
    }
    grid.innerHTML = data.map(renderTestimonial).join('');
    grid.querySelectorAll('.testimonial').forEach((el, i) => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(24px)';
      el.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
      setTimeout(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      }, 50);
    });
  } catch (err) {
    console.error('Erreur chargement témoignages:', err);
    grid.innerHTML = '<p class="testimonials__empty">Impossible de charger les témoignages.</p>';
  }
}

function renderTestimonial(t) {
  const stars    = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
  const initials = t.author_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return `
    <div class="testimonial">
      <div class="testimonial__stars">${stars}</div>
      <p class="testimonial__text">"${t.content}"</p>
      <div class="testimonial__author">
        <div class="testimonial__avatar">${initials}</div>
        <div>
          <strong>${t.author_name}</strong>
          ${t.university ? `<span>${t.university}</span>` : ''}
        </div>
      </div>
    </div>`;
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = {
    first_name: form.first_name.value.trim(),
    email:      form.email.value.trim(),
    university: form.university.value || null,
    plan:       form.plan.value || null,
  };

  btn.disabled    = true;
  btn.textContent = 'Envoi en cours…';
  try {
    const res  = await fetch(`${API}/signups`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    showToast(`Merci ${data.first_name} ! 🎉 On te contacte très bientôt pour ta première session gratuite.`);
    form.reset();
  } catch (err) {
    showToast(`Erreur : ${err.message}`, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Réserver ma place gratuite ✦';
  }
}

async function handleTestimonialSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = {
    author_name: form.author_name.value.trim(),
    university:  form.university.value.trim() || null,
    content:     form.content.value.trim(),
    rating:      parseInt(form.rating.value) || 5,
  };

  btn.disabled    = true;
  btn.textContent = 'Envoi en cours…';
  try {
    const token = localStorage.getItem('ptites_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res  = await fetch(`${API}/testimonials`, {
      method: 'POST',
      headers,
      body:   JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    showToast('Témoignage envoyé ! Il sera publié après validation. Merci 🙌');
    form.reset();
    resetStars();
  } catch (err) {
    showToast(`Erreur : ${err.message}`, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Envoyer mon témoignage';
  }
}

function initStarPicker() {
  const picker = document.getElementById('starPicker');
  const input  = document.getElementById('ratingInput');
  if (!picker) return;

  const stars = picker.querySelectorAll('.star');
  let selected = 5;

  function highlight(n) {
    stars.forEach((s, i) => s.classList.toggle('active', i < n));
  }

  highlight(selected);

  stars.forEach((star, idx) => {
    star.addEventListener('mouseenter', () => highlight(idx + 1));
    star.addEventListener('mouseleave', () => highlight(selected));
    star.addEventListener('click', () => {
      selected    = idx + 1;
      input.value = selected;
      highlight(selected);
    });
  });
}

function resetStars() {
  const input = document.getElementById('ratingInput');
  if (input) input.value = 5;
  document.querySelectorAll('#starPicker .star').forEach((s, i) => {
    s.classList.toggle('active', i < 5);
  });
}

function initNavScroll() {
  const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  const sections = document.querySelectorAll('section[id]');

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );
  sections.forEach((s) => obs.observe(s));

  window.addEventListener('scroll', () => {
    document.querySelector('.nav').style.boxShadow =
      window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.08)' : 'none';
  });
}

function initMobileMenu() {
  const burger   = document.querySelector('.nav__burger');
  const navLinks = document.querySelector('.nav__links');
  if (!burger) return;

  burger.addEventListener('click', () => {
    const isOpen = navLinks.dataset.open === 'true';
    if (isOpen) {
      navLinks.removeAttribute('style');
      navLinks.dataset.open = 'false';
    } else {
      Object.assign(navLinks.style, {
        display:       'flex',
        flexDirection: 'column',
        position:      'absolute',
        top:           '68px',
        left:          '0',
        right:         '0',
        background:    'white',
        padding:       '24px',
        borderBottom:  '1px solid #e8f0eb',
        boxShadow:     '0 8px 24px rgba(0,0,0,0.08)',
        gap:           '16px',
      });
      navLinks.dataset.open = 'true';
    }
  });
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.removeAttribute('style');
      navLinks.dataset.open = 'false';
    });
  });
}

function initRevealAnimations() {
  const els = document.querySelectorAll(
    '.problem-card, .step, .value-card, .testimonial, .pricing-card, .impact-item'
  );
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
    obs.observe(el);
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast toast--${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 5000);
}
