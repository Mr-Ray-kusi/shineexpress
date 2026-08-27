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
 const bookingDateInput = document.getElementById('bookingDate');
 const bookingTimeInput = document.getElementById('bookingTime');
 const bookingSlotsEl = document.getElementById('bookingSlots');
 const bookingTimeHint = document.getElementById('bookingTimeHint');
 const bookingIdInput = document.getElementById('bookingId');
 const bookingToast = document.getElementById('bookingToast');

 const CUSTOMER_ID_PATTERN = /^[0-9]{6}-[0-9]{3}[A-Za-z0-9]$/;
 const BOOKING_SUBJECT = 'NEW form submission on Shineexpress Apartment Cleaning Service';
 const TIME_SLOTS = [
   '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
   '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
   '18:00', '19:00', '20:00'
 ];

 let bookingToastTimer = null;

 function showBookingToast(message, type) {
   if (!bookingToast) return;
   if (bookingToastTimer) {
     clearTimeout(bookingToastTimer);
     bookingToastTimer = null;
   }
   bookingToast.textContent = message;
   bookingToast.hidden = false;
   bookingToast.classList.remove('is-success', 'is-error', 'is-visible');
   bookingToast.classList.add(type === 'error' ? 'is-error' : 'is-success');
   requestAnimationFrame(() => {
     bookingToast.classList.add('is-visible');
   });
   bookingToastTimer = setTimeout(() => {
     bookingToast.classList.remove('is-visible');
     bookingToastTimer = setTimeout(() => {
       bookingToast.hidden = true;
       bookingToast.textContent = '';
       bookingToast.classList.remove('is-success', 'is-error');
       bookingToastTimer = null;
     }, 350);
   }, 5500);
 }

 function formatSlotLabel(time) {
   const [h, m] = time.split(':').map(Number);
   const date = new Date();
   date.setHours(h, m, 0, 0);
   return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
 }

 function todayIsoDate() {
   const now = new Date();
   const y = now.getFullYear();
   const m = String(now.getMonth() + 1).padStart(2, '0');
   const d = String(now.getDate()).padStart(2, '0');
   return `${y}-${m}-${d}`;
 }

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
   const phoneOk = !!document.getElementById('bookingPhone')?.value.trim();
   const idOk = CUSTOMER_ID_PATTERN.test((bookingIdInput?.value || '').trim());
   const addressOk = !!document.getElementById('bookingAddress')?.value.trim();
   const hasDetails = nameOk && emailOk && phoneOk && idOk && addressOk;
   const hasSchedule = !!bookingDateInput?.value && !!bookingTimeInput?.value;

   let current = 0;
   if (hasService) current = 1;
   if (hasService && hasDetails) current = 2;

   bookingSteps.forEach((step, index) => {
     step.classList.toggle('active', index === current);
     step.classList.toggle('done', index < current || (index === 2 && hasSchedule));
   });
 }

 function renderBookingSlots() {
   if (!bookingSlotsEl || !bookingDateInput || !bookingTimeInput) return;

   const dateValue = bookingDateInput.value;
   const selected = bookingTimeInput.value;
   bookingSlotsEl.innerHTML = '';

   if (!dateValue) {
     if (bookingTimeHint) {
       bookingTimeHint.textContent = 'Pick a date first, then choose any time.';
     }
     bookingTimeInput.value = '';
     updateBookingSteps();
     return;
   }

   if (bookingTimeHint) {
     bookingTimeHint.textContent = 'All times are available — pick the slot that works best for you.';
   }

   TIME_SLOTS.forEach((time) => {
     const button = document.createElement('button');
     button.type = 'button';
     button.className = 'booking-slot';
     button.dataset.time = time;
     button.setAttribute('role', 'option');
     button.setAttribute('aria-selected', selected === time ? 'true' : 'false');
     if (selected === time) button.classList.add('is-selected');
     button.textContent = formatSlotLabel(time);
     button.addEventListener('click', () => {
       bookingTimeInput.value = time;
       renderBookingSlots();
       updateBookingSteps();
     });
     bookingSlotsEl.appendChild(button);
   });

   updateBookingSteps();
 }

 serviceCards.forEach(card => {
   card.addEventListener('click', () => {
     bookingService.value = card.dataset.service;
     bookingService.dispatchEvent(new Event('change'));
     setActiveServiceCard(card.dataset.service);
     updateBookingSteps();
   });
 });

 ['bookingName', 'bookingEmail', 'bookingPhone', 'bookingId', 'bookingAddress'].forEach(id => {
   document.getElementById(id)?.addEventListener('input', updateBookingSteps);
 });

 bookingDateInput?.addEventListener('change', () => {
   bookingTimeInput.value = '';
   renderBookingSlots();
 });
 bookingDateInput?.addEventListener('input', () => {
   bookingTimeInput.value = '';
   renderBookingSlots();
 });

 function openBookingModal() {
   bookingModal.classList.add('open');
   bookingModal.setAttribute('aria-hidden', 'false');
   document.body.style.overflow = 'hidden';
   if (bookingDateInput) {
     bookingDateInput.min = todayIsoDate();
     if (!bookingDateInput.value) bookingDateInput.value = todayIsoDate();
   }
   renderBookingSlots();
   bookingFormNote.textContent = "No payment required now. We'll confirm availability and pricing by email.";
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
   showBookingToast(message, 'error');
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
   const phoneInput = document.getElementById('bookingPhone');
   const idInput = document.getElementById('bookingId');
   const addressInput = document.getElementById('bookingAddress');
   const dateInput = document.getElementById('bookingDate');
   const timeInput = document.getElementById('bookingTime');
   const subjectInput = document.getElementById('bookingSubject');

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
   if (!phoneInput.value.trim()) {
     showBookingError('Please enter your phone number.', phoneInput);
     return;
   }
   const customerId = (idInput?.value || '').trim().toUpperCase();
   if (!CUSTOMER_ID_PATTERN.test(customerId)) {
     showBookingError('Please enter a valid ID (example: 090290-373N).', idInput);
     return;
   }
   idInput.value = customerId;
   if (!addressInput.value.trim()) {
     showBookingError('Please enter your address.', addressInput);
     return;
   }
   if (!dateInput.value) {
     showBookingError('Please pick a preferred date.', dateInput);
     return;
   }
   if (!timeInput.value) {
     showBookingError('Please pick a preferred time slot.', bookingSlotsEl);
     return;
   }

   if (subjectInput) subjectInput.value = BOOKING_SUBJECT;

   const formData = new FormData(bookingForm);
   const service = formData.get('service');
   const otherService = (formData.get('otherService') || '').trim();
   const serviceLabel = service === 'Other' ? (otherService || 'Other') : service;
   formData.set('service', serviceLabel);
   formData.set('customerId', customerId);
   formData.set('_subject', BOOKING_SUBJECT);

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
       bookingTimeInput.value = '';
       if (subjectInput) subjectInput.value = BOOKING_SUBJECT;
       serviceCards.forEach(card => {
         card.classList.remove('active');
         card.setAttribute('aria-pressed', 'false');
       });
       otherServiceWrap.classList.add('hidden');
       otherServiceInput.required = false;
       renderBookingSlots();
       updateBookingSteps();
       bookingFormNote.textContent = "No payment required now. We'll confirm availability and pricing by email.";
       bookingFormNote.style.color = '';
       showBookingToast('Request sent successfully! ShineExpress will confirm by email.', 'success');
     } else {
       const data = await response.json().catch(() => ({}));
       const failMsg = data.error || 'Could not send booking. Please try again or email shineexpressfi@gmail.com.';
       bookingFormNote.textContent = failMsg;
       bookingFormNote.style.color = '#c0392b';
       showBookingToast(failMsg, 'error');
     }
   } catch {
     const failMsg = 'Could not send booking. Please try again or email shineexpressfi@gmail.com.';
     bookingFormNote.textContent = failMsg;
     bookingFormNote.style.color = '#c0392b';
     showBookingToast(failMsg, 'error');
   } finally {
     bookingSubmitBtn.disabled = false;
     bookingSubmitBtn.textContent = originalText;
   }
 }

 if (bookingDateInput) bookingDateInput.min = todayIsoDate();
 renderBookingSlots();
