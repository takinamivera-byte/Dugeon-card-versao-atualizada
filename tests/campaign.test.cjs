const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function campaign() {
  const context = vm.createContext({ jaText: text => text });
  vm.runInContext(source.slice(source.indexOf('const BASE_ENEMIES='), source.indexOf('/*ENGINE*/')), context);
  vm.runInContext(source.slice(source.indexOf('const BUILD={'), source.indexOf('// Dedicated local fallback meshes')), context);
  return context;
}

test('all 50 campaign encounters have a registered model', () => {
  const context = campaign();
  assert.equal(vm.runInContext('ENEMIES.length', context), 50);
  for (const enemy of vm.runInContext('ENEMIES', context)) {
    assert.equal(vm.runInContext(`typeof BUILD[${JSON.stringify(enemy.b)}]`, context), 'function',
      `Missing model at floor ${enemy.floor}, stage ${enemy.phase}: ${enemy.b}`);
  }
});

test('floor 3 entrance creates its enemy and reaches the combat screen', () => {
  const context = campaign();
  // Isolate the transition from WebGL and timers while retaining the real
  // battleRoom control flow and campaign definition for the first encounter.
  vm.runInContext(`
    let RUN={stage:20,fl:2,room:'normal',relics:[],cls:'guerreiro'};
    let B,enemy,mode,shown;
    const roomDef=()=>ENEMIES[RUN.stage],save=()=>{},setMode=m=>mode=m;
    const S={background:{setHex(){}},fog:{color:{setHex(){}}},add(){}},gnd={material:{color:{setHex(){}}}};
    const newCombat=(run,def)=>({def,e:{str:0}}),setHero=()=>{};
    const mk=o=>o,measure=()=>{},anim=()=>{},setTimeout=()=>{};
    const show=id=>shown=id,$=()=>({innerHTML:''}),ui=()=>{},fitBattle=()=>{};
    const model=BUILD.arqueiro_sombrio;
    if(typeof model!=='function')throw Error('Missing floor 3 enemy model');
    BUILD.arqueiro_sombrio=()=>({g:{rotation:{},position:{set(){}}}});
  `, context);
  const start = source.indexOf('function battleRoom(){');
  const end = source.indexOf('/* ===== ESTILOS DE ATAQUE', start);
  vm.runInContext(source.slice(start, end), context);
  vm.runInContext('battleRoom()', context);
  assert.equal(vm.runInContext('mode', context), 'battle');
  assert.equal(vm.runInContext('shown', context), 'hud');
  assert.equal(vm.runInContext('B.def.b', context), 'arqueiro_sombrio');
});
