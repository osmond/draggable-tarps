import { isDev } from './utils.js';

export function initSuggestions({
  suggestLink,
  suggestInputContainer,
  suggestInput,
  suggestSubmit,
  suggestMessagesContainer,
  suggestError,
}) {
  const SUGGEST_STORAGE_KEY = 'shirtSuggestions';

  function loadSuggestions() {
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

  function saveSuggestions(list) {
    try {
      localStorage.setItem(SUGGEST_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      if (isDev) {
        console.warn('Failed to save suggestions to storage', err);
      }
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function displaySuggestion(text, message, allowHTML = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'suggest-marquee';

    wrapper.style.position = 'fixed';
    wrapper.style.top = `${10 + Math.random() * 80}%`;
    wrapper.style.left = `${5 + Math.random() * 90}%`;

    const messageText = document.createElement('span');
    messageText.className = 'suggest-text';

    const defaultMessage = `That's a great idea! I would love to see him wearing ${escapeHtml(
      text
    )}!`;
    if (allowHTML) {
      messageText.innerHTML = message || defaultMessage;
    } else {
      messageText.textContent = message || defaultMessage;
    }

    wrapper.appendChild(messageText);
    suggestMessagesContainer.appendChild(wrapper);

    wrapper.addEventListener('animationend', () => {
      wrapper.remove();
    });
  }

  loadSuggestions().forEach((s) => {
    if (s && s.text) {
      const msg =
        `Do you see ${escapeHtml(s.text)}? If not, send me an ` +
        '<a href="mailto:jonathan.osmond@gmail.com">email</a> and I\'ll be sure to add it!';
      displaySuggestion(s.text, msg, true);
    }
  });

  if (
    suggestLink &&
    suggestInputContainer &&
    suggestInput &&
    suggestSubmit &&
    suggestMessagesContainer
  ) {
    suggestLink.addEventListener('click', (event) => {
      event.preventDefault();
      suggestInputContainer.classList.toggle('open');
      suggestLink.classList.toggle('open');
      if (suggestInputContainer.classList.contains('open')) {
        if (suggestError) {
          suggestError.textContent = '';
          suggestError.classList.remove('visible');
        }
        suggestInput.focus();
      }
    });

    function handleSuggestSubmit(event) {
      event.preventDefault();
      const text = suggestInput.value.trim();
      let errorMessage = '';

      if (!text) {
        errorMessage = 'Please enter a shirt idea.';
      } else if (text.length > 60) {
        errorMessage = 'Shirt idea must be 60 characters or fewer.';
      } else if (!/^[a-zA-Z0-9 ,.!?'-]+$/.test(text)) {
        errorMessage = 'Shirt idea contains invalid characters.';
      }

      if (errorMessage) {
        if (suggestError) {
          suggestError.textContent = errorMessage;
          suggestError.classList.remove('animate');
          void suggestError.offsetWidth;
          suggestError.classList.add('visible', 'animate');
        }
        return;
      }

      if (suggestError) {
        suggestError.textContent = '';
        suggestError.classList.remove('visible', 'animate');
      }

      if (text) {
        displaySuggestion(text);

        const stored = loadSuggestions();
        stored.push({ text, time: Date.now() });
        saveSuggestions(stored);

        suggestInput.value = '';
        suggestInputContainer.classList.remove('open');
        suggestLink.classList.remove('open');
        suggestLink.focus();
      }
    }

    suggestSubmit.addEventListener('click', handleSuggestSubmit);
    suggestInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        handleSuggestSubmit(event);
      }
    });
  }
}
