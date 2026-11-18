const $=s=>document.querySelector(s),panel=$('#panel'),content=$('#content');
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem('nocturne:'+k))??d}catch{return d}},save=(k,v)=>{try{localStorage.setItem('nocturne:'+k,JSON.stringify(v))}catch{}};
let size=read('size','21px');if(!['19px','21px','24px'].includes(size))size='21px';const setSize=()=>document.documentElement.style.setProperty('--read',size);setSize();
function openPanel(title,kicker,html){content.innerHTML=`<div class="kicker">${kicker}</div><h2 id="panelTitle">${title}</h2>${html}`;panel.setAttribute('aria-labelledby','panelTitle');if(!panel.open)panel.showModal();panel.scrollTop=0;$('.close').focus()}
$('.close').onclick=()=>panel.close();panel.onclick=e=>{if(e.target!==panel)return;const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close()};
function archive(key){const data={journal:['Дневник',progress?'<h3>1 марта 1881 года</h3><p>На окне архива найдено письмо от Лизы.</p>':'<h3>Чистая страница</h3><p>Здесь останутся ваши решения и найденные улики. Первая запись появится, когда вы начнёте пролог.</p>'],people:['Персонажи','<h3>Архивист</h3><p>Вы служите в петербургском архиве. Через ваши руки проходят чужие судьбы — до сих пор ни одна из них не касалась вашей семьи.</p>'],world:['Мир новеллы','<h3>Санкт-Петербург · 1881</h3><p>В столице траур по Александру II. У Казанского собора продают чёрный креп, а на Галерной мостят улицу даже по ночам: стук молотков заглушает всё, что слышно из подвалов.</p>']};let [title,body]=data[key];if(key==='people'&&progress)body+='<h3>Елизавета</h3><p>Ваша младшая сестра. Семь лет назад её похоронили на Смоленском кладбище. Теперь вы получили письмо, написанное её рукой.</p>';if(key==='world'&&progress?.seen.includes('door'))body+='<h3>Дом без номера</h3><p>Особняк на Галерной, где за закрытой дверью звучит знакомая колыбельная.</p>';if(progress && key==='people'){
  for(const [id,name,description] of [
    ['witness','Смотритель','Вы нашли человека, который ждёт вас на переправе.'],
    ['petition','Павел Ремезов','Наборщик, которому принадлежит прошение о помиловании.'],
    ['press','Клавдия','Старшая наборщица ночной смены. Ей можно доверить своё имя.'],
    ['mirror','Хранительница дел','Дама с напёрстком ведает делами ночного двора.']
  ])if(progress.seen.includes(id))body+=`<h3>${name}</h3><p>${description}</p>`;
}if(progress && key==='world'){
  if(progress.seen.includes('press'))body+='<h3>Ночная типография</h3><p>Между наборными кассами и маховиком решается, чьё имя увидит город.</p>';
  if(progress.seen.includes('mirror'))body+='<h3>Зал прошений</h3><p>За серебряным стеклом хранят дела тех, чьи имена попали в ночной список.</p>';
}openPanel(title,'КОЛЛЕКЦИЯ / АРХИВ ИМПЕРИИ',body);if(key==='journal')progress?.log.forEach(t=>{let p=document.createElement('p');p.textContent=t;content.append(p)})}
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>archive(b.dataset.panel));
let audio=null;function sound(){if(audio){audio.close();audio=null}else{try{audio=new AudioContext();const gain=audio.createGain();gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.linearRampToValueAtTime(.031,audio.currentTime+1.5);gain.connect(audio.destination);[73.416,110,146.65].forEach(freq=>{const o=audio.createOscillator();o.frequency.value=freq;o.connect(gain);o.start()});const buffer=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate);let v=0;const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++){v=(v+.055*(Math.random()*2-1))*.98;samples[i]=v}const breeze=audio.createBufferSource();breeze.buffer=buffer;breeze.loop=true;breeze.connect(gain);breeze.start();audio.resume()}catch{audio=null}}$('#audio').setAttribute('aria-pressed',String(!!audio));$('#audio span').textContent=audio?'Звук включён':'Звук выключен';$('#audio use').setAttribute('href',audio?'#on':'#sound');if($('#setSound'))$('#setSound').textContent=audio?'Включён':'Выключен'}$('#audio').onclick=sound;
function settings(){openPanel('Настройки','NOCTURNE / ПАРАМЕТРЫ',`<div class="setting"><label for="size">Размер текста новеллы</label><select id="size"><option value="19px">Мелкий</option><option value="21px">Обычный</option><option value="24px">Крупный</option></select></div><div class="setting">Атмосферный звук<button id="setSound">${audio?'Включён':'Выключен'}</button></div>${progress?'<button class="choice" id="reset">Начать историю заново</button>':''}`);$('#size').value=size;$('#size').onchange=e=>{size=e.target.value;save('size',size);setSize()};$('#setSound').onclick=sound;if($('#reset'))$('#reset').onclick=()=>{openPanel('Стереть записи?','ДНЕВНИК','<p>Все решения этого прохождения будут удалены.</p><button class="choice" id="cancel">Сохранить записи</button><button class="choice" id="confirm">Стереть и начать заново</button>');$('#cancel').onclick=settings;$('#confirm').onclick=()=>{progress=fresh();persist();panel.close();enterReader()}}}$('#settings').onclick=settings;
window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();

let progress=restore(read('progress',null));
const persist=()=>save('progress',progress);
const prologue=id=>['letter','ledger','cellar','door'].includes(id);
function caption(){
  $('#begin span').textContent=progress?(scenes[progress.scene].final?'Открыть летопись':'Продолжить историю'):'Начать историю';
  $('.chapter').innerHTML=`<span></span>ТОМ I <b>·</b> ${!progress||prologue(progress.scene)?'ПРОЛОГ':'ГЛАВА I'}<span></span>`;
}
function textNode(tag,value,klass){const el=document.createElement(tag);if(klass)el.className=klass;el.textContent=value;return el}
function actionButton(label,run,meta){
  const box=$('#actions'),btn=document.createElement('button');btn.className='story-choice';
  btn.append(textNode('span',String(box.children.length+1).padStart(2,'0'),'ordinal'));
  const inner=textNode('span',label);if(meta)inner.append(textNode('small',meta));btn.append(inner,textNode('span','→','action-arrow'));box.append(btn);btn.onclick=run;
}
function meter(name,num,max){const row=textNode('div','','meter');row.append(textNode('span',name),textNode('b',`${num} / ${max}`));const line=document.createElement('progress');line.value=num;line.max=max;line.setAttribute('aria-label',name);row.append(line);return row}
function renderFight(p,s){
  const c=p.combat,box=$('#battle');box.className='combat';box.append(textNode('div',`СТОЛКНОВЕНИЕ / ХОД ${c.turn}`,'kicker'),meter('Ваше здоровье',c.hp,5),meter(s.fight.name,c.enemy,7),textNode('p',c.last,'round-note'),textNode('strong',heavy(c)?'Враг готовит тяжёлый удар (−3)':'Враг раскрыт: слабый ответ (−1)'));
  const moves=[['attack',c.ready?'Ответный натиск':'Натиск',`Снять ${(heavy(c)?1:2)+(c.ready?2:0)} ед. стойкости`],['guard','Удержать защиту','Без потери здоровья · усилит следующий натиск']];
  if(!c.used)moves.push(['skill',s.fight.skill,p.path==='vampire'?'Один раз · +2 здоровья, −2 стойкости, без ответа':'Один раз · −3 стойкости без ответа']);
  moves.forEach(([act,label,meta])=>actionButton(label,()=>{const prev=progress.scene;fightTurn(progress,act);persist();renderStory(prev===progress.scene)},meta));
}
function renderStory(sameRoundScreen=false){
  const p=progress,s=scenes[p.scene],place=places[p.scene==='fallen'?(p.flags.lastPlace||s.place):s.place];
  $('#location').textContent=place[0];$('.plate-art').style.backgroundImage=`linear-gradient(0deg,#1112173b,transparent 45%),url(assets/${place[1]}.jpg)`;
  $('#identity').textContent=p.path==='vampire'?'Вампир':p.path==='human'?'Человек · сопротивление':'Человек';
  $('#bookPart').textContent=s.dead?'ПОСЛЕДНЯЯ ЗАПИСЬ':s.final?'ГЛАВА I / ЭПИЛОГ':prologue(p.scene)?'ТОМ I / ПРОЛОГ':'ГЛАВА I / ВТОРОЙ КУПЛЕТ';
  $('#sceneTitle').textContent=s.title;const paras=[...s.text];
  if(p.scene==='released'&&p.flags.signed)paras.push('На улице уже читают ваш листок вслух. Вы слышите собственную фамилию из незнакомых уст. В архив на службу теперь не вернуться.');
  if(p.scene==='threshold'&&p.flags.freed)paras.unshift('Ваша тень больше не одинока: по стене рядом с нею бежит Лизина. На углу она сворачивает к дому.');
  $('#prose').replaceChildren(...paras.map(t=>textNode('p',t)));$('#battle').replaceChildren();$('#battle').className='';$('#actions').replaceChildren();
  $('#decisionLabel').textContent=s.dead?'ЖИЗНЬ ОБОРВАЛАСЬ':s.final?'ГЛАВА ЗАВЕРШЕНА':s.fight?'ВАШ ХОД':'ВАШЕ РЕШЕНИЕ';
  if(s.fight)renderFight(p,s);
  else if(s.final){if(s.dead)actionButton('Вернуться к контрольной точке',()=>{progress=rewind(progress);persist();renderStory()});actionButton('В главное меню',leaveReader)}
  else visibleChoices(p).forEach(([label],i)=>actionButton(label,()=>{decide(progress,i);persist();renderStory()}));
  caption();if(sameRoundScreen){$('#actions button').focus({preventScroll:true})}else{$('#sceneTitle').focus({preventScroll:true});window.scrollTo(0,0)}
}
function route(){const inStory=location.hash==='#story';$('#reader').hidden=!inStory;$('#landing').hidden=inStory;$('footer').hidden=inStory;
  if(inStory){if(!progress){progress=fresh();persist()}renderStory()}else{caption();$('#begin').focus({preventScroll:true});window.scrollTo(0,0)}
}
function enterReader(){if(location.hash!=='#story')location.hash='story';else route()}
function leaveReader(){if(location.hash==='#story')location.hash='menu'}
$('#begin').onclick=enterReader;$('#leave').onclick=leaveReader;window.addEventListener('hashchange',route);caption();if(location.hash==='#story')route();
