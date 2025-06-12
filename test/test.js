import assert from 'assert';
import fs from 'fs';
import { JSDOM } from 'jsdom';

// Basic sanity check
assert.strictEqual(1 + 1, 2);
console.log('Basic math test passed');

const html = fs.readFileSync('index.html', 'utf8');
assert(!html.includes('formspree.io'), 'Formspree markup should be removed');
console.log('Formspree markup removed');

// DOM based tests using jsdom
const dom = await JSDOM.fromFile('index.html', {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost/'
});

// Wait for the DOMContentLoaded event
await new Promise((resolve) => {
  dom.window.addEventListener('DOMContentLoaded', resolve);
});

const { document } = dom.window;
const centerImage = document.getElementById('centerImage');
const firstShirt = document.querySelector('.shirt');

// Stub bounding boxes so drag and drop logic thinks a collision happened
firstShirt.getBoundingClientRect = () => ({
  left: 0,
  top: 0,
  right: 50,
  bottom: 50,
  width: 50,
  height: 50
});
centerImage.getBoundingClientRect = () => ({
  left: 0,
  top: 0,
  right: 100,
  bottom: 100,
  width: 100,
  height: 100
});

// Simulate drag start and drop
firstShirt.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
dom.window.document.dispatchEvent(new dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 10, clientY: 10 }));

// Validate center image updated
assert(centerImage.src.includes(firstShirt.getAttribute('data-mouse-src')));
assert.strictEqual(
  centerImage.alt,
  `AI-generated Jon Osmond wearing the ${firstShirt.getAttribute('data-shirt-name')}`
);
console.log('Drop updates center image');

// Suggestion form validation tests
const input = document.getElementById('suggest-input');
const submit = document.getElementById('suggest-submit');
const error = document.getElementById('suggest-error');

input.value = 'a'.repeat(61);
submit.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
assert.strictEqual(error.textContent, 'Shirt idea must be 60 characters or fewer.');

input.value = 'Bad@Idea';
submit.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
assert.strictEqual(error.textContent, 'Shirt idea contains invalid characters.');

console.log('Suggestion form validation works');

