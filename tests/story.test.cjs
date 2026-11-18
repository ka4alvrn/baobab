// No dependencies. Run with: node --test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const game = vm.runInNewContext(['story.js','engine.js'].map(file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8')).join('\n')+'\n;({scenes,places,fresh,restore,decide,visibleChoices,fightTurn,rewind,clone})');
const {scenes,places,fresh,restore,decide,visibleChoices,fightTurn,rewind,clone} = game;

test('Original saves resume with their discovered clues',()=>{
 for(const [i,clue] of [[0,'paper'],[1,'tag']]){
  const p=restore({scene:'end',log:[scenes.letter.choices[i][2]]});
  assert.equal(p.path,'mortal');assert.equal(p.flags[clue],true);decide(p,0);
  assert.equal(visibleChoices(p).length,2);
 }
});

test('Every scene can be reached legally and every active route has a way forward',()=>{
 const visited=new Set();
 function walk(p,depth){
  assert(depth<30);const s=scenes[p.scene];assert(s);assert(places[s.place]);visited.add(p.scene);
  if(['press','edition','machine','guard','released'].includes(p.scene))assert.equal(p.path,'human');
  if(['mirror','file','roll','hound','threshold'].includes(p.scene))assert.equal(p.path,'vampire');
  if(s.final){if(s.dead){const back=rewind(p);assert(!scenes[back.scene].final);assert.equal(back.path,p.path)}return}
  if(s.fight){
   const lost=clone(p); for(let n=0;lost.combat&&n<6;n++)fightTurn(lost,'attack');
   assert.equal(lost.scene,'fallen');walk(lost,depth+1);
   const retry=rewind(lost);assert.deepEqual(retry.combat,p.combat);assert.deepEqual(retry.log,p.log);
   fightTurn(p,'guard');fightTurn(p,'attack');fightTurn(p,'skill');
   if(p.combat){const snapshot=JSON.stringify(p);fightTurn(p,'skill');assert.equal(JSON.stringify(p),snapshot);fightTurn(p,'attack')}
   assert.equal(p.scene,s.fight.win);walk(p,depth+1);return;
  }
  const choices=visibleChoices(p);assert(choices.length>0);
  for(const i of choices.keys()){const next=clone(p);decide(next,i);walk(next,depth+1)}
 }
 walk(fresh(),0);assert.deepEqual([...visited].sort(),Object.keys(scenes).sort());
});
