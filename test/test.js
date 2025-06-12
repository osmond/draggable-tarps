import assert from 'assert';
import fs from 'fs';

assert.strictEqual(1 + 1, 2);
console.log('Basic math test passed');

const html = fs.readFileSync('index.html', 'utf8');
assert(!html.includes('formspree.io'), 'Formspree markup should be removed');
console.log('Formspree markup removed');

// Run additional DOM based tests
await import('./dragAndDrop.test.js');
