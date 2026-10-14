'use strict';
const $ = id => document.getElementById(id);
const asset = (name, ext = 'webp') => `assets/story/${name}.${ext}`;
function text(id, value) { $(id).textContent = value; }
function setVideo(id, name, label, legacy = false) {
  const video = $(id);
  video.pause();
  video.poster = legacy ? `assets/videos/${name}_poster.jpg` : asset(name, 'jpg');
  video.src = legacy ? `assets/videos/${name}.mp4` : asset(name, 'mp4');
  video.setAttribute('aria-label', label);
  video.load();
}
function bindGroup(attribute, callback) {
  const buttons = [...document.querySelectorAll(`[${attribute}]`)];
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    callback(button.getAttribute(attribute));
  }));
}
bindGroup('data-approach', value => {
  const ours = value === 'invar';
  $('approach-image').src = asset(ours ? 'clean-bottles' : 'random-bottles');
  $('approach-image').alt = ours ? 'Clean simulation of bimanual bottle manipulation' : 'Visually randomized simulation of bimanual bottle manipulation';
  text('input-label', ours ? 'Clean simulation' : 'Randomized simulation');
  text('input-caption', ours ? 'Train each new policy on nominal renders.' : 'Generate visual randomizations for each new task.');
  text('encoder-state', ours ? 'FROZEN' : 'FROZEN / FINETUNED');
  text('encoder-name', ours ? 'INVAR encoder' : 'Vision encoder');
  text('output-caption', ours ? 'Reuse learned invariance for zero-shot transfer.' : 'Appearance changes can disrupt task execution.');
  setVideo('approach-video', ours ? 'invar-bottles' : 'baseline-bottles', ours ? 'INVAR real-world bottle manipulation example' : 'Prior approach bottle manipulation failure example');
  $('approach-explanation').innerHTML = ours ? '<strong>Randomize during encoder pretraining.</strong> Freeze INVAR, then learn downstream behavior with clean simulation data. The representation is shared across tasks.' : '<strong>Randomize during policy training.</strong> Each new task needs randomized simulation data, and each policy must learn how to act despite visual variation. That invariance stays tied to the policy.';
});
const steps = [
  ['STATE-MATCHED RENDERING', 'Change appearance, preserve the scene.', 'Lighting, materials, table textures, camera extrinsics, and backgrounds vary. The simulator state stays fixed, so the pair provides a precise signal for which visual changes to ignore.', 'Same simulator state <i>s</i><br><span>clean render ↔ randomized render</span>'],
  ['ASYMMETRIC SELF-DISTILLATION', 'Align a randomized student to a clean teacher.', 'The student matches the teacher’s output distribution with a CLS self-distillation loss. Gradients update the student; an exponential moving average updates the teacher. The teacher always receives clean views.', 'Student(randomized) ≈ Teacher(clean)<br><span>CLS loss · stop-gradient teacher · EMA update</span>'],
  ['DOWNSTREAM POLICY LEARNING', 'Freeze the encoder. Learn new behavior.', 'After pretraining, the encoder stays fixed. A behavior-cloning policy learns on clean simulation images, then uses the same visual representation on the real robot. New policies reuse the learned visual invariance.', 'Clean image → frozen INVAR → policy<br><span>Simulation training → zero-shot deployment</span>']
];
bindGroup('data-step', value => {
  const [kicker,title,copy,equation] = steps[Number(value)];
  text('step-kicker',kicker); text('step-title',title); text('step-copy',copy); $('step-equation').innerHTML = equation;
});
let variation = 0;
$('variation').addEventListener('click', () => {
  variation = 1 - variation;
  $('student-image').src = asset(variation ? 'random-chess-2' : 'random-chess');
  $('student-image').alt = `Randomized rendering ${variation + 1} of the same simulated chess manipulation scene`;
});
const galleries = {
  embodiments: [
    ['data-dex','Dexterous hand','22-DoF hand; 20 pretraining objects.','Simulated dexterous hand grasping an object'],
    ['data-gripper','Bimanual parallel gripper','Five tabletop tasks; three camera views.','Simulated bimanual grippers manipulating dishes'],
    ['data-humanoid','Humanoid loco-manipulation','Object transport in reconstructed scenes.','Humanoid simulation in a furnished scene']
  ],
  views: [
    ['data-wrist','Wrist camera','A close view of the interaction.','Simulated wrist-camera view of a cup'],
    ['data-head','Head camera','The same scene from a wider viewpoint.','Simulated head-camera view of a cup and workspace']
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
  $('data-gallery').className = `gallery ${key}`;
  $('data-gallery').replaceChildren(...galleries[key].map(([src,title,copy,alt]) => {
    const figure = document.createElement('figure');
    const img = document.createElement('img'); img.src = asset(src); img.alt = alt; img.loading = 'lazy';
    const caption = document.createElement('figcaption');
    const strong = document.createElement('strong'); strong.textContent = title;
    const span = document.createElement('span'); span.textContent = copy;
    caption.append(strong,span); figure.append(img,caption); return figure;
  }));
});
const tasks = {
  pour: {video:'invar-pour',tag:'UNSEEN OBJECT AND TASK',title:'Pour wine into a bowl',description:'The object instances and the pouring motion are absent from encoder pretraining.',caption:'Sharpa dexterous hand on a Tianji arm. Example real-world rollout.',ours:58,baseline:25,name:'DINOv3 with DR',note:'24 real-world rollouts per method. Strongest evaluated baseline for this task.'},
  bottles: {video:'invar-bottles',tag:'UNSEEN OBJECTS AND TASK',title:'Put bottles into a bin',description:'Both the target objects and the bottle-in-bin task concept are absent from encoder pretraining.',caption:'Bimanual parallel grippers on YAM arms. Example real-world rollout.',ours:83,baseline:46,name:'Frozen CAIP with DR',note:'24 real-world rollouts per method. Strongest evaluated baseline for this task.'},
  mug: {video:'invar-mug',tag:'UNSEEN OBJECT AND TASK',title:'Flip a mug',description:'The policy must grasp and reorient a mug in a task not seen during encoder pretraining.',caption:'Bimanual parallel-gripper platform. Example real-world rollout.',ours:46,baseline:21,name:'DINOv3 with DR',note:'24 real-world rollouts per method. Strongest evaluated baseline for this task.'},
  grasp: {video:'grasp-spray',tag:'FIVE UNSEEN EVALUATION OBJECTS',title:'Grasp an unseen object',description:'Grasping is present during pretraining, but the five evaluation objects are held out. The video shows a spray-bottle example.',caption:'Sharpa dexterous hand. Example grasp of a held-out spray bottle.',ours:62,baseline:35,name:'Frozen CAIP with DR',note:'125 real-world rollouts per method: five objects, 25 rollouts each. Rates average the full grasping suite.'},
  hammer: {video:'dex_hammer',legacy:true,tag:'ADDITIONAL REAL-ROBOT DEMO',title:'Hammer on a nail',description:'A dexterous hand grasps and uses a hammer on real hardware. This demo is shown separately from the benchmark results above.',caption:'Additional real-world deployment demonstration, shown at 2× speed.'}
};
bindGroup('data-task', key => {
  const task = tasks[key];
  setVideo('result-video',task.video,`INVAR: ${task.title}`,task.legacy);
  text('result-tag',task.tag);text('result-title',task.title);text('result-description',task.description);text('result-video-caption',task.caption);
  $('result-scores').hidden = task.ours === undefined;
  if(task.ours !== undefined){text('ours-score',`${task.ours}%`);text('baseline-score',`${task.baseline}%`);text('baseline-name',task.name);text('sample-note',task.note);$('ours-bar').style.width = `${task.ours}%`;$('baseline-bar').style.width = `${task.baseline}%`;}
});
const robustness = {
  watering:['Watering-can grasping trials under varied visual conditions','Dexterous grasping of a watering can across varied real-world scenes. Each tile shows a separate rollout.'],
  spray:['Spray-bottle grasping trials under varied visual conditions','Dexterous grasping of a spray bottle under varied lighting, surfaces, and backgrounds. Each tile shows a separate rollout.'],
  mug:['Mug-flipping trials under varied visual conditions','Mug flipping with bimanual parallel grippers across varied real-world conditions. Each tile shows a separate rollout.'],
  bottles:['Bottle manipulation trials under varied visual conditions','Bottles into a bin with bimanual parallel grippers across varied real-world conditions. Each tile shows a separate rollout.']
};
bindGroup('data-robust',key => {setVideo('robust-video',`robust-${key}`,robustness[key][0]);text('robust-caption',robustness[key][1]);});
const analysis = {
  robot:['attention-robot','Last-block attention on real robot footage. INVAR concentrates on the manipulated object and contact regions; DINOv3 also attends to appearance variation, while CAIP is more diffuse.'],
  human:['attention-human','Last-block attention on human egocentric pouring footage, absent from INVAR adaptation. INVAR emphasizes the cup, bottle, and contact regions despite the change from simulated robots to real human video.'],
  pca:['pca-bottles','Patch-feature PCA on real bottle manipulation. Under INVAR, shadows and bystanders merge into the background feature region while the gripper and manipulated objects remain distinct. Colors visualize feature components, not semantic labels.'],
  correspondence:[null,'Simulation queries (top) and nearest real-image patch matches (bottom), using cosine similarity. INVAR recovers the bowl, bottle, fingertip, and forearm in this example. DINOv3 confuses robot parts, while CAIP maps several queries to background regions.']
};
bindGroup('data-analysis',key => {
  const matches = key === 'correspondence'; $('analysis-video').pause();$('analysis-video').hidden = matches;$('analysis-image').hidden = !matches;$('analysis-labels').hidden = matches;
  if(!matches) setVideo('analysis-video',analysis[key][0],`${key === 'pca' ? 'Patch PCA' : 'Attention'} comparison: input, INVAR, DINOv3, CAIP`);
  text('analysis-caption',analysis[key][1]);
});
const scales = {
 diversity: {labels:['All three embodiments','Dexterous hand + gripper','Single embodiment'],values:[[84,71,63],[83,67,58]]},
 size: {labels:['100% of pairs','50% of pairs','25% of pairs'],values:[[84,71,58],[83,67,50]]}
};
function renderScale(key){
 const {labels,values}=scales[key];
 $('scaling-charts').innerHTML = ['Dexterous hand','Parallel gripper'].map((name,i) => `<div><h3>${name}</h3><span class="chart-label">Real-world success rate</span>${labels.map((label,j)=>`<div class="scale-row"><div><span>${label}</span><strong>${values[i][j]}%</strong></div><div class="track" aria-hidden="true"><span style="width:${values[i][j]}%"></span></div></div>`).join('')}</div>`).join('');
}
bindGroup('data-scale',renderScale);renderScale('diversity');
// Keep media user-controlled and stop playback when its section leaves the screen.
const mediaObserver = new IntersectionObserver(entries => {for(const entry of entries)if(!entry.isIntersecting)entry.target.pause();},{threshold:0});
document.querySelectorAll('video').forEach(video => mediaObserver.observe(video));
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
