/* --------------- WINDOW SYSTEM ---------------
   Every window is just markup — no JS registration needed. To add one:

     <button type="button" data-open="myPanel">Open</button>

     <div class="window" id="myPanel" hidden>
       <div class="titlebar">
         <span class="titlebar-text">My Window</span>
         <button type="button" class="titlebar-close" data-close aria-label="Close">x</button>
       </div>
       <div class="window-body">...</div>
     </div>

   Then give it a starting position in style.css: #myPanel { top: _; left: _; }
   The taskbar picks it up on its own — nothing to register there either.

   A window has three states, tracked in data-state:
     (absent)    closed  — no taskbar button
     "open"      visible — taskbar button, raised
     "minimized" hidden  — taskbar button kept, so it can be restored
*/

(function () {
  let topZ = 1000;

  const taskbarWindows = document.getElementById('taskbarWindows');
  const startButton = document.getElementById('startButton');
  const startMenu = document.getElementById('startMenu');
  const clock = document.getElementById('clock');
  const showDesktop = document.getElementById('showDesktop');
  const statusCount = document.getElementById('statusCount');

  const allWindows = () => document.querySelectorAll('.window');

  function windowTitle(win) {
    const label = win.querySelector('.titlebar-text');
    return label ? label.textContent.trim() : win.id;
  }

  function focusWindow(win) {
    win.style.zIndex = ++topZ;
    syncTaskbar();
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.hidden = false;
    win.dataset.state = 'open';
    focusWindow(win);
  }

  function closeWindow(win) {
    if (!win) return;
    win.hidden = true;
    delete win.dataset.state;
    win.style.top = '';
    win.style.left = '';
    syncTaskbar();
  }

  function minimizeWindow(win) {
    win.hidden = true;
    win.dataset.state = 'minimized';
    syncTaskbar();
  }

  function restoreWindow(win) {
    win.hidden = false;
    win.dataset.state = 'open';
    focusWindow(win);
  }

  function closeAllWindows() {
    allWindows().forEach(closeWindow);
    closeStartMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* --------------- TASKBAR --------------- */
  function activeWindow() {
    let active = null;
    let best = -1;
    allWindows().forEach((win) => {
      if (win.hidden || !win.dataset.state) return;
      const z = Number(win.style.zIndex) || 0;
      if (z >= best) {
        best = z;
        active = win;
      }
    });
    return active;
  }

  function syncTaskbar() {
    let tracked = 0;

    if (taskbarWindows) {
      const active = activeWindow();
      taskbarWindows.textContent = '';

      allWindows().forEach((win) => {
        if (!win.dataset.state) return;
        tracked += 1;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'taskbarButton' + (win === active ? ' isActive' : '');
        button.dataset.task = win.id;
        button.textContent = windowTitle(win);
        taskbarWindows.appendChild(button);
      });
    }


    if (showDesktop) showDesktop.disabled = tracked === 0;

    syncTabs();
  }


  function syncTabs() {
    const active = activeWindow();
    document.querySelectorAll('.navbar [data-open]').forEach((button) => {
      const win = document.getElementById(button.dataset.open);
      button.classList.toggle('isActive', Boolean(win) && win === active);
    });
  }


  function handleTaskbarClick(win, button) {
    if (win.hidden) {
      restoreWindow(win);
    } else if (button.classList.contains('isActive')) {
      minimizeWindow(win);
    } else {
      focusWindow(win);
    }
  }

  /* --------------- START MENU --------------- */
  function openStartMenu() {
    if (!startMenu) return;
    startMenu.hidden = false;
    startButton.setAttribute('aria-expanded', 'true');
  }

  function closeStartMenu() {
    if (!startMenu) return;
    startMenu.hidden = true;
    startButton.setAttribute('aria-expanded', 'false');
  }

  function toggleStartMenu() {
    if (startMenu.hidden) openStartMenu();
    else closeStartMenu();
  }

  /* --------------- EVENTS --------------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#startButton')) {
      toggleStartMenu();
      return;
    }

    if (startMenu && !startMenu.hidden && !e.target.closest('#startMenu')) {
      closeStartMenu();
    }

    const taskButton = e.target.closest('[data-task]');
    if (taskButton) {
      const win = document.getElementById(taskButton.dataset.task);
      if (win) handleTaskbarClick(win, taskButton);
      return;
    }

    const opener = e.target.closest('[data-open]');
    if (opener) {
      openWindow(opener.dataset.open);
      return;
    }

    const closer = e.target.closest('[data-close]');
    if (closer) {
      closeWindow(closer.closest('.window'));
      return;
    }

    const action = e.target.closest('[data-action]');
    if (action && action.dataset.action === 'show-desktop') {
      closeAllWindows();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (startMenu && !startMenu.hidden) {
      closeStartMenu();
      startButton.focus();
    }
  });

  /* --------------- DRAG --------------- */
  const mobileLayout = window.matchMedia('(max-width: 768px)');

  document.addEventListener('pointerdown', (e) => {
    if (mobileLayout.matches) return;

    const bar = e.target.closest('.titlebar');
    if (!bar || e.target.closest('button')) return;

    const win = bar.closest('.window');
    if (!win) return;
    focusWindow(win);


    const rect = win.getBoundingClientRect();
    const grabX = e.clientX - rect.left;
    const grabY = e.clientY - rect.top;

    function drag(ev) {
      win.style.left = `${ev.clientX - grabX + window.scrollX}px`;
      win.style.top = `${ev.clientY - grabY + window.scrollY}px`;
    }

    function stop() {
      bar.removeEventListener('pointermove', drag);
      bar.removeEventListener('pointerup', stop);
      bar.removeEventListener('pointercancel', stop);
    }

    bar.setPointerCapture(e.pointerId);
    bar.addEventListener('pointermove', drag);
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
    e.preventDefault();
  });

  /* --------------- CARD LABELS ---------------*/
  document.querySelectorAll('.project-item[data-open]').forEach((card) => {
    const win = document.getElementById(card.dataset.open);
    const label = card.querySelector('.project-name');
    if (!win || !label) return;

    const target = label.querySelector('strong') || label;
    target.textContent = windowTitle(win);
  });

  /* --------------- STATUS BAR --------------- */

  if (statusCount) {
    const count = document.querySelectorAll('.featured .project-item').length;
    statusCount.textContent = `${count} object(s)`;
  }

  syncTaskbar();

  /* --------------- DODECAHEDRON POWER SAVING --------------- */
  const dodeca = document.querySelector('.cornerGif');
  const touchDevice = window.matchMedia('(pointer: coarse)');

  if (dodeca && 'IntersectionObserver' in window) {
    const tellDodeca = (command) => {
      if (!dodeca.contentWindow) return;
      dodeca.contentWindow.postMessage({ dodeca: command }, window.location.origin);
    };

    let visible = true;

    const applyDodecaState = () => {
      tellDodeca(touchDevice.matches && !visible ? 'pause' : 'run');
    };

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      applyDodecaState();
    }, { threshold: 0 }).observe(dodeca);


    dodeca.addEventListener('load', applyDodecaState);


    touchDevice.addEventListener('change', applyDodecaState);
  }

  /* --------------- CLOCK --------------- */
  if (clock) {
    const tick = () => {
      clock.textContent = new Date()
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    tick();
    setInterval(tick, 10000);
  }
})();
