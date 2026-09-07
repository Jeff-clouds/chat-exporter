import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { getPlatformConfig } from '../src/export/config/selectors.js';

const source = fs.readFileSync(new URL('../src/export/config/selectors.js', import.meta.url), 'utf8');
const processor = source.slice(source.indexOf('function _processAnswer('), source.indexOf('function _extractThinking('));
const { selectors, features } = getPlatformConfig('https://yuanbao.tencent.com/chat/agent/fixture');
assert.equal(features.removeThinkingBeforeContent, true);
// Exercise the production answer-processing boundary with synthetic blocks;
// the host sample has both one- and two-markdown thinking containers.
for (const thinkingCount of [0, 1, 2]) {
    const original = {
        thinkingCount,
        cloneNode() {
            return {
                thinkingCount: this.thinkingCount,
                querySelectorAll(selector) {
                    assert.equal(selector, selectors.thinking);
                    return this.thinkingCount ? [{ remove: () => { this.thinkingCount = 0; } }] : [];
                }
            };
        }
    };
    const context = {
        original, selectors, features,
        _extractThinking: block => block.thinkingCount ? 'THINKING' : '',
        _extractContent: block => block.thinkingCount ? 'THINKING FINAL' : 'FINAL',
        _extractCodeBlocks: block => { assert.equal(block.thinkingCount, 0); return []; }
    };
    vm.runInNewContext(`${processor}\nresult = _processAnswer(original, selectors, features);`, context);
    assert.equal(context.result.thinking, thinkingCount ? 'THINKING' : '');
    assert.equal(context.result.content, 'FINAL');
    assert.equal(original.thinkingCount, thinkingCount, 'must not remove host thinking nodes');
}
console.log('Yuanbao keeps thinking separate without mutating the host');
