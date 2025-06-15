// Utility functions for handling shirt suggestions and related UI
// Similar environment check as in other modules
const isDev =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV !== 'production';

const SUGGEST_STORAGE_KEY = 'shirtSuggestions';

export function loadSuggestions() {
  try {
    const data = localStorage.getItem(SUGGEST_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    if (isDev) {
      console.warn('Failed to load suggestions from storage', err);
    }
    return [];
  }
}

export function saveSuggestions(list) {
  try {
    localStorage.setItem(SUGGEST_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    if (isDev) {
      console.warn('Failed to save suggestions to storage', err);
    }
  }
}

export function removeSuggestion(time, firebaseRef) {
  const stored = loadSuggestions();
  const idx = stored.findIndex((s) => s.time === Number(time));
  if (idx !== -1) {
    stored.splice(idx, 1);
    saveSuggestions(stored);
  }
  if (firebaseRef) {
    firebaseRef
      .orderByChild('time')
      .equalTo(Number(time))
      .limitToFirst(1)
      .once('value')
      .then((snap) => {
        snap.forEach((child) => child.ref.remove());
      })
      .catch((err) => {
        if (isDev) {
          console.warn('Failed to delete suggestion', err);
        }
      });
  }
}

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function makeMarqueeDraggable(el) {
  let offsetX = 0;
  let offsetY = 0;
  function onStart(ev) {
    const pt = ev.touches ? ev.touches[0] : ev;
    const rect = el.getBoundingClientRect();
    offsetX = pt.clientX - rect.left;
    offsetY = pt.clientY - rect.top;
    el.style.cursor = 'grabbing';
    el.style.animationPlayState = 'paused';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
    ev.preventDefault();
    ev.stopPropagation();
  }
  function onMove(ev) {
    const pt = ev.touches ? ev.touches[0] : ev;
    el.style.left = `${pt.clientX - offsetX}px`;
    el.style.top = `${pt.clientY - offsetY}px`;
    ev.preventDefault();
  }
  function onEnd() {
    el.style.cursor = 'grab';
    el.style.animationPlayState = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);
  }
  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchstart', onStart, { passive: false });
  el.style.cursor = 'grab';
}

export function makeContainerDraggable(el) {
  let offsetX = 0;
  let offsetY = 0;
  function onStart(ev) {
    const pt = ev.touches ? ev.touches[0] : ev;
    const rect = el.getBoundingClientRect();
    offsetX = pt.clientX - rect.left;
    offsetY = pt.clientY - rect.top;
    el.classList.add('dragging');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
    ev.preventDefault();
  }
  function onMove(ev) {
    const pt = ev.touches ? ev.touches[0] : ev;
    el.style.left = `${pt.clientX - offsetX}px`;
    el.style.top = `${pt.clientY - offsetY}px`;
    ev.preventDefault();
  }
  function onEnd() {
    el.classList.remove('dragging');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);
  }
  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchstart', onStart, { passive: false });
}

export function displaySuggestion(text, message, allowHTML = false, container) {
  if (!container) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'suggest-marquee';
  wrapper.style.position = 'fixed';
  wrapper.style.top = `${10 + Math.random() * 80}%`;
  wrapper.style.left = `${5 + Math.random() * 90}%`;

  const messageText = document.createElement('span');
  messageText.className = 'suggest-text';
  const defaultMessage = `That's a great idea! I would love to see him wearing ${escapeHtml(text)}!`;
  if (allowHTML) {
    messageText.innerHTML = message || defaultMessage;
  } else {
    messageText.textContent = message || defaultMessage;
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'suggest-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => {
    wrapper.remove();
  });

  wrapper.appendChild(closeBtn);
  wrapper.appendChild(messageText);
  container.appendChild(wrapper);

  makeMarqueeDraggable(wrapper);

  wrapper.addEventListener('animationend', () => {
    wrapper.remove();
  });

  setTimeout(() => {
    if (document.body.contains(wrapper)) {
      wrapper.remove();
    }
  }, 20000);
}

export function addSuggestionItem(text, time, listContainer, firebaseRef) {
  if (!listContainer) return;
  const item = document.createElement('div');
  item.className = 'suggest-item';
  if (time) {
    item.dataset.time = time;
  }
  const delBtn = document.createElement('button');
  delBtn.className = 'suggest-delete';
  delBtn.type = 'button';
  delBtn.setAttribute('aria-label', 'Remove suggestion');
  delBtn.textContent = '×';
  delBtn.addEventListener('click', () => {
    const t = item.dataset.time;
    item.remove();
    if (t) {
      removeSuggestion(t, firebaseRef);
    }
  });
  item.appendChild(delBtn);
  item.appendChild(document.createTextNode(text));
  listContainer.appendChild(item);
}
