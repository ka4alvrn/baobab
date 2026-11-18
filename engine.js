const fresh=()=>({version:2,scene:'letter',path:'mortal',flags:{},seen:['letter'],log:[],combat:null,checkpoint:null});
const clone=value=>JSON.parse(JSON.stringify(value));
function restore(raw){
  if(!raw||!Object.hasOwn(scenes,raw.scene)||!Array.isArray(raw.log))return null;
  if(raw.version===2)return {...fresh(),...raw};
  // Translate the two recorded prologue choices from the original save format.
  const p=fresh();p.scene=raw.scene;p.log=raw.log.filter(t=>typeof t==='string');
  for(const id of ['ledger','cellar'])if(p.scene===id||p.log.includes(scenes.letter.choices.find(c=>c[1]===id)[2]))p.flags[id==='ledger'?'paper':'tag']=true;
  if(['end','door'].includes(p.scene))p.seen.push('door');
  p.seen=[...new Set([...p.seen,p.scene])];return p;
}
function bookmark(p){const {checkpoint,...state}=p;p.checkpoint=clone(state)}
function rewind(p){return p.checkpoint?{...clone(p.checkpoint),checkpoint:clone(p.checkpoint)}:fresh()}
function arrive(p,id,note){
  p.scene=id;if(!p.seen.includes(id))p.seen.push(id);if(note)p.log.push(note);
  if(id==='ledger')p.flags.paper=true;if(id==='cellar')p.flags.tag=true;
  p.combat=null;const s=scenes[id];
  if(s.fight)p.combat={hp:5,enemy:7,turn:1,ready:false,used:false,last:'Присмотритесь к намерению противника.'};
  if(s.checkpoint||s.fight)bookmark(p);
}
const visibleChoices=p=>scenes[p.scene].choices.filter(c=>!c[3]||c[3](p));
function decide(p,index){const c=visibleChoices(p)[index];if(!c)return;c[4]?.(p);arrive(p,c[1],c[2])}
const heavy=c=>c.turn%2===1;
function fightTurn(p,action){
  const c=p.combat,f=scenes[p.scene].fight;if(!c||!f||!['attack','guard','skill'].includes(action)||(action==='skill'&&c.used))return;
  let dealt=0,taken=heavy(c)?3:1,recap='';
  if(action==='guard'){c.ready=true;taken=0;recap='Вы удержали защиту. Следующий натиск усилен.'}
  if(action==='attack'){dealt=(heavy(c)?1:2)+(c.ready?2:0);c.ready=false;recap=`Ваш натиск снимает ${dealt} ед. стойкости.`}
  if(action==='skill'){
    c.used=true;
    if(p.path==='vampire'){c.hp=Math.min(5,c.hp+2);dealt=2;recap='Вы вернули часть сил и рассеяли край тени.'}
    else{dealt=3;recap='Оттиск смят. Сторож теряет 3 ед. стойкости.'}
    taken=0;
  }
  c.enemy=Math.max(0,c.enemy-dealt);
  if(!c.enemy){arrive(p,f.win,`Вы выдержали столкновение: ${f.name}.`);return}
  c.hp=Math.max(0,c.hp-taken);
  if(!c.hp){p.flags.lastPlace=scenes[p.scene].place;arrive(p,'fallen',`Вы пали в столкновении: ${f.name}.`);return}
  c.turn++;c.last=recap+(taken?` Ответный удар: −${taken} здоровья.`:'');
}
