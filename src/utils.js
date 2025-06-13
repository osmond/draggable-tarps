export const isDev =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV !== 'production';

export const MODEL_INFO = {
  mouse: { height: 'not Jon Osmond' },
};

export function updateTooltip(infoTooltip) {
  if (!infoTooltip || !MODEL_INFO.mouse) return;
  const tooltipText = `Model is ${MODEL_INFO.mouse.height} `;
  infoTooltip.setAttribute('data-tooltip', tooltipText);
}

export function randomizeShirtPositions(shirts, centerImage) {
  const placed = [];
  const MAX_ATTEMPTS = 25;
  const centerRect = centerImage ? centerImage.getBoundingClientRect() : null;
  shirts.forEach((shirt) => {
    let attempts = 0;
    let left;
    let top;
    let rect;
    let overlaps;
    do {
      left = 10 + Math.random() * 80;
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
