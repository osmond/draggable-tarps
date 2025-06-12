import assert from 'assert';
import fs from 'fs';
import { JSDOM } from 'jsdom';

// Load the HTML used for the page
const html = fs.readFileSync('./index.html', 'utf8');

// Create a JSDOM instance and expose globals so the page scripts can run
const dom = new JSDOM(html, { url: 'http://localhost/' });
const { window } = dom;

global.window = window;
global.document = window.document;
// Image constructor is used by preloadImages
global.Image = window.Image;

// Load the script that sets up event handlers
await import('../index.js');

// Fire DOMContentLoaded so handlers are attached
window.document.dispatchEvent(new window.Event('DOMContentLoaded', {
  bubbles: true,
  cancelable: true
}));

// --- Drag and drop test ---
const shirt = window.document.querySelector('.shirt');
const centerImage = window.document.getElementById('centerImage');

// Stub bounding boxes so collision logic works in JSDOM
shirt.getBoundingClientRect = () => ({
  left: 10,
  top: 10,
  right: 60,
  bottom: 60,
  width: 50,
  height: 50,
});
centerImage.getBoundingClientRect = () => ({
  left: 0,
  top: 0,
  right: 100,
  bottom: 100,
  width: 100,
  height: 100,
});

// Simulate user dragging a shirt and dropping it on the center image
shirt.dispatchEvent(new window.MouseEvent('mousedown', { clientX: 15, clientY: 15, bubbles: true }));
window.document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 20, clientY: 20, bubbles: true }));

assert(
  centerImage.src.endsWith('/assets/white-tshirt-model.png'),
  'Center image should update after dropping a shirt'
);
console.log('Drag and drop swaps center image');

// --- Suggestion validation test ---
const suggestInput = window.document.getElementById('suggest-input');
const suggestSubmit = window.document.getElementById('suggest-submit');
const suggestError = window.document.getElementById('suggest-error');

// Leave the input blank and attempt to submit
suggestInput.value = '';
suggestSubmit.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

assert.strictEqual(
  suggestError.textContent,
  'Please enter a shirt idea.',
  'Should show error message for empty suggestion'
);
console.log('Suggestion input validation works');
