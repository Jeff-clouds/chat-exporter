import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { getPlatformConfig } from '../src/export/config/selectors.js';

// Structural, synthetic regression: message rows and the separate host navigator
// can contain the same question text. Text de-duplication is not the boundary.
class Element {
    constructor(className, textContent) { Object.assign(this, { className, textContent }); }
    contains(other) { return this === other; }
}
const rows = Array.from({ length: 6 }, (_, i) => new Element('_9663006', `question ${i}`));
const navigator = Array.from({ length: 10 }, (_, i) => new Element('_72b6158', `question ${i}`));
const document = {
    querySelectorAll(selector) {
        const classes = selector.split(',').map(part => part.trim().slice(1));
        return [...rows, ...navigator].filter(el => classes.includes(el.className));
    }
};
const config = JSON.parse(fs.readFileSync(new URL('../src/config/selectors.json', import.meta.url)));
const window = {};
vm.runInNewContext(fs.readFileSync(new URL('../src/config/selectors.js', import.meta.url), 'utf8'), {
    window, document, Element, console: { log() {}, warn() {} }
});
const manager = window.SELECTOR_MANAGER;
const exportSelector = getPlatformConfig('https://chat.deepseek.com/a/chat/s/fixture').selectors.question;
assert.equal(manager.platforms.DEEPSEEK.selectors.question, config.platforms.DEEPSEEK.selectors.question);
assert.equal(exportSelector, config.platforms.DEEPSEEK.selectors.question);
assert.equal(document.querySelectorAll('._9663006, ._72b6158').length, 16);
assert.deepEqual(Array.from(manager.getElements('DEEPSEEK', 'question')), rows);
manager.platforms.DEEPSEEK = config.platforms.DEEPSEEK;
assert.deepEqual(Array.from(manager.getElements('DEEPSEEK', 'question')), rows);
assert.deepEqual(document.querySelectorAll(exportSelector), rows);
console.log('DeepSeek selector mirrors exclude host question navigator');
