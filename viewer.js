import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const $=id=>document.getElementById(id), canvas=$('canvas'), meshes=[], mats=new Map();
const revision='smooth-speech-20261114', direction=new THREE.Vector3(.857,.15,.496).normalize(), bodyCenter=new THREE.Vector3();
const audio=new Audio(`./assets/speech.mp3?v=${revision}`);audio.loop=true;audio.preload='metadata';audio.volume=.8;
let renderer,scene,camera,controls,mixer,action,helper,root,manifest,jaw,jawNeutral,jawAxis;
let duration=8,paused=false,rate=1,scrubbing=false,manual=false,voice=false,bodyDistance=1.6,currentView='face';
const values={Open:0,A:0,E:0,O:0,U:0,FV:0,MBP:0,Smile:0,BlinkL:0,BlinkR:0};
const labels={Open:'张嘴',A:'A',E:'E',O:'O 圆唇',U:'U 撅唇',FV:'FV 咬唇',MBP:'MBP 闭唇',Smile:'微笑',BlinkL:'左眼眨眼',BlinkR:'右眼眨眼'};
const state={loaded:false,mode:'texture',meshCount:0,textureCount:0,triangleCount:0,boneCount:0,morphCount:0,frames:0,error:null};
const helps={texture:'同一张共享贴图，不叠加灯光。',studio:'共享贴图与工作室灯光。',clay:'中性材质，检查真实网格与嘴部变形。',wire:'查看连续的网格与下巴变形。'};
function fail(e){console.error(e);state.error=String(e.message||e);$('loading').classList.add('error');$('loadLabel').textContent='模型加载失败：'+state.error;$('progress').hidden=true;}
function mode(m){if(!state.loaded)return;state.mode=m;meshes.forEach(o=>o.material=mats.get(o)[m]);$('modeHelp').textContent=helps[m];document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===m));}
function home(v='face'){
 if(!state.loaded)return;currentView=v;const d=direction.clone(),focus=v==='face'?new THREE.Vector3(...manifest.faceFocus):bodyCenter.clone();
 if(v==='side')d.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);if(v==='back')d.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
 const distance=v==='face'?manifest.faceDistance*Math.max(1,.85/camera.aspect):bodyDistance;
 camera.position.copy(focus).addScaledVector(d,distance);controls.target.copy(focus);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===v));
}
function playback(){if(!action)return;action.paused=paused;$('play').textContent=paused?'▶':'Ⅱ';$('play').setAttribute('aria-label',paused?'播放动画':'暂停动画');}
function sample(time){action.paused=false;mixer.setTime(Math.min(time,duration-1e-5));action.paused=paused;root.updateMatrixWorld(true);}
function resetAction(time=0){action.reset().setLoop(THREE.LoopRepeat,Infinity).play();sample(time);}
async function startDemo(withVoice=voice){
 if(!state.loaded)return;manual=false;paused=false;Object.keys(values).forEach(k=>values[k]=0);syncSliders();resetAction(0);voice=withVoice;$('voice').checked=voice;
 audio.pause();audio.currentTime=0;audio.playbackRate=rate;playback();
 if(voice){try{await audio.play();$('speechHelp').textContent='合成中文语音，口型近似同步。';}catch(e){voice=false;$('voice').checked=false;$('speechHelp').textContent='声音未能播放，可继续查看无声动画。';}}
 $('speak').textContent='重播中文说话 ↻';
}
function syncSliders(){for(const [name,v] of Object.entries(values)){const input=document.querySelector(`[data-control="${name}"]`);if(input){input.value=v;input.parentElement.querySelector('output').value=v.toFixed(2);}}}
function morph(name,value){const mesh=meshes[0],index=mesh.morphTargetDictionary?.[name];if(index!==undefined)mesh.morphTargetInfluences[index]=value;}
function applyManual(){
 if(!state.loaded)return;manual=true;paused=true;audio.pause();resetAction(0);meshes[0].morphTargetInfluences.fill(0);
 for(const name of manifest.controls)morph('Mouth.'+name,values[name]);
 for(const side of ['L','R']){const b=values['Blink'+side],half=Math.max(0,1-Math.abs(2*b-1)),closed=Math.max(0,2*b-1);for(const part of ['Upper','Lower']){morph(`${part}Lid.${side}.Half`,half);morph(`${part}Lid.${side}.Closed`,closed);}}
 const opening=Math.max(...Object.entries(manifest.jawCoefficients).map(([k,c])=>values[k]*c));jaw.quaternion.copy(jawNeutral).multiply(new THREE.Quaternion().setFromAxisAngle(jawAxis,manifest.jawMaxAngle*opening));root.updateMatrixWorld(true);playback();
 $('speechHelp').textContent='手动调整中。点击“播放中文说话”恢复动画。';
}
function makeSliders(){
 for(const [name,label] of Object.entries(labels)){const row=document.createElement('label');row.className='face-slider';const title=document.createElement('span');title.textContent=label;const input=document.createElement('input');input.type='range';input.min=0;input.max=1;input.step=.01;input.value=0;input.dataset.control=name;input.setAttribute('aria-label',label);const out=document.createElement('output');out.value='0.00';row.append(title,input,out);$('faceSliders').append(row);input.addEventListener('input',()=>{if(manifest.controls.includes(name)){for(const k of manifest.controls)values[k]=0;}values[name]=Number(input.value);syncSliders();applyManual();});}
}
function diagnostics(){return {...state,animationTime:action?.time||0,paused,rate,manual,voice,audioTime:audio.currentTime,audioPaused:audio.paused,view:currentView,camera:camera.position.toArray(),target:controls.target.toArray(),skeletonVisible:helper?.visible||false,boneQuaternion:meshes[0]?.skeleton?.bones.find(b=>b.name==='Head')?.quaternion.toArray(),jawQuaternion:jaw?.quaternion.toArray(),mouthOpen:meshes[0]?.morphTargetInfluences?.[meshes[0]?.morphTargetDictionary?.['Mouth.Open']],mouthA:meshes[0]?.morphTargetInfluences?.[meshes[0]?.morphTargetDictionary?.['Mouth.A']],blinkL:meshes[0]?.morphTargetInfluences?.[meshes[0]?.morphTargetDictionary?.['UpperLid.L.Closed']],jawSampleAngle:state.jawSampleAngle};}
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.setClearColor(0,0);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.005,100);controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.autoRotateSpeed=.7;controls.maxPolarAngle=Math.PI*.94;
 scene.add(new THREE.HemisphereLight(0xe8eddf,0x6a5f4b,1.8));const key=new THREE.DirectionalLight(0xfff1d8,2.4),fill=new THREE.DirectionalLight(0xc5d6e7,.65),rim=new THREE.DirectionalLight(0xf9e2bd,1.4);key.position.set(2,3,3);fill.position.set(-3,1,2);rim.position.set(0,2,-3);scene.add(key,fill,rim);key.target.position.set(0,.1,0);scene.add(key.target);
 $('light').addEventListener('input',e=>{const a=Number(e.target.value)*Math.PI/180;key.position.set(3*Math.cos(a),2.6,3*Math.sin(a));});
 new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}).observe(canvas);
 (async()=>{
  manifest=await fetch(`./assets/rig_manifest.json?v=${revision}`).then(r=>{if(!r.ok)throw Error('Rig metadata unavailable');return r.json();});
  const g=await new GLTFLoader().loadAsync(`./assets/woman.glb?v=${revision}`,e=>{if(e.total){const p=Math.round(e.loaded/e.total*100);$('progress').value=p;$('loadLabel').textContent=p<100?`加载模型… ${p}%`:'准备嘴部与眼睛动画…';}});
  root=g.scene;scene.add(root);const textures=new Set();
  root.traverse(o=>{if(!o.isMesh)return;meshes.push(o);o.frustumCulled=false;state.triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;const original=o.material,map=original.map;if(map){textures.add(map);map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);}const studio=original.clone();studio.side=THREE.DoubleSide;studio.emissive?.set(0);studio.roughness=.7;studio.metalness=0;mats.set(o,{texture:new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}),studio,clay:new THREE.MeshStandardMaterial({color:0xaaa9a0,roughness:.78,side:THREE.DoubleSide}),wire:new THREE.MeshBasicMaterial({color:0xc4b58f,wireframe:true,transparent:true,opacity:.45})});});
  state.meshCount=meshes.length;state.textureCount=textures.size;state.boneCount=meshes[0]?.skeleton?.bones.length||0;state.morphCount=meshes[0]?.morphTargetInfluences?.length||0;
  if(state.meshCount!==1||state.textureCount!==1||state.boneCount!==14||state.morphCount!==16)throw Error('未载入最新的平滑说话模型');
  root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root,true),size=box.getSize(new THREE.Vector3());box.getCenter(bodyCenter);bodyCenter.y+=size.y*.035;bodyDistance=Math.max(size.y/(2*Math.tan(THREE.MathUtils.degToRad(16))),size.x/(2*Math.tan(THREE.MathUtils.degToRad(16))*camera.aspect))*1.5;controls.minDistance=size.y*.25;controls.maxDistance=size.y*7;
  helper=new THREE.SkeletonHelper(root);helper.visible=false;helper.material.depthTest=false;helper.material.transparent=true;helper.renderOrder=10;scene.add(helper);
  const clip=g.animations[0];if(!clip)throw Error('Animation is missing');duration=clip.duration;mixer=new THREE.AnimationMixer(root);action=mixer.clipAction(clip);action.setLoop(THREE.LoopRepeat,Infinity).play();paused=false;sample(0);
  jaw=meshes[0].skeleton.bones.find(b=>b.name==='Jaw');if(!jaw)throw Error('Jaw bone is missing');jawNeutral=jaw.quaternion.clone();const jawTrack=clip.tracks.find(t=>t.name==='Jaw.quaternion');if(!jawTrack)throw Error('Jaw animation is missing');const q=new THREE.Quaternion().fromArray(jawTrack.createInterpolant().evaluate(manifest.jawSampleTime));const relative=jawNeutral.clone().invert().multiply(q).normalize();if(relative.w<0)relative.set(-relative.x,-relative.y,-relative.z,-relative.w);jawAxis=new THREE.Vector3(relative.x,relative.y,relative.z).normalize();state.jawSampleAngle=2*Math.acos(THREE.MathUtils.clamp(relative.w,-1,1));if(Math.abs(state.jawSampleAngle-manifest.jawSampleAngle)>.002)throw Error('Jaw animation calibration mismatch');
  paused=matchMedia('(prefers-reduced-motion: reduce)').matches;playback();$('timeline').max=duration;['timeline','play','speed','speak','voice'].forEach(id=>$(id).disabled=false);$('triangles').textContent=state.triangleCount.toLocaleString('en-US');$('bones').textContent=state.boneCount+' bones';$('status').textContent='平滑下巴 · 眼睛与说话动画 · 一张共享贴图';state.loaded=true;makeSliders();mode('texture');home('face');$('loading').classList.add('hidden');
 })().catch(fail);
 $('speak').addEventListener('click',()=>startDemo(true));$('voice').addEventListener('change',e=>{voice=e.target.checked;if(voice)startDemo(true);else audio.pause();});$('resumeDemo').addEventListener('click',()=>startDemo(voice));
 document.querySelectorAll('[data-pose]').forEach(b=>b.addEventListener('click',()=>{for(const k of Object.keys(values))values[k]=0;if(b.dataset.pose!=='Neutral')values[b.dataset.pose]=1;syncSliders();applyManual();}));
 $('play').addEventListener('click',async()=>{if(manual){startDemo(voice);return;}paused=!paused;playback();if(paused)audio.pause();else if(voice){audio.currentTime=action.time;try{await audio.play();}catch(e){voice=false;$('voice').checked=false;}}});
 $('speed').addEventListener('click',()=>{rate=rate===1?.5:rate===.5?1.5:1;$('speed').textContent=rate+'×';audio.playbackRate=rate;});
 $('timeline').addEventListener('input',e=>{if(!mixer)return;scrubbing=true;manual=false;const t=Number(e.target.value);resetAction(t);audio.currentTime=t;});$('timeline').addEventListener('change',()=>scrubbing=false);
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>mode(b.dataset.mode)));document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>home(b.dataset.view)));$('reset').addEventListener('click',()=>{controls.autoRotate=false;$('turntable').checked=false;home('face');});$('turntable').addEventListener('change',e=>controls.autoRotate=e.target.checked);$('skeleton').addEventListener('change',e=>{if(helper)helper.visible=e.target.checked;});
 const clock=new THREE.Clock();let visible=true;document.addEventListener('visibilitychange',()=>{visible=!document.hidden;clock.getDelta();});
 renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.08);if(!visible)return;if(mixer&&!manual&&!paused&&!scrubbing){if(voice&&!audio.paused)sample(Math.min(audio.currentTime,duration-1e-5));else mixer.update(dt*rate);}controls.update(dt);if(action&&!scrubbing){$('timeline').value=action.time;$('time').textContent=manual?'手动口型':`${action.time.toFixed(1)} / ${duration.toFixed(1)} s`;}renderer.render(scene,camera);state.frames++;if(state.frames%20===0)canvas.dataset.diagnostics=JSON.stringify(diagnostics());});window.viewerDiagnostics=diagnostics;
}catch(e){fail(e);}
