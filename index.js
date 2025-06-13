import preloadImages from './js/preload.js';

// Enable debug logging in non-production environments
const isDev =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV !== 'production';

if (isDev) {
  console.log("Hey bud, what's up?");
}

document.addEventListener('DOMContentLoaded', () => {
  // This event fires when the initial HTML document has been completely loaded and parsed,
  // without waiting for stylesheets, images, and subframes to finish loading.

  // --- DOM Element Selections ---
  const shirts = document.querySelectorAll('.shirt'); // Select all elements with the class 'shirt' (product images)
  const centerImage = document.getElementById('centerImage'); // Select the main display image element
  const infoTooltip = document.getElementById('info-tooltip'); // Select the tooltip element
  const suggestLink = document.getElementById('suggest-link');
  const suggestInputContainer = document.getElementById('suggest-input-container');
  const suggestInput = document.getElementById('suggest-input');
  const suggestSubmit = document.getElementById('suggest-submit');
  const suggestMessagesContainer = document.getElementById('suggest-messages');
  const suggestError = document.getElementById('suggest-error');
  const shuffleButton = document.getElementById('shuffle-button');
  const firstDropAudio = document.getElementById('first-drop-audio');

  const suitCheeseAudio = document.getElementById('suit-cheese-audio');

  function playAudioExclusive(audioElement) {
    if (!audioElement) return;
    const audios = [firstDropAudio, suitCheeseAudio];
    audios.forEach((aud) => {
      if (aud && aud !== audioElement) {
        aud.pause();
        try {
          aud.currentTime = 0;
        } catch (e) {}
      }
    });
    try {
      audioElement.play();
    } catch (e) {}
  }



  // --- Configuration and Constants ---
  const MODEL_INFO = {
    // Stores information about the model, currently only height.
    mouse: { height: 'not Jon Osmond' },
  };

  // --- State Variables ---
  const validHoverPaths = []; // Stores absolute URL pathnames for valid hover images (e.g., ".../white-tshirt-model-hover.png"). Used to ensure we only attempt to load existing hover images.
  let hasPlayedFirstDrop = false;

  // --- Image Path Collection and Preloading ---
  // Gather all potential image sources from the HTML to preload them.
  // This includes product images, model images, and their hover variations.
  const imagePaths = [];
  shirts.forEach((shirt) => {
    const shirtSrc = shirt.getAttribute('src'); // Product image
    const mouseSrc = shirt.getAttribute('data-mouse-src'); // Model image associated with the product

    if (shirtSrc) imagePaths.push(shirtSrc);
    if (mouseSrc) {
      imagePaths.push(mouseSrc);
      // Derive the hover image path by replacing 'model.png' with 'model-hover.png'
      const hoverSrc = mouseSrc.replace('model.png', 'model-hover.png');
      if (hoverSrc !== mouseSrc) {
        // Ensure a replacement actually happened
        imagePaths.push(hoverSrc);
        try {
          // Store the absolute pathname of valid hover images for quick lookup.
          validHoverPaths.push(new URL(hoverSrc, window.location.href).pathname);
        } catch (e) {
          if (isDev) {
            console.warn(`Could not create URL for hover image: ${hoverSrc}`, e);
          }
        }
      }
    }
  });

  // Add the initial center image source to the list of paths to preload.
  if (centerImage && centerImage.src) {
    imagePaths.push(centerImage.src);
  }

  // Create a unique set of absolute image pathnames for preloading.
  // This prevents attempting to preload the same image multiple times.
  const uniqueImagePaths = [...new Set(imagePaths)]
    .map((path) => {
      if (!path) return null;
      try {
        // Ensure paths like 'white-tshirt-model.png' correctly resolve to absolute paths for preloading.
        // And paths like 'white-tshirt-model-hover.png' derived from data attributes are also resolved.
        return new URL(path, window.location.href).href; // Use .href to get the full URL for Image().src
      } catch (e) {
        if (isDev) {
          console.warn('Error converting path to URL for preloading:', path, e);
        }
        return path;
      }
    })
    .filter(Boolean);

  // Randomize shirt positions on initial load
  function randomizeShirtPositions() {
    const placed = [];
    const MAX_ATTEMPTS = 25;
    // Capture the bounding rect of the model image so we can avoid it
    const centerRect = centerImage ? centerImage.getBoundingClientRect() : null;
    shirts.forEach((shirt) => {
      let attempts = 0;
      let left;
      let top;
      let rect;
      let overlaps;
      do {
        left = 10 + Math.random() * 80; // keep away from extreme edges
        top = 10 + Math.random() * 80;
        shirt.style.left = `${left}%`;
        shirt.style.top = `${top}%`;

        rect = shirt.getBoundingClientRect();
        overlaps = placed.some((r) => {
          return !(
            rect.right < r.left ||
            rect.left > r.right ||
            rect.bottom < r.top ||
            rect.top > r.bottom
          );
        });

        // Also check overlap with the model in the center
        if (!overlaps && centerRect) {
          overlaps = !(
            rect.right < centerRect.left ||
            rect.left > centerRect.right ||
            rect.bottom < centerRect.top ||
            rect.top > centerRect.bottom
          );
        }

        attempts += 1;
      } while (overlaps && attempts < MAX_ATTEMPTS);

      placed.push(shirt.getBoundingClientRect());
    });
  }

  preloadImages(uniqueImagePaths, () => {
    document.body.classList.remove('loading');
    randomizeShirtPositions();
    if (isDev) {
      console.log('All images preloaded, loading class removed.');
    }
  }); // Preload all collected unique image paths and remove loading class on completion.

  if (shuffleButton) {
    shuffleButton.addEventListener('click', () => {
      randomizeShirtPositions();
    });
  }

  // --- Drag-and-Drop State Variables ---
  let activeShirt = null; // The shirt element currently being dragged.
  let initialShirtPos = { left: '', top: '' }; // Stores the original CSS 'left' and 'top' values of the shirt before dragging.
  let initialTouchPos = { x: 0, y: 0 }; // Stores the initial X and Y coordinates of the mouse/touch when a drag starts.
  let currentPos = { x: 0, y: 0 }; // Stores the current calculated X and Y position of the dragging shirt.
  let lastX = 0; // Stores the last X coordinate during a move event, used to calculate deltaX.
  let lastY = 0; // Stores the last Y coordinate during a move event, used to calculate deltaY.
  let isMoving = false; // Flag to indicate if the shirt is actively being moved (to apply different styling).
  let moveTimeout; // Timeout ID for managing dragging class changes.
  let originalCenterImageSrc = ''; // Stores the full URL of the base image displayed on centerImage *before* any hover effects during a drag. This is crucial for reverting after a hover.
  let isHoveringCenterImage = false; // Flag to track if a dragged shirt is currently hovering over the centerImage and has triggered a hover image change.
  let keyboardDragging = false; // True when a drag is initiated via keyboard

  // --- Helper Functions ---


  // Updates the tooltip text based on the MODEL_INFO.
  function updateTooltip() {
    if (!infoTooltip || !MODEL_INFO.mouse) return; // Guard clause if elements are missing.
    const tooltipText = `Model is ${MODEL_INFO.mouse.height} `;
    infoTooltip.setAttribute('data-tooltip', tooltipText);
  }

  // --- Event Listener Setup for Shirts ---
  // Initialize each shirt for drag-and-drop.
  shirts.forEach((shirt) => {
    shirt.style.cursor = 'grab'; // Set the cursor to 'grab' to indicate draggable items.
    shirt.tabIndex = 0; // Make shirts focusable for keyboard users

    // Add touch and mouse event listeners for starting the drag.
    // { passive: false } for touchstart allows us to call e.preventDefault().
    shirt.addEventListener(
      'touchstart',
      (e) => {
        handleStart(e);
      },
      { passive: false }
    );
    shirt.addEventListener('mousedown', (e) => {
      handleStart(e);
    });

    // Keyboard support
    shirt.addEventListener('keydown', handleShirtKeydown);
  });

  // --- Drag-and-Drop Event Handlers ---

  /**
   * Handles the start of a drag operation (mousedown or touchstart).
   * @param {Event} e - The mouse or touch event.
   */
  function handleStart(e) {
    e.preventDefault(); // Prevent default actions like text selection or image dragging.
    activeShirt = e.target; // Set the currently dragged shirt.

    // Capture the *base* version of the centerImage.src.
    // If centerImage is currently showing a "...model-hover.png",
    // this logic ensures originalCenterImageSrc is set to the corresponding "...model.png".
    // This is vital for correctly reverting the image if the drag ends without a drop,
    // or when the dragged shirt moves off the centerImage.
    if (centerImage && centerImage.src) {
      let currentCenterSrcURL;
      try {
        currentCenterSrcURL = new URL(centerImage.src, window.location.href);
      } catch (urlError) {
        if (isDev) {
          console.warn(
            'Error parsing centerImage.src in handleStart:',
            urlError
          );
        }
        originalCenterImageSrc = centerImage.src; // Fallback
        isHoveringCenterImage = false;
        return;
      }

      const currentCenterPath = currentCenterSrcURL.pathname;
      const hoverSuffix = 'model-hover.png';
      const baseSuffix = 'model.png';

      if (currentCenterPath.endsWith(hoverSuffix)) {
        // If current image is a hover image, derive the base image path.
        const basePath = currentCenterPath.replace(hoverSuffix, baseSuffix);
        try {
          originalCenterImageSrc = new URL(basePath, window.location.href).href;
        } catch (normalizationError) {
          if (isDev) {
            console.warn(
              'Error creating URL for normalized base image in handleStart:',
              normalizationError
            );
          }
          originalCenterImageSrc = currentCenterSrcURL.href; // Fallback
        }
      } else {
        // If it's not a hover image, or not recognized, store its current URL as the original.
        originalCenterImageSrc = currentCenterSrcURL.href;
      }
    } else if (centerImage) {
      originalCenterImageSrc = ''; // Fallback if centerImage has no src.
    }

    isHoveringCenterImage = false; // Reset hover state at the start of a new drag.

    // Store the initial CSS position of the shirt.
    const computedStyle = window.getComputedStyle(activeShirt);
    initialShirtPos.left = computedStyle.left || '0px';
    initialShirtPos.top = computedStyle.top || '0px';
    // Initialize currentPos based on the parsed initial position.
    currentPos.x = parseInt(initialShirtPos.left) || 0;
    currentPos.y = parseInt(initialShirtPos.top) || 0;

    // Record initial mouse/touch coordinates and set up move/end listeners.
    if (e.type === 'mousedown') {
      lastX = e.clientX;
      lastY = e.clientY;
      initialTouchPos.x = e.clientX;
      initialTouchPos.y = e.clientY;
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
    } else if (e.type === 'touchstart') {
      const touch = e.touches[0];
      lastX = touch.clientX;
      lastY = touch.clientY;
      initialTouchPos.x = touch.clientX;
      initialTouchPos.y = touch.clientY;
      // { passive: false } for touchmove allows us to call e.preventDefault().
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd); // Handle unexpected touch interruptions.
    }

    // Update shirt appearance for dragging.
    activeShirt.style.cursor = 'grabbing';
    activeShirt.style.zIndex = '1000'; // Bring to front.
    activeShirt.classList.add('grabbed'); // Add class for styling grabbed state.
  }

  /**
   * Handles the movement during a drag operation (mousemove or touchmove).
   * @param {Event} e - The mouse or touch event.
   */
  function handleMove(e) {
    if (!activeShirt || !centerImage) return; // Ensure we have an active shirt and a center image.
    e.preventDefault(); // Prevent scrolling or other default actions during drag.

    let clientX, clientY;
    // Get correct coordinates based on event type.
    if (e.type === 'mousemove') {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.type === 'touchmove') {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    }

    // Calculate change in position (delta).
    const deltaX = clientX - lastX;
    const deltaY = clientY - lastY;
    // Update current position.
    currentPos.x += deltaX;
    currentPos.y += deltaY;
    // Apply new position to the shirt.
    activeShirt.style.left = `${currentPos.x}px`;
    activeShirt.style.top = `${currentPos.y}px`;

    // --- Collision Detection and Hover Effect ---
    const shirtRect = activeShirt.getBoundingClientRect();
    const centerImageRect = centerImage.getBoundingClientRect();
    // Check for simple bounding box overlap between the dragged shirt and the center image.
    const collision = !(
      shirtRect.right < centerImageRect.left ||
      shirtRect.left > centerImageRect.right ||
      shirtRect.bottom < centerImageRect.top ||
      shirtRect.top > centerImageRect.bottom
    );

    if (collision) {
      // If a collision occurs, try to show the hover image on centerImage.
      const currentDisplaySrcPath = new URL(centerImage.src, window.location.href).pathname;
      const hoverSuffix = 'model-hover.png';
      const isAlreadyHovering = currentDisplaySrcPath.endsWith(hoverSuffix);

      // Only change to hover image if:
      // 1. Not already showing a hover image.
      // 2. We have a valid originalCenterImageSrc (base image to derive hover from).
      if (!isAlreadyHovering && originalCenterImageSrc) {
        let baseImageToHoverPath;
        try {
          // Get the pathname of the *original* base image that was on centerImage.
          baseImageToHoverPath = new URL(originalCenterImageSrc, window.location.href).pathname;
        } catch (urlError) {
          if (isDev) {
            console.warn('Error parsing originalCenterImageSrc in handleMove:', urlError);
          }
          baseImageToHoverPath = ''; // Safety net
        }

        // Ensure the base image is of a type that *can* be hovered (e.g., ends with 'model.png').
        if (baseImageToHoverPath.endsWith('model.png')) {
          // Construct the potential hover image path for the *original* center image.
          const potentialHoverPathForOriginal = baseImageToHoverPath.replace('model.png', hoverSuffix);

          // Check if this derived hover path is one of the known valid hover images.
          if (validHoverPaths.includes(potentialHoverPathForOriginal)) {
            centerImage.src = potentialHoverPathForOriginal; // Change centerImage to its hover version.
            isHoveringCenterImage = true; // Set flag.
          }
        }
      }
    } else {
      // If no collision, and if we were previously hovering, revert centerImage to its original base image.
      if (isHoveringCenterImage && originalCenterImageSrc) {
        centerImage.src = originalCenterImageSrc;
        isHoveringCenterImage = false; // Reset flag.
      }
    }

    // --- Visual Feedback for Dragging Direction ---
    const isMovingNow = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2; // Threshold to detect actual movement.
    if (isMovingNow && !isMoving) {
      // If movement starts.
      activeShirt.classList.remove('grabbed');
      activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
      isMoving = true;
    } else if (isMoving && deltaX !== 0) {
      // If movement continues, update direction class.
      activeShirt.classList.remove('dragging-right', 'dragging-left');
      activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
    }

    // Update last known coordinates for the next move calculation.
    lastX = clientX;
    lastY = clientY;

    // Timeout to revert dragging classes if movement stops.
    if (moveTimeout) clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      if (isMoving) {
        activeShirt.classList.remove('dragging-right', 'dragging-left');
        activeShirt.classList.add('grabbed'); // Revert to 'grabbed' if movement pauses.
        isMoving = false;
      }
    }, 50); // 50ms delay before considering movement stopped.
  }

  /**
   * Handles the end of a drag operation (mouseup or touchend).
   * @param {Event} e - The mouse or touch event.
   */
  function handleEnd(e) {
    if (!activeShirt || !centerImage) return; // Ensure active shirt and center image exist.

    // --- Collision Detection for Drop ---
    // This uses a more precise check: if the *center* of the dragged shirt is within the centerImage.
    const shirtRect = activeShirt.getBoundingClientRect();
    const centerImageRect = centerImage.getBoundingClientRect();
    const shirtCenterX = shirtRect.left + shirtRect.width / 2;
    const shirtCenterY = shirtRect.top + shirtRect.height / 2;

    const collision =
      shirtCenterX >= centerImageRect.left &&
      shirtCenterX <= centerImageRect.right &&
      shirtCenterY >= centerImageRect.top &&
      shirtCenterY <= centerImageRect.bottom;

    if (collision) {
      // --- Successful Drop ---
      // Get the target model image source from the dragged shirt's data attribute.
      const newImageSrc = activeShirt.getAttribute('data-mouse-src');
      if (newImageSrc) {
        try {
          // Set centerImage to the new model image (absolute path).
          const fullPath = new URL(newImageSrc, window.location.href).pathname;
          centerImage.src = fullPath;
          // Update originalCenterImageSrc to this new base image.
          // This is important so that subsequent hovers over this new image work correctly.
          originalCenterImageSrc = fullPath;
        } catch (urlError) {
          if (isDev) {
            console.warn(
              `Error creating URL for new image source: ${newImageSrc}`,
              urlError
            );
          }
          // Fallback to using the raw src if URL parsing fails.
          centerImage.src = newImageSrc;
          originalCenterImageSrc = newImageSrc;
        }

        // Update the alt text so screen readers reflect the current shirt.
        const shirtName = activeShirt.getAttribute('data-shirt-name');
        if (shirtName) {
          centerImage.alt = `AI-generated Jon Osmond wearing the ${shirtName}`;
        }

        centerImage.classList.add('change-effect');
        centerImage.addEventListener(
          'animationend',
          () => {
            centerImage.classList.remove('change-effect');
          },
          { once: true }
        );

        updateTooltip(); // Update tooltip based on the new model/shirt.


        if (shirtName === 'suit' && suitCheeseAudio) {
          playAudioExclusive(suitCheeseAudio);
        }


        if (!hasPlayedFirstDrop && firstDropAudio) {
          playAudioExclusive(firstDropAudio);
          hasPlayedFirstDrop = true;
        }

        // Reset the dragged shirt's position back to its initial spot.
        activeShirt.style.left = initialShirtPos.left;
        activeShirt.style.top = initialShirtPos.top;
        currentPos.x = parseInt(initialShirtPos.left) || 0;
        currentPos.y = parseInt(initialShirtPos.top) || 0;
      }
    } else {
      // --- No Successful Drop (or dropped outside) ---
      // Reset the dragged shirt's position back to its initial spot.
      activeShirt.style.left = initialShirtPos.left;
      activeShirt.style.top = initialShirtPos.top;
      currentPos.x = parseInt(initialShirtPos.left) || 0;
      currentPos.y = parseInt(initialShirtPos.top) || 0;

      // If the centerImage was showing a hover effect (isHoveringCenterImage is true)
      // and we have a valid originalCenterImageSrc, revert centerImage to that original base image.
      if (isHoveringCenterImage && originalCenterImageSrc) {
        centerImage.src = originalCenterImageSrc;
      }
    }

    // --- Cleanup ---
    // Reset styles and classes on the dragged shirt.
    activeShirt.style.cursor = 'grab';
    activeShirt.style.zIndex = ''; // Reset z-index.
    activeShirt.classList.remove('dragging-right', 'dragging-left', 'grabbed');

    if (moveTimeout) clearTimeout(moveTimeout); // Clear any pending move timeout.

    // Remove event listeners that were added for the drag operation.
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
    document.removeEventListener('touchcancel', handleEnd);

    isHoveringCenterImage = false; // Ensure hover state is reset.
    activeShirt = null; // Clear the active shirt.
    keyboardDragging = false;
  }

  // --- Keyboard Dragging Support ---
  const KEYBOARD_STEP = 10; // pixels moved per arrow press

  function handleShirtKeydown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!keyboardDragging) {
        startKeyboardDrag(event.currentTarget);
      } else if (activeShirt === event.currentTarget) {
        handleEnd();
      }
    } else if (keyboardDragging && activeShirt === event.currentTarget) {
      let moved = false;
      if (event.key === 'ArrowUp') {
        currentPos.y -= KEYBOARD_STEP;
        moved = true;
      } else if (event.key === 'ArrowDown') {
        currentPos.y += KEYBOARD_STEP;
        moved = true;
      } else if (event.key === 'ArrowLeft') {
        currentPos.x -= KEYBOARD_STEP;
        moved = true;
      } else if (event.key === 'ArrowRight') {
        currentPos.x += KEYBOARD_STEP;
        moved = true;
      }

      if (moved) {
        event.preventDefault();
        activeShirt.style.left = `${currentPos.x}px`;
        activeShirt.style.top = `${currentPos.y}px`;
        updateHoverState();
      }
    }
  }

  function startKeyboardDrag(target) {
    activeShirt = target;

    // Capture the base version of the centerImage src as in handleStart
    if (centerImage && centerImage.src) {
      let currentCenterSrcURL;
      try {
        currentCenterSrcURL = new URL(centerImage.src, window.location.href);
      } catch {
        originalCenterImageSrc = centerImage.src;
        isHoveringCenterImage = false;
      }

      if (currentCenterSrcURL) {
        const currentCenterPath = currentCenterSrcURL.pathname;
        const hoverSuffix = 'model-hover.png';
        const baseSuffix = 'model.png';

        if (currentCenterPath.endsWith(hoverSuffix)) {
          const basePath = currentCenterPath.replace(hoverSuffix, baseSuffix);
          try {
            originalCenterImageSrc = new URL(basePath, window.location.href).href;
          } catch {
            originalCenterImageSrc = currentCenterSrcURL.href;
          }
        } else {
          originalCenterImageSrc = currentCenterSrcURL.href;
        }
      }
    }

    isHoveringCenterImage = false;

    const computedStyle = window.getComputedStyle(activeShirt);
    initialShirtPos.left = computedStyle.left || '0px';
    initialShirtPos.top = computedStyle.top || '0px';
    currentPos.x = parseInt(initialShirtPos.left) || 0;
    currentPos.y = parseInt(initialShirtPos.top) || 0;

    activeShirt.style.cursor = 'grabbing';
    activeShirt.style.zIndex = '1000';
    activeShirt.classList.add('grabbed');
    keyboardDragging = true;
  }

  function updateHoverState() {
    if (!activeShirt || !centerImage) return;

    const shirtRect = activeShirt.getBoundingClientRect();
    const centerImageRect = centerImage.getBoundingClientRect();
    const collision = !(
      shirtRect.right < centerImageRect.left ||
      shirtRect.left > centerImageRect.right ||
      shirtRect.bottom < centerImageRect.top ||
      shirtRect.top > centerImageRect.bottom
    );

    if (collision) {
      const currentDisplaySrcPath = new URL(centerImage.src, window.location.href).pathname;
      const hoverSuffix = 'model-hover.png';
      const isAlreadyHovering = currentDisplaySrcPath.endsWith(hoverSuffix);

      if (!isAlreadyHovering && originalCenterImageSrc) {
        let baseImageToHoverPath;
        try {
          baseImageToHoverPath = new URL(originalCenterImageSrc, window.location.href).pathname;
        } catch {
          baseImageToHoverPath = '';
        }

        if (baseImageToHoverPath.endsWith('model.png')) {
          const potentialHoverPathForOriginal = baseImageToHoverPath.replace('model.png', hoverSuffix);
          if (validHoverPaths.includes(potentialHoverPathForOriginal)) {
            centerImage.src = potentialHoverPathForOriginal;
            isHoveringCenterImage = true;
          }
        }
      }
    } else if (isHoveringCenterImage && originalCenterImageSrc) {
      centerImage.src = originalCenterImageSrc;
      isHoveringCenterImage = false;
    }
  }

  // --- Tooltip Interaction ---
  if (infoTooltip) {
    // Toggle tooltip visibility on click.
    infoTooltip.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent the click from immediately triggering the document click listener.
      infoTooltip.classList.toggle('tooltip-visible');
    });

    // Allow toggling via keyboard for accessibility
    infoTooltip.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        infoTooltip.classList.toggle('tooltip-visible');
      }
    });

    // Hide tooltip if clicked outside of it.
    document.addEventListener('click', (event) => {
      if (infoTooltip.classList.contains('tooltip-visible') && !infoTooltip.contains(event.target)) {
        infoTooltip.classList.remove('tooltip-visible');
      }
    });
  } else {
    console.error('Info Tooltip element not found');
  }

  // Initial call to set up the tooltip text.
  updateTooltip();

  // --- Suggestion Feature ---
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

    // Randomize position so multiple messages don't overlap in a single row
    // Position is fixed so it remains relative to the viewport
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


    wrapper.appendChild(messageText);
    suggestMessagesContainer.appendChild(wrapper);

    wrapper.addEventListener('animationend', () => {
      wrapper.remove();
    });
  }

  // Show any previously saved suggestions when the page loads
  loadSuggestions().forEach((s) => {
    if (s && s.text) {

      const msg =
        `Do you see ${escapeHtml(s.text)}? If not, send me an ` +
        '<a href="mailto:jonathan.osmond@gmail.com">email</a> and I\'ll be sure to add it!';
      displaySuggestion(s.text, msg, true);

    }
  });

  if (suggestLink && suggestInputContainer && suggestInput && suggestSubmit && suggestMessagesContainer) {
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
          // Trigger reflow to restart animation when class is re-added
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

  // --- Responsive Reset on Resize ---

  /**
   * Handles window resize events to reset shirt positions.
   * This prevents layout issues caused by absolute `left/top` values
   * applied during drag operations, which do not scale with responsive CSS.
   *
   * On resize, all `.shirt` elements have their inline position styles cleared,
   * allowing their original CSS class-based positioning (e.g., `.top-left`) to take over.
   */
  window.addEventListener('resize', () => {
    document.querySelectorAll('.shirt').forEach((shirt) => {
      shirt.style.left = ''; // Clear inline 'left' style
      shirt.style.top = ''; // Clear inline 'top' style
    });
  });
});
