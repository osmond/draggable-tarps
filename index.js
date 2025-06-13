import preloadImages from './js/preload.js';
import { initDrag } from './src/drag.js';
import { initSuggestions } from './src/suggestions.js';
import { isDev, randomizeShirtPositions, updateTooltip } from './src/utils.js';

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



  // --- State Variables ---
  const validHoverPaths = []; // Stores absolute URL pathnames for valid hover images (e.g., ".../white-tshirt-model-hover.png"). Used to ensure we only attempt to load existing hover images.

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


  preloadImages(uniqueImagePaths, () => {
    document.body.classList.remove('loading');
    randomizeShirtPositions(shirts, centerImage);
    if (isDev) {
      console.log('All images preloaded, loading class removed.');
    }
  }); // Preload all collected unique image paths and remove loading class on completion.

  if (shuffleButton) {
    shuffleButton.addEventListener('click', () => {
      randomizeShirtPositions(shirts, centerImage);
    });
  }

  initDrag({
    shirts,
    centerImage,
    infoTooltip,
    firstDropAudio,
    suitCheeseAudio,
    validHoverPaths,
  });

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
  updateTooltip(infoTooltip);

  initSuggestions({
    suggestLink,
    suggestInputContainer,
    suggestInput,
    suggestSubmit,
    suggestMessagesContainer,
    suggestError,
  });

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
