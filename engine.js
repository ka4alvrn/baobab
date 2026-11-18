const fresh=()=>({version:3,scene:'ink',path:'mortal',flags:{},seen:['ink'],log:[],combat:null,checkpoint:null});
const clone=value=>JSON.parse(JSON.stringify(value));
function restore(raw){
  if(raw?.version!==3||!Object.hasOwn(scenes,raw.scene)||!Array.isArray(raw.log)||!Array.isArray(raw.seen)||!raw.flags)return null;
  if(scenes[raw.scene].fight&&!raw.combat)return null;
  return {...fresh(),...raw,path:'mortal'};
}
function bookmark(p){const {checkpoint,...state}=p;p.checkpoint=clone(state)}
function rewind(p){return p.checkpoint?{...clone(p.checkpoint),checkpoint:clone(p.checkpoint)}:fresh()}
function arrive(p,id,note){
  p.scene=id;if(!p.seen.includes(id))p.seen.push(id);if(note)p.log.push(`${scenes[id].time} · ${note}`);
  p.position=0;
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
    dealt=3;recap='Свет фонаря ложится поперёк настила. Тень отшатывается; вы возвращаете себе несколько шагов.';
    taken=0;
  }
  c.enemy=Math.max(0,c.enemy-dealt);
  if(!c.enemy){arrive(p,f.win,`Вы выдержали столкновение: ${f.name}.`);return}
  c.hp=Math.max(0,c.hp-taken);
  if(!c.hp){p.flags.lastPlace=scenes[p.scene].place;arrive(p,'fallen',`Вы пали в столкновении: ${f.name}.`);return}
  c.turn++;c.last=recap+(taken?` Ответный удар: −${taken} здоровья.`:'');
}
