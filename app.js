const $=s=>document.querySelector(s),panel=$('#panel'),content=$('#content');
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem('nocturne:'+k))??d}catch{return d}},save=(k,v)=>{try{localStorage.setItem('nocturne:'+k,JSON.stringify(v))}catch{}};
let size=read('size','21px');if(!['19px','21px','24px'].includes(size))size='21px';const setSize=()=>document.documentElement.style.setProperty('--read',size);setSize();
function openPanel(title,kicker,html){content.innerHTML=`<div class="kicker">${kicker}</div><h2 id="panelTitle">${title}</h2>${html}`;panel.setAttribute('aria-labelledby','panelTitle');if(!panel.open)panel.showModal();panel.scrollTop=0;$('.close').focus()}
$('.close').onclick=()=>panel.close();panel.onclick=e=>{if(e.target!==panel)return;const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close()};
function archive(key){
  const title={world:'Мир новеллы',people:'Персонажи',journal:'Дневник'}[key];
  openPanel(title,'КОЛЛЕКЦИЯ / АРХИВ ИМПЕРИИ','');
  const entry=(h,t)=>content.append(textNode('h3',h),textNode('p',t));
  if(key==='journal'){
    entry(progress?storyDate:'Чистая страница',progress?`Из дневника Алексея Вельского. Текущая запись: «${scenes[progress.scene].title}».`:'Здесь появятся только те решения, которые вы уже приняли.');
    progress?.log.forEach(t=>content.append(textNode('p',t)));return;
  }
  if(key==='people'){
    entry('Алексей Андреевич Вельский','Коллежский регистратор, 29 лет. Десятый год разбирает дела о бесплатных койках в петербургском попечительстве.');
    for(const [id,name,note] of [
      ['visitor','Соня Корнеева','Дочь красильщика. Принесла в архив половину больничной квитанции.'],
      ['chief','Николай Мокеевич Чижов','Старший регистратор. Виза на запросе принадлежит ему.'],
      ['ward','Анна Глебовна','Фельдшерица в лечебнице на Фонтанке. Дежурит сутки через двое.'],
      ['bed','Матвей Корнеев','Красильщик, отец Сони. После несчастного случая лежит в седьмой палате.'],
      ['shop','Сазонова','Хозяйка типографии, в которой прежде работал отец Алексея.'],
      ['stairs','Акулина','Бывшая наборщица. Живёт над типографией.'],
      ['receiver','Павел Шатров','Приёмщик возврата. Алексей нашёл его на пристани.'],
      ['tenant','Тимофей','Пассажир закрытых саней.']
    ])if(progress?.seen.includes(id))entry(name,note);
  }else{
    entry('Санкт-Петербург · март 1881','Столица носит траур. В учреждениях продолжают принимать прошения, с утра разжигают печи и считают расходы на хлеб.');
    if(progress){const visited=new Set(progress.seen.map(id=>scenes[id]?.place).filter(Boolean));entry('На полях дневника',[...visited].map(id=>places[id][0]).join(' · '))}
  }
}
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>archive(b.dataset.panel));
let audio=null;function sound(){if(audio){audio.close();audio=null}else{try{audio=new AudioContext();const gain=audio.createGain();gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.linearRampToValueAtTime(.031,audio.currentTime+1.5);gain.connect(audio.destination);[73.416,110,146.65].forEach(freq=>{const o=audio.createOscillator();o.frequency.value=freq;o.connect(gain);o.start()});const buffer=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate);let v=0;const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++){v=(v+.055*(Math.random()*2-1))*.98;samples[i]=v}const breeze=audio.createBufferSource();breeze.buffer=buffer;breeze.loop=true;breeze.connect(gain);breeze.start();audio.resume()}catch{audio=null}}$('#audio').setAttribute('aria-pressed',String(!!audio));$('#audio span').textContent=audio?'Звук включён':'Звук выключен';$('#audio use').setAttribute('href',audio?'#on':'#sound');if($('#setSound'))$('#setSound').textContent=audio?'Включён':'Выключен'}$('#audio').onclick=sound;
function settings(){openPanel('Настройки','NOCTURNE / ПАРАМЕТРЫ',`<div class="setting"><label for="size">Размер текста новеллы</label><select id="size"><option value="19px">Мелкий</option><option value="21px">Обычный</option><option value="24px">Крупный</option></select></div><div class="setting">Атмосферный звук<button id="setSound">${audio?'Включён':'Выключен'}</button></div>${progress?'<button class="choice" id="reset">Начать историю заново</button>':''}`);$('#size').value=size;$('#size').onchange=e=>{size=e.target.value;save('size',size);setSize()};$('#setSound').onclick=sound;if($('#reset'))$('#reset').onclick=()=>{openPanel('Стереть записи?','ДНЕВНИК','<p>Все решения этого прохождения будут удалены.</p><button class="choice" id="cancel">Сохранить записи</button><button class="choice" id="confirm">Стереть и начать заново</button>');$('#cancel').onclick=settings;$('#confirm').onclick=()=>{progress=fresh();persist();panel.close();enterReader()}}}$('#settings').onclick=settings;
window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();

let progress=restore(read('chapter-one-v3',null));
const persist=()=>save('chapter-one-v3',progress);
function caption(){
  $('#begin span').textContent=progress?(scenes[progress.scene].final?'Открыть летопись':'Продолжить историю'):'Начать историю';
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
  if(!c.used)moves.push(['skill',s.fight.skill,'Один раз · −3 стойкости без ответа']);
  moves.forEach(([act,label,meta])=>actionButton(label,()=>{const prev=progress.scene;fightTurn(progress,act);persist();renderStory(prev===progress.scene)},meta));
}
function renderStory(sameRoundScreen=false){
  const p=progress,s=scenes[p.scene],place=places[p.scene==='fallen'?(p.flags.lastPlace||s.place):s.place];
  $('#location').textContent=place[0];$('.plate-art').style.backgroundImage=`linear-gradient(0deg,#1112173b,transparent 45%),url(assets/${place[1]}.jpg)`;
  $('#identity').textContent=heroName;
  $('#sceneDate').textContent=storyDate;$('#sceneTime').textContent=s.time;
  $('#bookPart').textContent=`ГЛАВА I / ${chapterName.toUpperCase()}`;
  $('.folio').textContent=`ПЕТЕРБУРГ / ЛИСТ ${String(p.seen.indexOf(p.scene)+1).padStart(2,'0')}`;
  $('#sceneTitle').textContent=s.title;const paras=[...s.text];
  if(p.scene==='decision'&&p.flags.named)paras.splice(-1,0,'Есть ещё Сонин корешок с входящим номером. По нему можно связать решение с её утренним прошением. Тогда ключ от дела останется не в канцелярии: за подлинником сможет прийти сама Соня.');
  if(p.scene==='empty'&&p.flags.nurse)paras.splice(1,0,'Вы уже видели, как Анна прислушивается к дыханию старика, не прерывая разговора. Так же сейчас она слушает голоса за дверью. Вдруг, на середине фразы, просит позвать Пелагею: в коридоре кашлянул её пациент, ему нельзя стоять на сквозняке. Только убедившись, что его укрыли, она продолжает.');
  if(p.scene==='hearing'&&p.flags.colour)paras.splice(1,0,'Вы отдаёте священнику заверенную копию строки, проступившей под бронзовым порошком. Он медленно пододвигает бумагу врачу. Прежде чем опять заговорить об устном согласии больного, тому придётся объяснить, почему одно из условий согласия напечатали так, что сам больной никогда его не прочёл бы.');
  if(p.scene==='decision')paras.splice(1,0,p.flags.escort?'Павел стоит у двери в чужом полушубке. На вопрос о жалованье он вместо ответа протягивает увольнительную: в ней есть дата, и с этой даты, хотя бы с неё, он отказывается числиться получателем денег, которых не держал в руках. Священник сверяет подпись и просит Павла сесть рядом с остальными.':'Врач сперва хочет оставить в строке только инициалы проезжего. Но вы кладёте перед ним расписку Тимофея. Если один человек не постыдился написать собственное имя, другой не вправе его зачёркивать ради удобства. В расходной книге появляется Крюков. В первый раз за сорок лет эта фамилия обозначает не запись о погребении, а обязанность отвечать за свой проезд.');
  if(p.scene==='decision'&&p.flags.copy)paras.splice(2,0,'Сазонова прислала из кухни подсохший лист журнала. Подгорели углы, но дата и подпись читаются. Совет вынужден принять его как приложение к решению. В книге будет не только ваше свидетельство: останется подлинник, который уже однажды пытались сжечь.');
  $('#prose').replaceChildren(...paras.map(t=>textNode('p',t)));$('#battle').replaceChildren();$('#battle').className='';$('#actions').replaceChildren();
  $('#decisionLabel').textContent=s.dead?'ЖИЗНЬ ОБОРВАЛАСЬ':s.final?'ГЛАВА ЗАВЕРШЕНА':s.fight?'ВАШ ХОД':'ВАШЕ РЕШЕНИЕ';
  if(s.fight)renderFight(p,s);
  else if(s.final){if(s.dead)actionButton('Вернуться к контрольной точке',()=>{progress=rewind(progress);persist();renderStory()});actionButton('В главное меню',leaveReader)}
  else visibleChoices(p).forEach(([label],i)=>actionButton(label,()=>{decide(progress,i);persist();renderStory()}));
  caption();if(sameRoundScreen){$('#actions button').focus({preventScroll:true})}else{$('#sceneTitle').focus({preventScroll:true});window.scrollTo(0,0)}
}
function route(){const inStory=location.hash==='#story';$('#reader').hidden=!inStory;$('#landing').hidden=inStory;$('footer').hidden=inStory;
  if(inStory){if(!progress){progress=fresh();persist()}const pos=progress.position||0;renderStory();if(pos)window.scrollTo(0,pos)}else{caption();$('#begin').focus({preventScroll:true});window.scrollTo(0,0)}
}
function enterReader(){if(location.hash!=='#story')location.hash='story';else route()}
function leaveReader(){if(location.hash==='#story'){keepPlace();location.hash='menu'}}
let scrollTimer;
function keepPlace(){if(progress&&!$('#reader').hidden){progress.position=window.scrollY;persist()}}
window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(keepPlace,160)},{passive:true});
window.addEventListener('pagehide',keepPlace);
$('#begin').onclick=enterReader;$('#leave').onclick=leaveReader;window.addEventListener('hashchange',route);caption();if(location.hash==='#story')route();
