const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'locale-ja.js'), 'utf8'), context);
const translate = text => vm.runInContext(`jaText(${JSON.stringify(text)})`, context);

test('Japanese translations retain dynamic values and embedded icons', () => {
  const catalog = vm.runInContext('JA_TEXT', context);
  for (const [source, translation] of Object.entries(catalog)) {
    for (const token of source.match(/__VAR_\d+__|%d|<[^>]+>/g) || []) {
      assert.ok(translation.includes(token), `Missing placeholder or markup in: ${source}`);
    }
  }
  assert.equal(translate('Apply 3 Burn.'), '火傷を3付与する。');
  assert.equal(translate('Room 4 of 10'), '部屋 4/10');
  assert.equal(translate('Guardian: Goblin Scout'), 'ガーディアン: ゴブリンスカウト');
  assert.equal(translate('Player Sakura42'), 'Player Sakura42');
});

test('game scripts remain valid JavaScript', () => {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, script] of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => new vm.Script(script));
  }
});

test('offline app shell includes the Japanese catalog', () => {
  const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  assert.match(worker, /'\.\/locale-ja\.js'/);
  assert.match(worker, /pwa-v2-i18n/);
});
