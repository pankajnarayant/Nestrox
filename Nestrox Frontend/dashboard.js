/* ============================================================
   Nestrox — Dashboard Logic
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     Session Auth Guard
     ============================================================ */
  const SESSION_KEY = 'nestrox_session';
  const sessionData = localStorage.getItem(SESSION_KEY);
  
  if (!sessionData) {
    // Prevent unauthenticated access
    window.location.href = 'index.html';
    return;
  }

  let currentUser = {};
  try {
    currentUser = JSON.parse(sessionData);
  } catch (e) {
    window.location.href = 'index.html';
    return;
  }

  /* ---------- DOM References ---------- */
  const btnProfile  = document.getElementById('btn-profile');
  const btnBell     = document.getElementById('btn-bell');
  const sidebarLeft = document.getElementById('sidebar-left');
  const sidebarRight = document.getElementById('sidebar-right');
  const overlay     = document.getElementById('overlay');
  const btnLogout   = document.getElementById('menu-logout');
  const greetingEl  = document.querySelector('.sidebar__greeting');

  // Set personalized welcome greeting
  if (greetingEl && currentUser.fullName) {
    greetingEl.textContent = `Welcome, ${currentUser.fullName}!`;
  }

  /* ---------- Sidebar State ---------- */
  let activePanel = null; // 'left' | 'right' | null

  function openPanel(side) {
    // Close any currently open panel first
    closeAllPanels();

    if (side === 'left') {
      sidebarLeft.classList.add('open');
    } else {
      sidebarRight.classList.add('open');
    }
    overlay.classList.add('active');
    activePanel = side;
  }

  function closeAllPanels() {
    sidebarLeft.classList.remove('open');
    sidebarRight.classList.remove('open');
    overlay.classList.remove('active');
    activePanel = null;
  }

  /* ---------- Event Listeners ---------- */

  // Profile icon → open left sidebar
  btnProfile.addEventListener('click', () => {
    if (activePanel === 'left') {
      closeAllPanels();
    } else {
      openPanel('left');
    }
  });

  // Bell icon → open right notification panel
  btnBell.addEventListener('click', () => {
    if (activePanel === 'right') {
      closeAllPanels();
    } else {
      openPanel('right');
    }
  });

  // Overlay click → close everything
  overlay.addEventListener('click', closeAllPanels);

  // Escape key → close panels
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPanels();
  });

  // Logout → clear session and go back to login page
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('nestrox_session');
    window.location.href = 'index.html';
  });

  /* ---------- Sidebar menu item clicks (placeholder) ---------- */
  const menuItems = document.querySelectorAll('.sidebar__item:not(#menu-logout)');
  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      closeAllPanels();
    });
  });

  /* ---------- Room Options Modal ---------- */
  const cardRoom        = document.getElementById('card-room');
  const roomBackdrop    = document.getElementById('room-modal-backdrop');
  const roomModalClose  = document.getElementById('room-modal-close');

  function openRoomModal() {
    roomBackdrop.classList.add('open');
    roomModalClose.focus();
  }

  function closeRoomModal() {
    roomBackdrop.classList.remove('open');
  }

  // Open modal when "Create / Join Room" card is clicked
  cardRoom.addEventListener('click', openRoomModal);

  // Close via × button
  roomModalClose.addEventListener('click', closeRoomModal);

  // Close when clicking outside the modal card
  roomBackdrop.addEventListener('click', (e) => {
    if (e.target === roomBackdrop) closeRoomModal();
  });

  // Escape key closes modal too
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPanels();
      closeRoomModal();
    }
  });

  // Placeholder handlers for the two action buttons
  document.getElementById('btn-create-room').addEventListener('click', () => {
    // Future: navigate to Create Room screen
    clearHints();
    closeRoomModal();
  });

  document.getElementById('btn-join-room').addEventListener('click', () => {
    // Future: navigate to Join Room screen
    clearHints();
    closeRoomModal();
  });

  /* ---------- Validation Hints (no room joined yet) ---------- */
  const hintTimers = {};

  /**
   * Shows the hint message below the given card and auto-hides it after 3s.
   * @param {string} hintId  — id of the <p class="card-hint"> element
   */
  function showHint(hintId) {
    // Clear any existing timer for this hint
    clearTimeout(hintTimers[hintId]);

    const hint = document.getElementById(hintId);
    hint.classList.add('visible');

    hintTimers[hintId] = setTimeout(() => {
      hint.classList.remove('visible');
    }, 3000);
  }

  /** Hides all hint messages immediately (called on successful room entry). */
  function clearHints() {
    ['hint-members', 'hint-expenses'].forEach((id) => {
      clearTimeout(hintTimers[id]);
      const hint = document.getElementById(id);
      if (hint) hint.classList.remove('visible');
    });
  }

  // Show hint when Add Members is clicked without a room
  document.getElementById('card-members').addEventListener('click', () => {
    showHint('hint-members');
  });

  // Show hint when Add Expenses is clicked without a room
  document.getElementById('card-expenses').addEventListener('click', () => {
    showHint('hint-expenses');
  });

})();
