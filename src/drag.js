import { isDev, updateTooltip } from './utils.js';

export function initDrag({
  shirts,
  centerImage,
  infoTooltip,
  firstDropAudio,
  suitCheeseAudio,
  validHoverPaths,
}) {
  let activeShirt = null;
  let initialShirtPos = { left: '', top: '' };
  let initialTouchPos = { x: 0, y: 0 };
  let currentPos = { x: 0, y: 0 };
  let lastX = 0;
  let lastY = 0;
  let isMoving = false;
  let moveTimeout;
  let originalCenterImageSrc = '';
  let isHoveringCenterImage = false;
  let keyboardDragging = false;
  let hasPlayedFirstDrop = false;

  shirts.forEach((shirt) => {
    shirt.style.cursor = 'grab';
    shirt.tabIndex = 0;
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
    shirt.addEventListener('keydown', handleShirtKeydown);
  });

  function handleStart(e) {
    e.preventDefault();
    activeShirt = e.target;

    if (centerImage && centerImage.src) {
      let currentCenterSrcURL;
      try {
        currentCenterSrcURL = new URL(centerImage.src, window.location.href);
      } catch (urlError) {
        if (isDev) {
          console.warn('Error parsing centerImage.src in handleStart:', urlError);
        }
        originalCenterImageSrc = centerImage.src;
        isHoveringCenterImage = false;
        return;
      }

      const currentCenterPath = currentCenterSrcURL.pathname;
      const hoverSuffix = 'model-hover.png';
      const baseSuffix = 'model.png';

      if (currentCenterPath.endsWith(hoverSuffix)) {
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
          originalCenterImageSrc = currentCenterSrcURL.href;
        }
      } else {
        originalCenterImageSrc = currentCenterSrcURL.href;
      }
    } else if (centerImage) {
      originalCenterImageSrc = '';
    }

    isHoveringCenterImage = false;

    const computedStyle = window.getComputedStyle(activeShirt);
    initialShirtPos.left = computedStyle.left || '0px';
    initialShirtPos.top = computedStyle.top || '0px';
    currentPos.x = parseInt(initialShirtPos.left) || 0;
    currentPos.y = parseInt(initialShirtPos.top) || 0;

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
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
    }

    activeShirt.style.cursor = 'grabbing';
    activeShirt.style.zIndex = '1000';
    activeShirt.classList.add('grabbed');
  }

  function handleMove(e) {
    if (!activeShirt || !centerImage) return;
    e.preventDefault();

    let clientX, clientY;
    if (e.type === 'mousemove') {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.type === 'touchmove') {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    }

    const deltaX = clientX - lastX;
    const deltaY = clientY - lastY;
    currentPos.x += deltaX;
    currentPos.y += deltaY;
    activeShirt.style.left = `${currentPos.x}px`;
    activeShirt.style.top = `${currentPos.y}px`;

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
        } catch (urlError) {
          if (isDev) {
            console.warn('Error parsing originalCenterImageSrc in handleMove:', urlError);
          }
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
    } else {
      if (isHoveringCenterImage && originalCenterImageSrc) {
        centerImage.src = originalCenterImageSrc;
        isHoveringCenterImage = false;
      }
    }

    const isMovingNow = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;
    if (isMovingNow && !isMoving) {
      activeShirt.classList.remove('grabbed');
      activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
      isMoving = true;
    } else if (isMoving && deltaX !== 0) {
      activeShirt.classList.remove('dragging-right', 'dragging-left');
      activeShirt.classList.add(deltaX > 0 ? 'dragging-right' : 'dragging-left');
    }

    lastX = clientX;
    lastY = clientY;

    if (moveTimeout) clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      if (isMoving) {
        activeShirt.classList.remove('dragging-right', 'dragging-left');
        activeShirt.classList.add('grabbed');
        isMoving = false;
      }
    }, 50);
  }

  function handleEnd(e) {
    if (!activeShirt || !centerImage) return;

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
      const newImageSrc = activeShirt.getAttribute('data-mouse-src');
      if (newImageSrc) {
        try {
          centerImage.src = newImageSrc;
        } catch (e2) {}
      }

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

      updateTooltip(infoTooltip);

      if (shirtName === 'suit' && suitCheeseAudio) {
        try {
          suitCheeseAudio.play();
        } catch (e3) {}
      }

      if (!hasPlayedFirstDrop && firstDropAudio) {
        try {
          firstDropAudio.play();
        } catch (e4) {}
        hasPlayedFirstDrop = true;
      }

      activeShirt.style.left = initialShirtPos.left;
      activeShirt.style.top = initialShirtPos.top;
      currentPos.x = parseInt(initialShirtPos.left) || 0;
      currentPos.y = parseInt(initialShirtPos.top) || 0;
    } else {
      activeShirt.style.left = initialShirtPos.left;
      activeShirt.style.top = initialShirtPos.top;
      currentPos.x = parseInt(initialShirtPos.left) || 0;
      currentPos.y = parseInt(initialShirtPos.top) || 0;

      if (isHoveringCenterImage && originalCenterImageSrc) {
        centerImage.src = originalCenterImageSrc;
      }
    }

    activeShirt.style.cursor = 'grab';
    activeShirt.style.zIndex = '';
    activeShirt.classList.remove('dragging-right', 'dragging-left', 'grabbed');

    if (moveTimeout) clearTimeout(moveTimeout);

    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
    document.removeEventListener('touchcancel', handleEnd);

    isHoveringCenterImage = false;
    activeShirt = null;
    keyboardDragging = false;
  }

  const KEYBOARD_STEP = 10;

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
}
