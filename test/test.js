import assert from 'assert';
import fs from 'fs';

assert.strictEqual(1 + 1, 2);
console.log('Basic math test passed');

const html = fs.readFileSync('index.html', 'utf8');
assert(
  html.includes('class="suggestion-form"') &&
    html.includes('formspree.io/f/xqabqyaa'),
  'Suggestion form markup missing'
);
console.log('Form markup exists');
