 // ===== Always land on hero after refresh =====
 if ('scrollRestoration' in history) {
   history.scrollRestoration = 'manual';
 }
 if (location.hash) {
   history.replaceState(null, '', location.pathname + location.search);
 }
 window.scrollTo(0, 0);
 window.addEventListener('load', () => {
   window.scrollTo(0, 0);
 });

 // ===== Header scroll state =====
 const header = document.getElementById('siteHeader');
 window.addEventListener('scroll', () => {
   header.classList.toggle('scrolled', window.scrollY > 40);
 }, { passive: true });

 // ===== Mobile menu =====
 const burger = document.getElementById('burger');
 const navLinks = document.querySelector('nav.links');

 function closeMobileNav() {
   navLinks.classList.remove('open');
   burger.setAttribute('aria-expanded', 'false');
 }

 function toggleMobileNav() {
   const willOpen = !navLinks.classList.contains('open');
   navLinks.classList.toggle('open', willOpen);
   burger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
 }

 burger.setAttribute('aria-expanded', 'false');
 burger.setAttribute('aria-controls', 'siteNav');
 burger.addEventListener('click', toggleMobileNav);

 navLinks.querySelectorAll('a').forEach(link => {
   link.addEventListener('click', closeMobileNav);
 });

 window.addEventListener('resize', () => {
   if (window.innerWidth > 760) closeMobileNav();
 });

 // ===== Scroll reveal =====
 const revealEls = document.querySelectorAll('.reveal, .process-step');
 const io = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
     if (entry.isIntersecting) {
       entry.target.classList.add('visible');
     }
   });
 }, { threshold: 0.18 });
 revealEls.forEach(el => io.observe(el));

 // ===== Process connector line draw =====
 const processTrack = document.getElementById('processTrack');
 const processFill = document.getElementById('processFill');
 const processIo = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
     if (entry.isIntersecting) {
       processFill.style.width = '100%';
     }
   });
 }, { threshold: 0.3 });
 processIo.observe(processTrack);

 // ===== Animated counters =====
 const counters = document.querySelectorAll('.trust-num');
 const counterIo = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
     if (entry.isIntersecting) {
       const el = entry.target;
       const target = parseFloat(el.dataset.count);
       const decimals = el.dataset.decimal ? 1 : 0;
       const suffix = el.dataset.suffix || '';
       const duration = 1400;
       const start = performance.now();
       function tick(now) {
         const p = Math.min((now - start) / duration, 1);
         const eased = 1 - Math.pow(1 - p, 3);
         const val = decimals ? (target * eased).toFixed(1) : Math.floor(target * eased);
         el.textContent = val + suffix;
         if (p < 1) requestAnimationFrame(tick);
       }
       requestAnimationFrame(tick);
       counterIo.unobserve(el);
     }
   });
 }, { threshold: 0.6 });
 counters.forEach(c => counterIo.observe(c));

 // ===== Before / After drag slider =====
 const baWrap = document.getElementById('baWrap');
 const baBefore = document.getElementById('baBefore');
 const baHandle = document.getElementById('baHandle');
 let dragging = false;

 function setSlider(x) {
   const rect = baWrap.getBoundingClientRect();
   let pct = ((x - rect.left) / rect.width) * 100;
   pct = Math.max(0, Math.min(100, pct));
   baBefore.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
   baHandle.style.left = pct + '%';
 }

 baWrap.addEventListener('pointerdown', (e) => {
   dragging = true;
   setSlider(e.clientX);
   baWrap.setPointerCapture(e.pointerId);
 });
 baWrap.addEventListener('pointermove', (e) => {
   if (dragging) setSlider(e.clientX);
 });
 baWrap.addEventListener('pointerup', () => dragging = false);
 baWrap.addEventListener('pointercancel', () => dragging = false);

 // gentle auto demo sweep on first view
 const baIo = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
     if (entry.isIntersecting) {
       let pct = 50, dir = 1, steps = 0;
       const sweep = setInterval(() => {
         pct += dir * 0.6;
         if (pct >= 72 || pct <= 28) dir *= -1;
         baBefore.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
         baHandle.style.left = pct + '%';
         steps++;
         if (steps > 140) clearInterval(sweep);
       }, 16);
       baIo.unobserve(baWrap);
     }
   });
 }, { threshold: 0.5 });
 baIo.observe(baWrap);

 // ===== Booking modal and email flow =====
 const bookingModal = document.getElementById('bookingModal');
 const bookingButtons = document.querySelectorAll('.open-booking');
 const bookingBackdrop = document.getElementById('bookingBackdrop');
 const bookingClose = document.getElementById('bookingClose');
 const bookingCancel = document.getElementById('bookingCancel');
 const bookingForm = document.getElementById('bookingForm');
 const bookingService = document.getElementById('bookingService');
 const otherServiceWrap = document.getElementById('otherServiceWrap');
 const otherServiceInput = document.getElementById('otherService');
 const serviceCards = document.querySelectorAll('.booking-service-card');
 const bookingSteps = document.querySelectorAll('.booking-step');
 const bookingServices = document.getElementById('bookingServices');
 const bookingFormNote = document.getElementById('bookingFormNote');
 const bookingSubmitBtn = bookingForm.querySelector('button[type="submit"]');

 function setActiveServiceCard(value) {
   serviceCards.forEach(card => {
     const isActive = card.dataset.service === value;
     card.classList.toggle('active', isActive);
     card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
   });
 }

  function updateBookingSteps() {
    const hasService = !!bookingService.value;
    const nameOk = !!document.getElementById('bookingName')?.value.trim();
    const emailOk = !!document.getElementById('bookingEmail')?.value.trim();
    const addressOk = !!document.getElementById('bookingAddress')?.value.trim();
    const hasDetails = nameOk && emailOk && addressOk;
    const hasSchedule = !!document.getElementById('bookingDate')?.value && !!document.getElementById('bookingTime')?.value;

    let current = 0;
    if (hasService) current = 1;
    if (hasService && hasDetails) current = 2;

    bookingSteps.forEach((step, index) => {
      step.classList.toggle('active', index === current);
      step.classList.toggle('done', index < current || (index === 2 && hasSchedule));
    });
  }

 serviceCards.forEach(card => {
   card.addEventListener('click', () => {
     bookingService.value = card.dataset.service;
     bookingService.dispatchEvent(new Event('change'));
     setActiveServiceCard(card.dataset.service);
     updateBookingSteps();
   });
 });

 ['bookingName', 'bookingEmail', 'bookingAddress', 'bookingDate', 'bookingTime'].forEach(id => {
   document.getElementById(id)?.addEventListener('input', updateBookingSteps);
 });

 function openBookingModal() {
   bookingModal.classList.add('open');
   bookingModal.setAttribute('aria-hidden', 'false');
   document.body.style.overflow = 'hidden';
   bookingFormNote.textContent = 'No payment required now — we\'ll confirm availability and pricing by email.';
   bookingFormNote.style.color = '';
 }

 function closeBookingModal() {
   bookingModal.classList.remove('open');
   bookingModal.setAttribute('aria-hidden', 'true');
   document.body.style.overflow = '';
   bookingSubmitBtn.disabled = false;
 }

 bookingButtons.forEach(button => {
   button.addEventListener('click', (event) => {
     event.preventDefault();
     openBookingModal();
   });
 });

 [bookingBackdrop, bookingClose, bookingCancel].forEach(control => {
   control.addEventListener('click', (event) => {
     event.preventDefault();
     closeBookingModal();
   });
 });

 document.addEventListener('keydown', (event) => {
   if (event.key === 'Escape' && bookingModal.classList.contains('open')) {
     closeBookingModal();
   }
 });

 bookingService.addEventListener('change', () => {
   if (bookingService.value === 'Other') {
     otherServiceWrap.classList.remove('hidden');
     otherServiceInput.required = true;
   } else {
     otherServiceWrap.classList.add('hidden');
     otherServiceInput.required = false;
     otherServiceInput.value = '';
   }
   updateBookingSteps();
 });

 bookingForm.addEventListener('submit', handleBookingSubmit);

 function showBookingError(message, field) {
   bookingFormNote.textContent = message;
   bookingFormNote.style.color = '#c0392b';
   const main = document.querySelector('.booking-main');
   if (field && typeof field.focus === 'function') {
     try { field.focus({ preventScroll: true }); } catch (_) { field.focus(); }
     if (main) {
       const top = field.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 24;
       main.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
     }
   } else if (main) {
     main.scrollTo({ top: 0, behavior: 'smooth' });
   }
 }

 async function handleBookingSubmit(event) {
   event.preventDefault();
   event.stopPropagation();

   const nameInput = document.getElementById('bookingName');
   const emailInput = document.getElementById('bookingEmail');
   const addressInput = document.getElementById('bookingAddress');
   const dateInput = document.getElementById('bookingDate');
   const timeInput = document.getElementById('bookingTime');

   if (!bookingService.value) {
     showBookingError('Please choose a service first.', bookingServices);
     return;
   }
   if (bookingService.value === 'Other' && !otherServiceInput.value.trim()) {
     showBookingError('Please describe the service you need.', otherServiceInput);
     return;
   }
   if (!nameInput.value.trim()) {
     showBookingError('Please enter your full name.', nameInput);
     return;
   }
   if (!emailInput.value.trim() || !emailInput.checkValidity()) {
     showBookingError('Please enter a valid email address.', emailInput);
     return;
   }
   if (!addressInput.value.trim()) {
     showBookingError('Please enter your address.', addressInput);
     return;
   }
   if (!dateInput.value) {
     showBookingError('Please pick a preferred date.', dateInput);
     return;
   }
   if (!timeInput.value) {
     showBookingError('Please pick a preferred time.', timeInput);
     return;
   }

   const formData = new FormData(bookingForm);
   const service = formData.get('service');
   const otherService = (formData.get('otherService') || '').trim();
   const serviceLabel = service === 'Other' ? (otherService || 'Other') : service;
   formData.set('service', serviceLabel);
   document.getElementById('bookingSubject').value = `ShineExpress booking from ${formData.get('name')}`;

   const originalText = bookingSubmitBtn.textContent;
   bookingSubmitBtn.disabled = true;
   bookingSubmitBtn.textContent = 'Sending...';
   bookingFormNote.textContent = 'Sending your booking...';
   bookingFormNote.style.color = '';

   try {
     const response = await fetch(bookingForm.action, {
       method: 'POST',
       body: formData,
       headers: { Accept: 'application/json' }
     });

     if (response.ok) {
       closeBookingModal();
       bookingForm.reset();
       serviceCards.forEach(card => {
         card.classList.remove('active');
         card.setAttribute('aria-pressed', 'false');
       });
       otherServiceWrap.classList.add('hidden');
       otherServiceInput.required = false;
       updateBookingSteps();
       bookingFormNote.textContent = 'Booking sent! ShineExpress will confirm your visit by email.';
       bookingFormNote.style.color = 'var(--ink)';
     } else {
       const data = await response.json().catch(() => ({}));
       bookingFormNote.textContent = data.error || 'Could not send booking. Please try again or email shineexpressfi@gmail.com.';
       bookingFormNote.style.color = '#c0392b';
     }
   } catch {
     bookingFormNote.textContent = 'Could not send booking. Please try again or email shineexpressfi@gmail.com.';
     bookingFormNote.style.color = '#c0392b';
   } finally {
     bookingSubmitBtn.disabled = false;
     bookingSubmitBtn.textContent = originalText;
   }
 }