'use strict';
const $ = id => document.getElementById(id);
// Default to 2× playback; the title montage opts into 3×.
function configureVideo(video){const rate=Number(video.dataset.playbackRate)||2;video.defaultPlaybackRate=rate;video.playbackRate=rate;video.addEventListener('loadedmetadata',()=>{video.playbackRate=rate;});}
document.querySelectorAll('video').forEach(configureVideo);
const asset = (name, ext = 'webp') => `assets/story/${name}.${ext}`;
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
bindGroup('data-approach', value => {
  const ours = value === 'invar';
  $('approach-stage').dataset.mode = value;
  document.querySelectorAll('.random-source,.random-edge').forEach(el => el.hidden = ours);
  text('input-caption', ours ? 'Clean images for each new policy' : 'Start from the nominal scene');
  text('encoder-state', ours ? 'FROZEN ENCODER' : 'FROZEN / FINETUNED');
  $('idea-snowflake').hidden=!ours;
  document.querySelector('.encoder').classList.toggle('frozen',ours);
  text('encoder-name', ours ? 'INVAR' : 'Vision encoder');
  text('output-caption', ours ? 'Zero-shot transfer' : 'Appearance changes can disrupt execution');
  setVideo('approach-video', ours ? 'invar-bottles' : 'baseline-bottles', ours ? 'INVAR real-world bottle manipulation example' : 'Prior approach bottle manipulation failure example');
  $('approach-explanation').innerHTML = ours ? '<strong>Randomize once, during encoder pretraining.</strong> Freeze INVAR and train each new policy on clean simulation images.' : '<strong>Clean simulation → randomized simulation → policy learning.</strong> Each new task needs its own randomized data. Each policy learns the task and how to handle changes in appearance.';
});
const steps = [
  ['STATE-MATCHED RENDERING', 'Change the appearance, keep the state.', 'The head and wrist cameras see the same robot and objects in both renders. Only the lighting, materials, table texture, and background change. INVAR learns to give these views similar features.', 'Same simulator state <i>s</i><br><span>clean render ↔ randomized render</span>'],
  ['ASYMMETRIC SELF-DISTILLATION', 'Match the teacher’s features.', 'The student learns to match the teacher’s output on the clean image. Gradients update the student, and a moving average of its weights updates the teacher.', 'Student(randomized) ≈ Teacher(clean)<br><span>CLS loss · stop-gradient teacher · EMA update</span>'],
  ['DOWNSTREAM POLICY LEARNING', 'Freeze INVAR and train a policy.', 'Keep the pretrained encoder fixed and train a policy on clean simulation images. Use both on the real robot, with no further training.', 'Clean image → frozen INVAR → policy<br><span>Simulation training → zero-shot deployment</span>']
];
let methodStep = 0;
let touring = false;
let methodVisible = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function showStep(value) {
  methodStep = Number(value);
  const [kicker,title,copy] = steps[methodStep];
  text('step-kicker',kicker); text('step-title',title); text('step-copy',copy);
  $('distill-stage').dataset.step = methodStep;
  requestAnimationFrame(()=>{positionEmaConnector();positionStateConnectors();});
  document.querySelectorAll('[data-step]').forEach(button => {if(button.tagName === 'BUTTON')button.setAttribute('aria-pressed',String(Number(button.dataset.step)===methodStep));});
  document.querySelectorAll('[data-scene]').forEach(scene => {scene.hidden=Number(scene.dataset.scene)!==methodStep;if(scene.hidden)scene.querySelectorAll('video').forEach(v=>v.pause());});
}
function positionEmaConnector(){
 const scene=document.querySelector('[data-scene="1"]');
 if(scene.hidden)return;
 const parent=scene.querySelector('.alignment-canvas').getBoundingClientRect(),student=scene.querySelector('.student').getBoundingClientRect(),teacher=scene.querySelector('.teacher').getBoundingClientRect();
 const x=student.left+student.width/2-parent.left,y1=student.bottom-parent.top,y2=teacher.top-parent.top;
 const line=$('ema-line');Object.entries({x1:x,x2:x,y1:y1+1,y2:y2-4}).forEach(([key,value])=>line.setAttribute(key,value));
 const label=$('ema-label');label.setAttribute('x',x-12);label.setAttribute('y',(y1+y2)/2-5);label.querySelectorAll('tspan').forEach(span=>span.setAttribute('x',x-12));
 const target=$('probe-target').getBoundingClientRect(),probeY=target.top+target.height/2-parent.top;
 $('probe-path').setAttribute('d',`M ${x} ${student.top-parent.top-2} V ${probeY} H ${target.left-parent.left-7}`);
}
new ResizeObserver(positionEmaConnector).observe(document.querySelector('.alignment-canvas'));
function updateTour(){text('method-tour', touring ? 'Ⅱ Pause tour' : '▷ Play tour');$('method-tour').setAttribute('aria-pressed',String(touring));}
bindGroup('data-step', value => {touring=false;updateTour();showStep(value);});
$('method-tour').addEventListener('click',()=>{touring=!touring;updateTour();if(touring)showStep((methodStep+1)%3);});
new IntersectionObserver(entries=>{methodVisible=entries[0].isIntersecting;},{threshold:.15}).observe($('distill-stage'));
setInterval(()=>{if(touring&&methodVisible&&!document.hidden)showStep((methodStep+1)%3);},6500);
let variation = 1;
function selectVariation(value){
 variation=Number(value);
 for(const [cam,id] of [['top','student-image'],['left','student-left'],['right','student-right']]){
  $(id).src=asset(`chess-v${variation}-${cam}`);$(id).alt=`Appearance variant ${variation}, ${cam} camera, same simulated chess state`;
 }
 $('alignment-student-image').src=asset(`chess-v${variation}-top`);
 document.querySelectorAll('[data-variant]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.variant)===variation)));
}
bindGroup('data-variant',selectVariation);
$('variation').addEventListener('click',()=>selectVariation(variation%8+1));
const galleries = {
  embodiments: [
    ['data-dex','Dexterous hand','','Simulated dexterous hand grasping an object'],
    ['data-gripper','Bimanual parallel gripper','','Simulated bimanual grippers manipulating dishes'],
    ['data-humanoid','Humanoid loco-manipulation','','Humanoid simulation in a furnished scene']
  ],
  views: [
    ['data-wrist','Wrist camera','','Simulated wrist-camera view of a cup'],
    ['data-head','Head camera','','Simulated head-camera view of a cup and workspace']
  ],
  tasks: [
    ['data-sweep','Sweep','Bimanual pretraining task.','Bimanual robots sweeping in simulation'],
    ['clean-chess','Chess','Bimanual pretraining task.','Chess manipulation in simulation'],
    ['data-dishrack','Dish rack','Bimanual pretraining task.','Dish-rack manipulation in simulation'],
    ['data-spell','Spell','Bimanual pretraining task.','Bimanual robots manipulating colored blocks'],
    ['data-pour','Pour','Bimanual pretraining task.','Bimanual pouring setup in simulation'],
    ['data-objects','Grasp 20 objects','Dexterous-hand pretraining.','The household object collection for dexterous grasp pretraining']
  ]
};
bindGroup('data-gallery', key => {
  $('data-gallery').querySelectorAll('video').forEach(video=>{video.pause();mediaObserver.unobserve(video);});
  $('data-gallery').className = `gallery ${key}`;
  if(key==='tasks'){
   $('data-gallery').replaceChildren($('pretraining-tasks-template').content.cloneNode(true));
   $('data-gallery').querySelectorAll('video').forEach(video=>{configureVideo(video);if(reducedMotion.matches){video.autoplay=false;video.pause();}mediaObserver.observe(video);});
   return;
  }
  $('data-gallery').replaceChildren(...galleries[key].map(([src,title,copy,alt]) => {
    const figure = document.createElement('figure');
    const img = document.createElement('img'); img.src = asset(src); img.alt = alt; img.loading = 'lazy';
    const caption = document.createElement('figcaption');
    const strong = document.createElement('strong'); strong.textContent = title;
    const span = document.createElement('span'); span.textContent = copy;
    caption.append(strong);if(copy)caption.append(span); figure.append(img,caption); return figure;
  }));
});
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
const robustness = {
  watering:['Watering-can grasping trials under varied visual conditions','Watering-can grasps under different lighting and surface conditions. Each tile is one trial.'],
  spray:['Spray-bottle grasping trials under varied visual conditions','Spray-bottle grasps with different lighting, surfaces, and backgrounds. Each tile is one trial.'],
  mug:['Mug-flipping trials under varied visual conditions','Mug flipping under different lighting and surface conditions. Each tile is one trial.'],
  bottles:['Bottle manipulation trials under varied visual conditions','Bottles into a bin under different lighting and surface conditions. Each tile is one trial.']
};
bindGroup('data-robust',key => {setVideo('robust-video',`robust-${key}`,robustness[key][0]);text('robust-caption',robustness[key][1]);});
const analysisSets={
 attention:[
  ['attention-robot','Spray bottle','Last-block CLS attention during a spray-bottle grasp. INVAR responds to the bottle and contact areas more than the background.'],
  ['attn-watering','Watering can','Attention during a watering-can grasp. Compare responses to the hand, object, shadows, and person in the background.'],
  ['attn-glass','Wine glass','Attention during a wine-glass grasp. All encoders receive the same image.'],
  ['attn-hammer','Hammer','Attention during hammer manipulation. INVAR responds to the hammer and the hand’s contact with it.'],
  ['attn-bottles','Bimanual','Attention during bimanual manipulation. This trial fails; the clip shows the encoder responses during that failure.'],
  ['attention-human','Human pouring','Attention during human pouring, viewed from a head-mounted camera. INVAR responds to the cup, bottle, and contact areas, although it was adapted only on simulation images.']
 ],
 pca:[
  ['pca-bottles','Bimanual','Patch-feature PCA during bottle manipulation. INVAR separates the grippers and objects from shadows and people in the background.'],
  ['pca-pour','Wine glass','Patch-feature PCA during wine-glass manipulation. Compare the features on the glass, hand, and background.'],
  ['pca-watering','Watering can','Patch-feature PCA during a watering-can grasp. The object and hand remain distinct as the scene changes.'],
  ['pca-sim-hammer','Simulation','Patch-feature PCA during simulated hammer grasping, before any change to real-world appearance.']
 ]
};
let analysisMode='attention';
function showAnalysisExample(index){
 const [file,label,caption]=analysisSets[analysisMode][index];
 setVideo('analysis-video',file,`${label}: RGB, INVAR, DINOv3, CAIP ${analysisMode==='pca'?'patch PCA':'attention'}`);
 text('analysis-caption',caption+(analysisMode==='pca'?' Colors show principal components of the features, not object labels.':''));
 document.querySelectorAll('[data-example]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.example)===index)));
}
function showAnalysis(key){
 const matches=key==='correspondence';$('analysis-video').pause();$('analysis-video').hidden=matches;$('analysis-image').hidden=!matches;$('analysis-labels').hidden=matches;$('analysis-examples').hidden=matches;$('analysis-transport').hidden=matches;
 if(matches){text('analysis-caption','Simulation queries (top) and nearest real-image matches (bottom), using cosine similarity. INVAR recovers the bowl, bottle, fingertip, and forearm in this example. DINOv3 confuses robot parts, while CAIP maps several queries to the background.');return;}
 analysisMode=key;$('analysis-examples').setAttribute('aria-label',`${key==='pca'?'Feature PCA':'Attention'} example`);
 $('analysis-examples').replaceChildren(...analysisSets[key].map((entry,i)=>{const b=document.createElement('button');b.type='button';b.dataset.example=i;b.textContent=entry[1];b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',()=>showAnalysisExample(i));return b;}));
 showAnalysisExample(0);
}
bindGroup('data-analysis',showAnalysis);showAnalysis('attention');
const analysisVideo=$('analysis-video');
function updateAnalysisPlayback(){text('analysis-play',analysisVideo.paused?'▷ Play':'Ⅱ Pause');$('analysis-play').setAttribute('aria-label',analysisVideo.paused?'Play visualization':'Pause visualization');}
$('analysis-play').addEventListener('click',()=>{if(analysisVideo.paused)analysisVideo.play().catch(()=>text('analysis-caption','The video could not play. Please reload the page and try again.'));else analysisVideo.pause();});
analysisVideo.addEventListener('ratechange',()=>text('analysis-speed',`${analysisVideo.playbackRate}×`));
analysisVideo.addEventListener('play',updateAnalysisPlayback);analysisVideo.addEventListener('pause',updateAnalysisPlayback);
analysisVideo.addEventListener('timeupdate',()=>{const t=analysisVideo.currentTime;text('analysis-clock',`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`);if(Number.isFinite(analysisVideo.duration))$('analysis-time').value=100*t/analysisVideo.duration;});
analysisVideo.addEventListener('emptied',()=>{text('analysis-clock','0:00');$('analysis-time').value=0;updateAnalysisPlayback();});
$('analysis-time').addEventListener('input',e=>{if(Number.isFinite(analysisVideo.duration))analysisVideo.currentTime=Number(e.target.value)/100*analysisVideo.duration;});
$('analysis-speed').addEventListener('click',()=>{const speed=analysisVideo.playbackRate===1?.5:analysisVideo.playbackRate===.5?2:1;analysisVideo.playbackRate=speed;text('analysis-speed',`${speed}×`);});
$('analysis-expand').addEventListener('click',()=>{const stage=document.querySelector('.analysis-stage');if(stage.requestFullscreen)stage.requestFullscreen().catch(()=>{});else if(analysisVideo.webkitEnterFullscreen)analysisVideo.webkitEnterFullscreen();});
const scales = {
 diversity: {labels:['All three embodiments','Dexterous hand + gripper','Single embodiment'],values:[[84,71,63],[83,67,58]]},
 tasks: {labels:[['20 objects','10 objects','5 objects'],['5 tasks','2 tasks']],values:[[63,58,54],[58,50]]},
 size: {labels:['100% of pairs','50% of pairs','25% of pairs'],values:[[84,71,58],[83,67,50]]}
};
function renderScale(key){
 const {labels,values}=scales[key];
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
const titleVideo=$('title-video');
function updateTitleButton(){$('title-motion').hidden=titleVideo.ended;text('title-motion',titlePlaying?'Pause video Ⅱ':titleVideo.ended?'Replay video ↻':'Play video ▷');$('title-motion').setAttribute('aria-pressed',String(titlePlaying));}
$('title-motion').addEventListener('click',()=>{titlePlaying=!titlePlaying;updateTitleButton();if(titlePlaying)titleVideo.play().catch(()=>{});else titleVideo.pause();});
$('title-replay').addEventListener('click',()=>{titleVideo.currentTime=0;titlePlaying=true;updateTitleButton();titleVideo.play().catch(()=>{});});
titleVideo.addEventListener('ended',()=>{titlePlaying=false;updateTitleButton();});
updateTitleButton();
const mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries){const v=entry.target;if(!entry.isIntersecting)v.pause();else if(((v.hasAttribute('data-autoplay')&&heroPlaying)||(v.hasAttribute('data-title-autoplay')&&titlePlaying)||((v.hasAttribute('data-gallery-autoplay')||v.hasAttribute('data-rollout-autoplay'))&&!reducedMotion.matches))&&!document.hidden)v.play().catch(()=>{});}},{threshold:.15});
document.querySelectorAll('video').forEach(v=>{if(reducedMotion.matches&&(v.hasAttribute('data-autoplay')||v.hasAttribute('data-title-autoplay'))){v.autoplay=false;v.pause();}mediaObserver.observe(v);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});

showStep(0);

function positionStateConnectors(){
 const canvas=document.querySelector('.state-match-canvas');if(canvas.closest('[data-scene]').hidden)return;
 const box=canvas.getBoundingClientRect(),state=canvas.querySelector('.shared-state').getBoundingClientRect();
 const relative=el=>{const r=el.getBoundingClientRect();return {x:r.left-box.left,y:r.top-box.top,w:r.width,h:r.height};};
 const mobile=innerWidth<=700;
 const sx=mobile?state.left-box.left+state.width*.25:state.right-box.left,sy=state.top-box.top+state.height*(mobile?1:.5);
 for(const [row,id] of [['randomized','state-random-path'],['clean','state-clean-path']]){
  const target=relative(canvas.querySelector(`.${row} .invariance-input>.node-label`));
  const x=target.x-7,y=target.y+target.h/2,branch=mobile?10:sx+14;
  $(id).setAttribute('d',`M ${sx} ${sy} H ${branch} V ${y} H ${x}`);
 }
 const first=relative(canvas.querySelector('.randomized .invariance-features')),second=relative(canvas.querySelector('.clean .invariance-features'));
 const x=first.x+first.w/2;
 $('similarity-path').setAttribute('d',mobile?`M ${first.x+first.w+2} ${first.y+first.h/2} H ${box.width-2} V ${second.y+second.h/2} H ${second.x+second.w+2}`:`M ${x} ${first.y+first.h+5} V ${second.y-5}`);
}
new ResizeObserver(positionStateConnectors).observe(document.querySelector('.state-match-canvas'));
