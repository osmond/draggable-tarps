// Preloads an array of image paths to prevent flickering when they first display
export default function preloadImages(imageArray, callback) {
  let loadedCount = 0;
  const totalImages = imageArray.length;

  if (totalImages === 0) {
    callback();
    return;
  }

  imageArray.forEach((path) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        callback();
      }
    };
    img.onerror = () => {
      loadedCount++; // Count errors as loaded
      console.warn(`Failed to load image: ${path}`);
      if (loadedCount === totalImages) {
        callback();
      }
    };
    img.src = path;
  });
}
