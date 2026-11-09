'use strict';
const $ = id => document.getElementById(id);
const pageNav=document.querySelector('.nav');
function sizeTitleViewport(){document.documentElement.style.setProperty('--nav-height',`${pageNav.getBoundingClientRect().height}px`);}
sizeTitleViewport();
new ResizeObserver(sizeTitleViewport).observe(pageNav);
// Default to 2× playback; the title montage opts into 3×.
function configureVideo(video){const applyRate=()=>{const rate=Number(video.dataset.playbackRate)||2;video.defaultPlaybackRate=rate;video.playbackRate=rate;};applyRate();video.addEventListener('loadedmetadata',applyRate);}
document.querySelectorAll('video').forEach(configureVideo);
const asset = (name, ext = 'webp') => `assets/story/${name}.${ext}${name==='invar-bottles'&&ext==='mp4'?'?v=20261020-2':'?v=20261103-1'}`;
function text(id, value) { $(id).textContent = value; }
function setVideo(id, name, label, legacy = false) {
  const video = $(id);
  const resume = !video.paused;
  video.pause();
  video.poster = legacy ? `assets/videos/${name}_poster.jpg` : asset(name, 'jpg');
  video.src = legacy ? `assets/videos/${name}.mp4` : asset(name, 'mp4');
  video.setAttribute('aria-label', label);
  video.load();
  if (resume || (video.hasAttribute("data-rollout-autoplay") && !reducedMotion.matches && video.getBoundingClientRect().bottom>0 && video.getBoundingClientRect().top<innerHeight)) video.play().catch(() => {});
}
function bindGroup(attribute, callback) {
  const buttons = [...document.querySelectorAll(`button[${attribute}]`)];
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    callback(button.getAttribute(attribute));
  }));
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let variation = 1;
function selectVariation(value){
 variation=Number(value);
 for(const [cam,id] of [['top','student-image'],['left','student-left'],['right','student-right']]){
  $(id).src=asset(`chess-v${variation}-${cam}`);$(id).alt=`Appearance variant ${variation}, ${cam} camera, same simulated chess state`;
  $(`student-pca-${cam}`).src=asset(`chess-v${variation}-${cam}-pca`);
  $(`student-pca-${cam}`).alt=`INVAR PCA: ${cam} camera, randomized appearance ${variation}`;
 }
}
$('variation').addEventListener('click',()=>selectVariation(variation%8+1));
const tasks = {
  pour: {video:'invar-pour',tag:'UNSEEN OBJECT AND TASK',title:'Pour wine into a bowl',description:'Neither these objects nor the pouring task appears in encoder pretraining.',caption:'Sharpa hand on a Tianji arm.',ours:58,baseline:25,name:'DINOv3 with DR',note:'24 real-world trials per method, compared with the strongest tested baseline.'},
  bottles: {video:'invar-bottles',tag:'UNSEEN OBJECTS AND TASK',title:'Put bottles into a bin',description:'The objects and the bottle-in-bin task are new to the pretrained encoder.',caption:'Parallel grippers on two YAM arms.',ours:83,baseline:46,name:'Frozen CAIP with DR',note:'24 real-world trials per method, compared with the strongest tested baseline.'},
  mug: {video:'invar-mug',tag:'UNSEEN OBJECT AND TASK',title:'Flip a mug',description:'The robot grasps and flips a mug—a task not used in encoder pretraining.',caption:'Bimanual parallel grippers.',ours:46,baseline:21,name:'DINOv3 with DR',note:'24 real-world trials per method, compared with the strongest tested baseline.'},
  grasp: {video:'grasp-spray',tag:'FIVE UNSEEN EVALUATION OBJECTS',title:'Grasp unseen objects',description:'The encoder sees grasping during pretraining, but none of these five objects.',caption:'Spray bottle · grasping trial.',ours:62,baseline:35,name:'Frozen CAIP with DR',note:'Success across all five objects: 125 trials per method, 25 per object.'}
};
const graspObjects = {spray:'Spray bottle',glass:'Wine glass',watering:'Watering can',tape:'Tape',hammer:'Hammer'};
let activeObject='spray';
function showGraspObject(key){
 activeObject=key;
 setVideo('result-video',`grasp-${key}`,`${graspObjects[key]} grasping rollout`);
 text('result-video-caption',`${graspObjects[key]} · grasping trial.`);
 document.querySelectorAll('[data-object]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.object===key)));
}
bindGroup('data-object',showGraspObject);
function showTask(key){
  const task = tasks[key];
  $('grasp-selector').hidden=key!=='grasp';
  if(key==='grasp')showGraspObject(activeObject);else {setVideo('result-video',task.video,`INVAR: ${task.title}`);text('result-video-caption',task.caption);}
  text('result-tag',task.tag);text('result-title',task.title);text('result-description',task.description);
  text('ours-score',`${task.ours}%`);text('baseline-score',`${task.baseline}%`);text('baseline-name',task.name);text('sample-note',task.note);$('ours-bar').style.width = `${task.ours}%`;$('baseline-bar').style.width = `${task.baseline}%`;
  selectedTask[activePlatform]=key;
  document.querySelectorAll('#result-tasks [data-task]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.task===key)));
}
const platformTasks={dex:[['grasp','Grasp unseen objects','grasp-spray'],['pour','Pour wine','invar-pour']],bimanual:[['bottles','Bottles into bin','invar-bottles'],['mug','Flip a mug','invar-mug']]};
const selectedTask={dex:'grasp',bimanual:'bottles'};
let activePlatform='dex';
function showPlatform(key){
 activePlatform=key;
 $('result-tasks').setAttribute('aria-label',key==='dex'?'Dexterous-hand tasks':'Bimanual-gripper tasks');
 $('result-tasks').replaceChildren(...platformTasks[key].map(([task,label,poster])=>{
  const button=document.createElement('button');button.type='button';button.dataset.task=task;
  const img=document.createElement('img');img.src=asset(poster,'jpg');img.alt='';
  const span=document.createElement('span');span.textContent=label;button.append(img,span);button.addEventListener('click',()=>showTask(task));return button;
 }));
 showTask(selectedTask[key]);
}
bindGroup('data-platform',showPlatform);showPlatform('dex');
const robustVideo=$('robust-video');
const robustViewport=document.querySelector('.robust-viewport');
const robustTasks={watering:['Watering-can grasping',25,'16 / 9'],spray:['Spray-bottle grasping',25,'16 / 9'],mug:['Mug flipping',24,'33 / 25'],bottles:['Bottles into a bin',24,'33 / 25']};
let robustPlaying=!reducedMotion.matches,robustRevealed=reducedMotion.matches;
function updateRobustZoom(){
 if(robustRevealed)return;
 const t=robustVideo.currentTime;
 const progress=Math.min(1,Math.max(0,(t-5)/3));
 const eased=progress*progress*(3-2*progress);
 robustViewport.style.setProperty("--reveal-progress",eased);
 robustVideo.style.transform=`translate(${25*(1-eased)}%,${25*(1-eased)}%) scale(${2.5-1.5*eased})`;
 if(progress===1)robustRevealed=true;
}
function resetRobustZoom(){robustRevealed=reducedMotion.matches;robustViewport.style.setProperty('--reveal-progress',robustRevealed?1:0);robustVideo.style.transform=robustRevealed?'none':'translate(25%,25%) scale(2.5)';}
function updateRobustButton(){text('robust-motion',robustPlaying?'Pause videos Ⅱ':'Play videos ▷');$('robust-motion').setAttribute('aria-pressed',String(robustPlaying));}
function showRobust(key){
 const [label,count,ratio]=robustTasks[key];
 robustViewport.style.aspectRatio=ratio;robustViewport.dataset.trials=count;
 setVideo('robust-video',`robust-${key}-shuffled`,`${label}: four contrasting conditions, then all ${count} trials in shuffled order`);
 text('robust-caption',`${label}: four contrasting conditions, then all ${count} trials in shuffled order.`);
 resetRobustZoom();if(!robustPlaying)robustVideo.pause();
}
bindGroup('data-robust',showRobust);
robustVideo.addEventListener('timeupdate',updateRobustZoom);
$('robust-replay').addEventListener('click',()=>{robustVideo.currentTime=0;resetRobustZoom();robustPlaying=true;robustVideo.play().catch(()=>{});updateRobustButton();});
$('robust-motion').addEventListener('click',()=>{robustPlaying=!robustPlaying;if(robustPlaying)robustVideo.play().catch(()=>{});else robustVideo.pause();updateRobustButton();});
resetRobustZoom();updateRobustButton();
const analysisSets={
 attention:[
  ['attention-robot','Spray bottle','Last-block CLS attention during a spray-bottle grasp. INVAR responds to the bottle and contact areas more than the background.'],
  ['attn-watering','Watering can','Attention during a watering-can grasp. Compare responses to the hand, object, shadows, and person in the background.'],
  ['attn-glass','Wine glass','Attention during a wine-glass grasp. All encoders receive the same image.'],
  ['attn-hammer','Hammer','Attention during hammer manipulation. INVAR responds to the hammer and the hand’s contact with it.'],
  ['attn-bottles','Bimanual','Attention during bimanual manipulation. This trial fails; the clip shows the encoder responses during that failure.']
 ],
 human:[
  ['attention-human','Human pouring','Attention during human pouring, viewed from a head-mounted camera. INVAR responds to the cup, bottle, and contact areas, although it was adapted only on simulation images.']
 ],
 pca:[
  ['pca-bottles','Bimanual','Patch-feature PCA during bottle manipulation. INVAR separates the grippers and objects from shadows and people in the background.'],
  ['pca-pour','Wine glass','Patch-feature PCA during wine-glass manipulation. Compare the features on the glass, hand, and background.'],
  ['pca-watering','Watering can','Patch-feature PCA during a watering-can grasp. The object and hand remain distinct as the scene changes.'],
  ['pca-sim-hammer','Simulation','Patch-feature PCA during simulated hammer grasping, before any change to real-world appearance.']
 ]
};
// Each analysis section keeps its own examples and playback controls.
for(const panel of document.querySelectorAll('[data-analysis-panel]')){
 const key=panel.dataset.analysisPanel;
 const video=panel.querySelector('video');
 if(!video)continue;
 const caption=panel.querySelector('[data-analysis-caption]');
 const examples=panel.querySelector('[data-analysis-examples]');
 const play=panel.querySelector('[data-analysis-play]');
 const time=panel.querySelector('[data-analysis-time]');
 const clock=panel.querySelector('[data-analysis-clock]');
 const speed=panel.querySelector('[data-analysis-speed]');
 function selectExample(index){
  const [file,label,description]=analysisSets[key][index];
  setVideo(video.id,file,`${label}: RGB, DINOv3, CAIP, INVAR (ours) ${key==='pca'?'patch PCA':'attention'}`);
  caption.textContent=description+(key==='pca'?' Colors show principal components of the features, not object labels.':'');
  if(examples)examples.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
 }
 if(examples)examples.replaceChildren(...analysisSets[key].map((entry,i)=>{
  const button=document.createElement('button');button.type='button';button.textContent=entry[1];
  button.setAttribute('aria-pressed',String(i===0));button.addEventListener('click',()=>selectExample(i));return button;
 }));
 function updatePlayback(){play.textContent=video.paused?'▷ Play':'Ⅱ Pause';play.setAttribute('aria-label',`${video.paused?'Play':'Pause'} ${panel.querySelector('h3').textContent.toLowerCase()}`);}
 play.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause();});
 video.addEventListener('play',updatePlayback);video.addEventListener('pause',updatePlayback);
 video.addEventListener('ratechange',()=>{speed.textContent=`${video.playbackRate}×`;});
 video.addEventListener('timeupdate',()=>{const t=video.currentTime;clock.textContent=`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;if(Number.isFinite(video.duration))time.value=100*t/video.duration;});
 video.addEventListener('emptied',()=>{clock.textContent='0:00';time.value=0;updatePlayback();});
 time.addEventListener('input',()=>{if(Number.isFinite(video.duration))video.currentTime=Number(time.value)/100*video.duration;});
 speed.addEventListener('click',()=>{video.playbackRate=video.playbackRate===1?.5:video.playbackRate===.5?2:1;});
 panel.querySelector('[data-analysis-expand]').addEventListener('click',()=>{const stage=panel.querySelector('.analysis-stage');if(stage.requestFullscreen)stage.requestFullscreen().catch(()=>{});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();});
 selectExample(0);
}
const scales = {
 diversity: {labels:['All three embodiments','Dexterous hand + gripper','Single embodiment'],values:[[84,71,63],[83,67,58]]},
 tasks: {labels:[['20 objects','10 objects','5 objects'],['5 tasks','2 tasks']],values:[[63,58,54],[58,50]]},
 size: {labels:['100% of pairs','50% of pairs','25% of pairs'],values:[[84,71,58],[83,67,50]]}
};
function renderScale(key){
 const {labels,values}=scales[key];
 $('scaling-data').hidden=key==='size';$('scaling-embodiments').hidden=key!=='diversity';$('scaling-task-sets').hidden=key!=='tasks';
 text('scaling-source',key==='tasks'?'Paper Table 3. Single-embodiment object and task diversity.':'Paper Table 2.');
 $('scaling-charts').innerHTML = ['Dexterous hand','Parallel gripper'].map((name,i) => `<div><h3>${name}</h3><span class="chart-label">Real-world success rate</span>${(Array.isArray(labels[i])?labels[i]:labels).map((label,j)=>`<div class="scale-row"><div><span>${label}</span><strong>${values[i][j]}%</strong></div><div class="track" aria-hidden="true"><span style="width:${values[i][j]}%"></span></div></div>`).join('')}</div>`).join('');
}
bindGroup('data-scale',renderScale);renderScale('diversity');
// Ambient hero clips pause out of view, with a persistent manual control.
let heroPlaying=!reducedMotion.matches;
function updateHeroButton(){text('hero-motion',heroPlaying?'Pause videos Ⅱ':'Play videos ▷');$('hero-motion').setAttribute('aria-pressed',String(heroPlaying));}
$('hero-motion').addEventListener('click',()=>{heroPlaying=!heroPlaying;updateHeroButton();document.querySelectorAll('[data-autoplay]').forEach(v=>{if(heroPlaying)v.play().catch(()=>{});else v.pause();});});
updateHeroButton();
let titlePlaying=!reducedMotion.matches;
let titleVisible=false;
const titleGrid=$('title-grid');
const titleVideos=[...titleGrid.querySelectorAll('video')];
const titlePouring=$('title-video');
function setTitlePouring(intro){
 const source=intro?'assets/story/wine-pour-sim-real.mp4':'assets/story/title-tiles/invar-pour.mp4';
 if(titlePouring.getAttribute('src')===source)return;
 const resumeAt=intro?0:titlePouring.currentTime*2;
 titlePouring.dataset.playbackRate=intro?'1':'3';
 titlePouring.poster=intro?'assets/story/wine-pour-sim-real.jpg':'assets/story/title-tiles/invar-pour.jpg';
 titlePouring.setAttribute('aria-label',intro?'Wine pouring with a sliding comparison between the real robot and simulation':'Real-world wine pouring');
 titlePouring.src=source;
 titlePouring.addEventListener('loadedmetadata',()=>{
  titlePouring.currentTime=resumeAt%titlePouring.duration;
  updateTitlePlayback();
 },{once:true});
 titlePouring.load();
}
titleGrid.addEventListener('animationend',event=>{
 if(event.target===titleGrid&&event.animationName==='title-reveal')setTitlePouring(false);
});
if(reducedMotion.matches)setTitlePouring(false);

function updateTitlePlayback(){
 const play=titlePlaying&&titleVisible&&!document.hidden;
 titleGrid.style.animationPlayState=play?'running':'paused';
 titleVideos.forEach(video=>{if(play)video.play().catch(()=>{});else video.pause();});
 text('title-motion',titlePlaying?'Pause videos Ⅱ':'Play videos ▷');
 $('title-motion').setAttribute('aria-pressed',String(titlePlaying));
}
$('title-motion').addEventListener('click',()=>{titlePlaying=!titlePlaying;updateTitlePlayback();});
$('title-replay').addEventListener('click',()=>{
 setTitlePouring(!reducedMotion.matches);
 titleVideos.forEach(video=>video.currentTime=0);
 titleGrid.classList.remove('title-intro');void titleGrid.offsetWidth;titleGrid.classList.add('title-intro');
 titlePlaying=true;updateTitlePlayback();
});
new IntersectionObserver(entries=>{titleVisible=entries[0].isIntersecting;updateTitlePlayback();},{threshold:.15}).observe(document.querySelector('.title-media'));
updateTitlePlayback();
const mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries){const v=entry.target;if(!entry.isIntersecting)v.pause();else if((v!==robustVideo||robustPlaying)&&((v.hasAttribute('data-autoplay')&&heroPlaying)||((v.hasAttribute('data-gallery-autoplay')||v.hasAttribute('data-rollout-autoplay'))&&!reducedMotion.matches))&&!document.hidden)v.play().catch(()=>{});}},{threshold:.15});
document.querySelectorAll('video:not([data-title-autoplay])').forEach(v=>{if(reducedMotion.matches&&(v.hasAttribute('data-autoplay')||v.hasAttribute('data-title-autoplay'))){v.autoplay=false;v.pause();}mediaObserver.observe(v);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());updateTitlePlayback();});



function positionStateConnectors(){
 const canvas=document.querySelector('.state-match-canvas');
 const box=canvas.getBoundingClientRect();
 const relative=el=>{const r=el.getBoundingClientRect();return {x:r.left-box.left,y:r.top-box.top,w:r.width,h:r.height};};
 const state=relative(canvas.querySelector('.shared-state'));
 for(const [row,id] of [['randomized','state-random-path'],['clean','state-clean-path']]){
  const target=relative(canvas.querySelector(`.${row} .appearance-control`));
  const sx=state.x+state.w*(row==='randomized'?.3:.7),sy=state.y+state.h+10;
  const tx=target.x+target.w/2,ty=target.y-12;
  const bend=sy+Math.max(10,(ty-sy)/2);
  $(id).setAttribute('d',`M ${sx} ${sy} V ${bend} H ${tx} V ${ty}`);
 }
 const student=relative(canvas.querySelector('.student')),teacher=relative(canvas.querySelector('.teacher'));
 const label=$('state-ema-label');
 const gap=teacher.x-student.x-student.w;
 if(gap>=110){
  const start=student.x+student.w+10,end=teacher.x-12,y=student.y+student.h/2;
  $('state-ema-path').setAttribute('d',`M ${start} ${y} H ${end}`);
  label.style.left=`${(start+end)/2}px`;label.style.top=`${y-10}px`;
 }else{
  const start=student.x+student.w*.78,end=teacher.x+teacher.w*.22,y=Math.min(student.y,teacher.y)-32;
  $('state-ema-path').setAttribute('d',`M ${start} ${student.y-10} V ${y} H ${end} V ${teacher.y-10}`);
  label.style.left=`${(start+end)/2}px`;label.style.top=`${y-8}px`;
 }
}
new ResizeObserver(positionStateConnectors).observe(document.querySelector('.state-match-canvas'));

// Left rails follow the visible section and link directly to each panel.
for(const rail of document.querySelectorAll('.section-rail')){
 const links=[...rail.querySelectorAll('a')];
 const observer=new IntersectionObserver(entries=>{
  const current=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
  if(current)links.forEach(link=>{if(link.hash===`#${current.target.id}`)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
 },{rootMargin:'-15% 0px -55% 0px'});
 links.forEach(link=>{const target=document.querySelector(link.hash);if(target)observer.observe(target);});
}
