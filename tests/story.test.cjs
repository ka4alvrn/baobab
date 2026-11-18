const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const {scenes,places,fresh,restore,decide,visibleChoices,fightTurn,rewind,clone}=vm.runInNewContext(['story.js','engine.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n')+'\n;({scenes,places,fresh,restore,decide,visibleChoices,fightTurn,rewind,clone})');
const words=s=>(s.text.join(' ').match(/[А-Яа-яЁё]+(?:[-‑][А-Яа-яЁё]+)*/g)||[]).length;

test('Every leaf has substantial original prose, a timestamp and a location illustration',()=>{
 for(const s of Object.values(scenes)){
  assert(words(s)>=175, s.title);assert(s.text.length>=3,s.title);assert.match(s.time,/^(?:[01]\d|2[0-3]):[0-5]\d$/);
  assert(fs.existsSync(path.join(root,'assets',places[s.place][1]+'.jpg')));
 }
});

test('Every branch plays in order, remains human, and reaches a full-length conclusion',t=>{
 const reached=new Set(),lengths=[];
 function walk(p,count=0){
  const s=scenes[p.scene];assert(s);reached.add(p.scene);assert.equal(p.path,'mortal');count+=words(s);
  if(s.final){if(!s.dead)lengths.push(count);else assert(!scenes[rewind(p).scene].dead);return}
  if(s.fight){
   const lost=clone(p);for(let i=0;i<6&&lost.combat;i++)fightTurn(lost,'attack');assert.equal(lost.scene,'fallen');walk(lost,count);
   const retry=rewind(lost);assert.deepEqual(retry.combat,p.combat);assert.deepEqual(retry.log,p.log);
   for(const move of ['guard','attack','skill'])fightTurn(p,move);assert.equal(p.scene,s.fight.win);walk(p,count);return;
  }
  const choices=visibleChoices(p);assert(choices.length>0);assert.equal(choices.some(c=>c[1]==='family'),p.scene==='decision'&&!!p.flags.named);
  for(const i of choices.keys()){
   const next=clone(p);decide(next,i);assert(scenes[next.scene].time>s.time);assert(!p.seen.includes(next.scene));walk(next,count);
  }
 }
 walk(fresh());assert.deepEqual([...reached].sort(),Object.keys(scenes).sort());
 const min=Math.min(...lengths),max=Math.max(...lengths);t.diagnostic(`Words on a completed path (excluding journal, labels, conditional prose and alternate branches): ${min}–${max}`);
 assert(min>=9000);assert(max<=14000);
});

test('New edition resumes its current leaf without importing unrelated old plots',()=>{
 const p=fresh();decide(p,0);decide(p,1);p.position=420;
 assert.deepEqual(restore(clone(p)),p);assert.equal(restore({version:2,scene:'offer',path:'vampire',log:[]}),null);
});
