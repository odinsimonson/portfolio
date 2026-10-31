const $=id=>document.getElementById(id);
const P=[
 {id:'pixel-physics',name:'Pixel Physics',year:'2025',stack:'JavaScript, Canvas',pitch:'A falling-sand sandbox where every pixel is a particle with its own rules. Sand piles, water flows, and the whole thing runs in the browser.',hard:'Keeping tens of thousands of particles moving at 60 fps.',learned:'Cellular automata, update-order bugs, and why typed arrays are fast.'},
 {id:'physics-sim',name:'Physics Simulation',year:'2025',stack:'JavaScript',pitch:'Rigid bodies, springs and collisions written from scratch with no physics engine. You can throw things around and watch them settle.',hard:'Fast objects tunnelling straight through each other.',learned:'Integrators, collision response, and fixed timesteps.'},
 {id:'escanor-vs-mob',name:'Escanor vs Mob',year:'2026',stack:'Unity, C#',pitch:'An arena brawler in Unity: one overpowered hero against an endless mob that keeps getting bigger.',hard:'Hundreds of enemies on screen without frame drops.',learned:'Object pooling, steering AI, and game feel.'},
 {id:'redline',name:'Redline',year:'2026',stack:'(your stack)',pitch:'Sample paragraph for Redline. Say what it is, who it is for, and the one thing that makes it interesting.',hard:'Sample: the hardest problem you hit.',learned:'Sample: what you would tell another student.'},
 {id:'america-quest',name:'America Quest',year:'2025',stack:'(your stack)',pitch:'Sample paragraph for America Quest. Say what it is, who it is for, and the one thing that makes it interesting.',hard:'Sample: the hardest problem you hit.',learned:'Sample: what you would tell another student.'},
 {id:'elden-cube',name:'Elden Cube',year:'2026',stack:'(your stack)',pitch:'Sample paragraph for Elden Cube. Say what it is, who it is for, and the one thing that makes it interesting.',hard:'Sample: the hardest problem you hit.',learned:'Sample: what you would tell another student.'}
];

/* ---------- themes ---------- */
const THEMES={amber:'#ffb000',green:'#45ff8f',matrix:'#00ff41',lime:'#b6ff3a',mint:'#9dffcf',teal:'#2ee6c5',cyan:'#3ff0ff',sky:'#5ab8ff',blue:'#7cc7ff',ice:'#bfe8ff',violet:'#8f6bff',purple:'#b46bff',lavender:'#c8a8ff',magenta:'#ff3cf0',pink:'#ff8fc8',hotpink:'#ff3ea5',rose:'#ff6f91',ruby:'#e0115f',crimson:'#e8173c',red:'#ff4a4a',scarlet:'#ff2400',coral:'#ff7f6a',orange:'#ff8a1f',gold:'#ffd43a',white:'#e9e9e9'};
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgb=c=>`rgb(${c.join(',')})`;
const WHITE=[255,255,255], BLACK=[0,0,0];
// cell types: 1 sand, 2 name, 3 water, 4 lava, 5 rock, 6 steam, 7 confetti,
// 8 seed, 9 stem, 10 petal, 11 leaf, 12 flower center
const PETALS=[[255,105,180],[255,80,80],[255,210,60],[180,120,255],[255,255,255],[255,150,60],[100,190,255]];
const PAL={3:[[61,139,253],[86,160,255],[52,120,230]],4:[[255,90,31],[255,140,40],[230,60,20],[255,190,70]],5:[[96,96,110],[78,78,90],[112,110,124]],
  6:[[225,228,236],[205,210,222],[240,242,248]],7:[[255,82,82],[255,193,7],[76,217,100],[64,156,255],[186,104,255],[255,120,200],[255,255,255]],
  8:[[150,190,90],[130,170,70]],9:[[46,140,60],[38,120,50],[56,160,70]],10:PETALS,11:[[90,200,90],[70,180,80]],12:[[255,220,70],[255,200,40]]};
// cells that never move on their own: the name, rock, and grown plants
const STATIC=new Uint8Array(16); for(const t of [2,5,9,10,11,12])STATIC[t]=1;
let theme='amber';
function setFavicon(c,bg){
  let l=document.querySelector('link[rel="icon"]');
  if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l);}
  l.href='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${bg}"/><path d="M7 10l7 6-7 6" fill="none" stroke="${c}" stroke-width="3.2"/><rect x="16" y="20" width="9" height="3.2" fill="${c}"/></svg>`);
}
function applyTheme(name,save=true){
  const g=hex(THEMES[name]), bg=mix(g,BLACK,.92), s=document.documentElement.style, set=(n,c)=>s.setProperty(n,rgb(c));
  s.setProperty('--bg',rgb(bg)); s.setProperty('--bg2',rgb(mix(bg,BLACK,.4)));
  s.setProperty('--glow',rgb(g)); s.setProperty('--dim',rgb(mix(g,bg,.4))); s.setProperty('--hi',rgb(mix(g,WHITE,.6)));
  set('--pd-bg',mix(g,BLACK,.86)); set('--pd-sf',mix(g,BLACK,.78)); set('--pd-fg',mix(g,WHITE,.86)); set('--pd-mu',mix(mix(g,WHITE,.5),BLACK,.3)); set('--pd-ac',g); set('--pd-ln',mix(g,BLACK,.68));
  set('--pl-bg',mix(g,WHITE,.94)); set('--pl-sf',mix(g,WHITE,.985)); set('--pl-fg',mix(g,BLACK,.86)); set('--pl-mu',mix(g,BLACK,.62)); set('--pl-ac',mix(g,BLACK,.45)); set('--pl-ln',mix(g,WHITE,.72));
  setFavicon(THEMES[name],rgb(bg));
  PAL[1]=[g,mix(g,bg,.18),mix(g,bg,.32),mix(g,WHITE,.15),mix(g,WHITE,.3)];
  PAL[2]=[mix(g,WHITE,.6),mix(g,WHITE,.75),mix(g,WHITE,.5)];
  theme=name; if(save){try{localStorage.setItem('odin-theme',name)}catch(e){}}
}
try{const t=localStorage.getItem('odin-theme'); applyTheme(THEMES[t]?t:'amber',false);}catch(e){applyTheme('amber',false);}

/* ---------- terminal ---------- */
const out=$('out'), scr=$('scr'), cmd=$('cmd'), promptEl=$('prompt');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function print(html,cls=''){const d=document.createElement('div');d.className='ln '+cls;d.innerHTML=html;out.appendChild(d);scr.scrollTop=scr.scrollHeight;return d;}
// stay pinned to the newest line, including when the terminal is resized by a panel opening or closing
let stick=true;
scr.addEventListener('scroll',()=>{stick=scr.scrollHeight-scr.scrollTop-scr.clientHeight<40;});
const pin=new ResizeObserver(()=>{if(stick)scr.scrollTop=scr.scrollHeight;});
pin.observe(scr); pin.observe(out);
const L=(c,label)=>`<span class="lnk" data-cmd="${c}">${label||c}</span>`;
const sandboxHelp=()=>print(`<span class="dim">in the sandbox: brush &lt;sand|water|lava|rock|plant|eraser&gt;, ${L('rain')}, gravity &lt;on|off|flip&gt;, ${L('quake')}, ${L('crumble')}, ${L('sweep')}, ${L('reset')}, ${L('exit')}
right-click and drag to erase. pick a brush from the buttons below.</span>`);
const pad=(s,n)=>s+' '.repeat(Math.max(1,n-s.length));
function find(a){if(!a)return null;a=a.toLowerCase();
  return P.find(p=>p.id===a||p.name.toLowerCase()===a)||(()=>{const m=P.filter(p=>p.id.startsWith(a));return m.length===1?m[0]:null})();}
const sandboxOpen=()=>view()==='sandbox';
async function ensureSandbox(){if(!sandboxOpen()){print('opening the sandbox...','dim');openSandbox();await sleep(400);}}
let busy=false, brush=1;
const MAT={sand:1,water:3,lava:4,rock:5,plant:8,erase:0,eraser:0};
const C={
  help(){print(`<span class="hi">available commands</span>
  <span class="hi">✦ ${L('run sandbox')}</span>    open the sandbox
  ${L('ls')}${' '.repeat(15)}list projects
  info &lt;project&gt;   read about a project
  open &lt;project&gt;   jump straight to it
  theme &lt;color&gt;    change colors (${L('themes','see all')})
  ${L('about')}            who am I
  ${L('resume')}           my resume
  ${L('contact')}          how to reach me
  ${L('clear')}            clear the screen
  ${L('reset')}            clear, or reset the sandbox
<span class="dim">in the sandbox: brush &lt;sand|water|lava|rock|plant|eraser&gt;, ${L('rain')}, gravity &lt;on|off|flip&gt;, ${L('quake')}, ${L('crumble')}, ${L('sweep')}, ${L('exit')}
right-click and drag to erase.
tip: click any underlined word. tab completes, ↑ ↓ for history.
some commands are hidden.</span>`);},
  ls(){print(P.map(p=>`<span class="hi">${L('info '+p.id,p.id)}</span>${' '.repeat(16-p.id.length)}${p.year}  ${p.stack}`).join('\n')+`\n<span class="dim">click a name, or type info &lt;project&gt;</span>`);},
  info(a){const p=find(a);
    if(!p)return print(a?`info: ${esc(a)}: no such project. try ${L('ls')}`:`usage: info &lt;project&gt;  (try ${L('info pixel-physics')})`,'err');
    print(`<span class="hi"># ${p.name}</span>  <span class="dim">${p.year} · ${p.stack}</span>
${p.pitch}
<button class="tbtn go" data-open="${p.id}">[ take me there › ]</button>`);},
  open(a){const p=find(a);if(!p)return print(a?`open: ${esc(a)}: not found`:'usage: open &lt;project&gt;','err');openPage(p.id);},
  async run(a){
    if(a==='sandbox'||a==='lobby'){if(sandboxOpen())return print('the sandbox is already open, look left ←','dim');print('✦ unfolding the sandbox...','hi');openSandbox();sandboxHelp();return;}
    const p=find(a);if(!p)return print(a?`run: ${esc(a)}: not found. try ${L('run sandbox')}`:`usage: run &lt;project&gt; or ${L('run sandbox')}`,'err');
    const bar=print('');for(let i=0;i<=20;i++){bar.textContent='['+'#'.repeat(i)+'.'.repeat(20-i)+'] '+i*5+'%';await sleep(30);}
    openPage(p.id);},
  theme(a){
    if(!a)return print(`usage: theme &lt;color&gt;   e.g. ${L('theme pink')}, ${L('theme scarlet')}, ${L('theme random')}  (${L('themes','see all')})`,'dim');
    if(a==='random'){const k=Object.keys(THEMES).filter(k=>k!==theme);a=k[(Math.random()*k.length)|0];}
    if(!THEMES[a])return print(`theme: no color called "${esc(a)}". type ${L('themes')} to see them all`,'err');
    applyTheme(a);print(`theme set to ${a}`,'dim');},
  themes(){print(`<span class="hi">${Object.keys(THEMES).length} colors</span> (click one)\n`+Object.keys(THEMES).map(k=>`<span class="lnk" style="color:${THEMES[k]}" data-cmd="theme ${k}">${k}</span>`).join('  ')+`\n<span class="dim">or ${L('theme random')}</span>`);},
  about(){print(`<span class="hi">odin</span> · student · game dev · physics nerd
I build games and simulations, mostly from scratch,
because I want to know how every pixel moves.
<span class="dim">(sample bio, swap in your own)</span>`);},
  contact(){print(`email   you@example.com\ngithub  github.com/your-handle\n<span class="dim">(placeholders)</span>`);},
  clear(){out.innerHTML='';},
  async brush(a){await ensureSandbox();if(!(a in MAT))return print('usage: brush &lt;sand|water|lava|rock|plant|eraser&gt;','err');brush=MAT[a];setChips();
    print(brush===0?'brush: eraser. hold the mouse in the sandbox to erase'
      :brush===8?'brush: plant. drop seeds on the ground and watch them grow (water helps)'
      :`brush: ${a}. hold the mouse in the sandbox to pour (right-click erases)`,'dim');},
  async rain(a){await ensureSandbox();const m=a&&a in MAT&&MAT[a]?MAT[a]:(brush||1);rainType=m;rainUntil=performance.now()+4500;print(`it's raining ${Object.keys(MAT).find(k=>MAT[k]===m)}`,'dim');},
  async gravity(a){await ensureSandbox();
    if(a==='off'){setGrav(0);print('gravity off. everything floats','dim');}
    else if(a==='flip'){setGrav(grav===-1?1:-1);print(grav<0?'gravity flipped. look up':'gravity back to normal','dim');}
    else if(a==='on'){setGrav(1);print('gravity on','dim');}
    else print('usage: gravity &lt;on|off|flip&gt;','err');},
  async quake(){await ensureSandbox();quake();print('the ground shakes','dim');},
  async crumble(){await ensureSandbox();crumbleAll();print('the name crumbles','dim');},
  async sweep(){await ensureSandbox();sweep();print('sand swept away','dim');},
  reset(){if(!sandboxOpen())return C.clear();if(wave)return;startTsunami();print('🌊 tsunami incoming...','hi');},
  resume(){if(view()==='resume')return print('the resume is already open, look left ←','dim');
    print('unfolding resume.txt ...','hi');openView('resume');
    print(`<span class="dim">scroll it on the left. ${L('exit')} closes it, ${L('run sandbox')} swaps to the sandbox.</span>`);},
  exit(){const v=view();if(!v)return print(`nothing to close. try ${L('run sandbox')} or ${L('resume')}`,'dim');
    closeView();print(v==='resume'?'resume folded away':'sandbox folded away','dim');},
  close(){return C.exit();},
  cat(a){return C.info(a);},
  whoami(){print('admissions-reader (probably)');},
  hello(){print('hi! type '+L('help')+' to look around');}, hi(){C.hello();},
  date(){print(new Date().toString());},
  echo(a,raw){print(esc(raw||''));},
  history(){print(hist.map((h,i)=>`${String(i+1).padStart(3)}  ${esc(h)}`).join('\n')||'(empty)','dim');},
  secret(){print('try: <span class="hi">sudo admit-me</span>');},
  async sudo(a){if(a==='admit-me'||a==='hire-me'){print('[sudo] password for admissions: ********','dim');await sleep(700);
    print('<span class="hi">ACCESS GRANTED.</span> welcome to the class of 2031. ✦');if(sandboxOpen()){rainType=7;rainUntil=performance.now()+3500;}}
    else if(a.startsWith('rm'))print('sudo: absolutely not','err'); else print('sudo: nice try','err');},
  async party(){const keep=theme,k=Object.keys(THEMES);print('✦ party mode ✦','hi');if(sandboxOpen()){rainType=7;rainUntil=performance.now()+3000;quake();}
    for(let i=0;i<18;i++){applyTheme(k[(Math.random()*k.length)|0],false);await sleep(150);}applyTheme(keep);print('ok, back to '+keep,'dim');},
  matrix(){applyTheme('matrix');print('wake up, odin...','hi');}
};
const hist=[];let hi=0;
function lev(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];}
async function exec(line){
  if(busy)return;
  print(`<span class="dim">odin@portfolio:~$</span> <span class="hi">${esc(line)}</span>`);
  const raw=line.trim(); if(!raw)return;
  const [c,...rest]=raw.split(/\s+/); const a=rest.join(' ').toLowerCase();
  hist.push(raw);hi=hist.length;
  const name=c.toLowerCase(), fn=C[name];
  if(!fn){const best=Object.keys(C).map(k=>[k,lev(name,k)]).sort((x,y)=>x[1]-y[1])[0];
    return print(`${esc(c)}: command not found.`+(best&&best[1]<=2?` did you mean ${L(best[0])}?`:` type ${L('help')}`),'err');}
  busy=true;promptEl.hidden=true;
  try{await fn(a,raw.slice(c.length).trim());}finally{busy=false;promptEl.hidden=false;}
  if(!matchMedia('(pointer:coarse)').matches)cmd.focus({preventScroll:true});
  scr.scrollTop=scr.scrollHeight;
}
cmd.addEventListener('keydown',e=>{
  if(e.key==='Enter'){const v=cmd.value;cmd.value='';exec(v);}
  else if(e.key==='ArrowUp'){if(hi>0)cmd.value=hist[--hi];e.preventDefault();}
  else if(e.key==='ArrowDown'){hi=Math.min(hist.length,hi+1);cmd.value=hist[hi]||'';e.preventDefault();}
  else if(e.key==='Tab'){e.preventDefault();const parts=cmd.value.split(' ');const last=parts.pop().toLowerCase();
    const first=(parts[0]||'').toLowerCase();
    const pool=!parts.length?Object.keys(C):first==='theme'?Object.keys(THEMES):first==='brush'||first==='rain'?Object.keys(MAT):first==='gravity'?['on','off','flip']:first==='run'?['sandbox',...P.map(p=>p.id)]:P.map(p=>p.id);
    const m=pool.filter(x=>x.startsWith(last));
    if(m.length===1){parts.push(m[0]);cmd.value=parts.join(' ')+(parts.length===1?' ':'');}else if(m.length>1)print(m.join('  '),'dim');}
});
scr.addEventListener('click',e=>{if(!e.target.closest('[data-cmd],[data-open]')&&!getSelection().toString())cmd.focus({preventScroll:true});});
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-cmd]'); if(c){exec(c.dataset.cmd);return;}
  const o=e.target.closest('[data-open]'); if(o)openPage(o.dataset.open);
});
function setChips(){
  const v=view();
  const B=(cmd,label,fx,extra='')=>`<button class="tbtn${fx?' fx '+fx:''}${extra}" data-cmd="${cmd}"${fx?` data-fx="${fx}"`:''}>${fx?`<span class="fxl">${label}</span>`:label}</button>`;
  let html;
  if(v==='sandbox'){
    const br=m=>B('brush '+m,m,m,MAT[m]===brush?' on':'');
    html=`<span class="clabel">brushes</span>${br('sand')}${br('water')}${br('lava')}${br('rock')}${br('plant')}`
      +`<span class="clabel">actions</span>${B('rain','rain')}${B('gravity flip','flip gravity')}${B('quake','quake')}${B('reset','⟲ reset')}${B('exit','exit')}`;
  }else{
    const rest=v==='resume'?['ls','help','exit']:['help','ls','resume','themes','secret'];
    html=B('run sandbox','✦ run sandbox','sandbox',' big')+rest.map(c=>B(c,c)).join('');
  }
  $('chips').innerHTML=html; mountFX();
}

/* ---------- button effects: each material button holds a tiny live simulation ---------- */
// One canvas pixel per 3 screen pixels, drawn behind the label at ~30 fps. "run sandbox" loops through
// pouring sand, sloshing water and oozing lava; brush buttons show their own material.
const FXS=3, reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FXC={water:[[52,120,230],[61,139,253],[86,160,255]],rock:[[96,96,110],[78,78,90],[112,110,124],[64,64,74]],
  soil:[[92,64,40],[110,78,48]],grass:[[60,150,60],[80,175,70]],stem:[46,140,60],leaf:[90,200,90],center:[255,220,70]};
let fxList=[];
function mountFX(){
  fxList=[...document.querySelectorAll('#chips .fx')].map(b=>{const c=document.createElement('canvas');c.className='fxc';b.prepend(c);
    return {b,c,g:c.getContext('2d'),kind:b.dataset.fx,w:0,h:0};});
}
function fxInit(f){
  f.w=Math.max(8,Math.ceil(f.b.clientWidth/FXS)); f.h=Math.max(6,Math.ceil(f.b.clientHeight/FXS));
  f.c.width=f.w; f.c.height=f.h; f.img=f.g.createImageData(f.w,f.h);
  f.grid=new Uint8Array(f.w*f.h); f.mv=new Uint8Array(f.w*f.h); f.shade=new Uint8Array(f.w*f.h).map(()=>Math.random()*255|0);
  f.t0=performance.now(); f.plants=[]; f.bubbles=[]; f.done=false;
  if(f.kind==='sand')for(let y=Math.floor(f.h*.45);y<f.h;y++)for(let x=0;x<f.w;x++)f.grid[y*f.w+x]=1;
}
// falling sand / flowing liquid on the button's own little grid; slosh tilts liquids one way, drain empties the bottom
function fxStep(f,slosh,drain){
  const w=f.w,h=f.h,gd=f.grid,mv=f.mv,sh=f.shade; mv.fill(0);
  const mov=(a,b)=>{gd[b]=gd[a];gd[a]=0;mv[b]=1;const s=sh[a];sh[a]=sh[b];sh[b]=s;};
  for(let y=h-1;y>=0;y--){const ltr=Math.random()<.5;
    for(let i=0;i<w;i++){const x=ltr?i:w-1-i,k=y*w+x,t=gd[k]; if(!t||mv[k])continue;
      if(t===4&&Math.random()<.6)continue;
      if(y===h-1){if(drain){gd[k]=0;continue;}}
      else{
        const b=k+w; if(!gd[b]){mov(k,b);continue;}
        const d=Math.random()<.5?-1:1;
        if(x+d>=0&&x+d<w&&!gd[b+d]){mov(k,b+d);continue;}
        if(x-d>=0&&x-d<w&&!gd[b-d]){mov(k,b-d);continue;}
      }
      if(t!==1){const d=slosh?(Math.random()<.75?slosh:-slosh):(Math.random()<.5?-1:1);
        if(x+d>=0&&x+d<w&&!gd[k+d])mov(k,k+d);}
    }
  }
}
function fxPaint(f,now){
  const d=f.img.data,n=f.w*f.h,tick=now/200|0;
  for(let k=0;k<n;k++){const t=f.grid[k],o=k*4,s=f.shade[k];
    const c=t===1?PAL[1][s%5]:t===3?FXC.water[(s+tick)%3]:t===4?PAL[4][(s+tick)%4]:null;
    if(c){d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}else d[o+3]=0;}
  f.g.putImageData(f.img,0,0);
}
function fpx(f,x,y,c){if(x<0||y<0||x>=f.w||y>=f.h)return;const o=(y*f.w+x)*4,d=f.img.data;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}
const FX={
  sand(f,t,now){ // a shallow pile with grains trickling in and draining out, so it shimmers
    if(Math.random()<.7)f.grid[(Math.random()*f.w)|0]=1;
    if(Math.random()<.7)f.grid[(f.h-1)*f.w+((Math.random()*f.w)|0)]=0;
    fxStep(f,0,false); fxPaint(f,now);
  },
  water(f,t){ // two overlapping sine waves make the surface ripple
    f.img.data.fill(0);
    for(let x=0;x<f.w;x++){
      const top=f.h*.36+Math.sin(x*.45+t*3.2)*1.1+Math.sin(x*.17-t*1.9)*.9;
      for(let y=Math.max(0,Math.floor(top));y<f.h;y++)
        fpx(f,x,y,y<top+1.2?[170,215,255]:FXC.water[((x>>1)+y+Math.floor(t*5))%3]);
    }
    if(Math.random()<.3)fpx(f,(Math.random()*f.w)|0,Math.floor(f.h*.36),[255,255,255]);
    f.g.putImageData(f.img,0,0);
  },
  lava(f,t){ // slow churning surface, with bubbles that rise and pop
    f.img.data.fill(0);
    for(let x=0;x<f.w;x++){
      const top=f.h*.3+Math.sin(x*.3+t*1.1)*.9;
      for(let y=Math.max(0,Math.floor(top));y<f.h;y++)
        fpx(f,x,y,y<top+1?[255,200,90]:PAL[4][(f.shade[y*f.w+x]+Math.floor(t*2)+((x+y*3)>>2))%4]);
    }
    if(Math.random()<.06)f.bubbles.push({x:(Math.random()*f.w)|0,y:f.h-1,pop:0});
    for(const b of f.bubbles){
      if(b.pop){fpx(f,b.x,b.y-1,[255,240,160]);fpx(f,b.x-1,b.y,[255,220,120]);fpx(f,b.x+1,b.y,[255,220,120]);b.pop++;continue;}
      b.y-=.25; fpx(f,b.x,Math.round(b.y),[255,235,140]);
      if(b.y<=f.h*.3+1)b.pop=1;
    }
    f.bubbles=f.bubbles.filter(b=>b.pop<5);
    f.g.putImageData(f.img,0,0);
  },
  rock(f){ // drawn once: speckled stone with a few cracks
    if(f.done)return;
    for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){const s=f.shade[y*f.w+x];
      fpx(f,x,y,(x*3+y*5+(s>>5))%17===0?[52,52,60]:FXC.rock[s%4]);}
    f.g.putImageData(f.img,0,0); f.done=true;
  },
  plant(f,t,now){ // flowers sprout, grow and bloom, then the bed clears and they grow again
    f.img.data.fill(0);
    const ground=f.h-3;
    if(!f.plants.length){const n=Math.max(2,Math.floor(f.w/7));
      for(let i=0;i<n;i++)f.plants.push({x:Math.floor((i+.5)*f.w/n+(Math.random()*3-1)),hh:0,max:3+Math.random()*(ground-5),
        delay:Math.random()*1.5,c:PETALS[(Math.random()*PETALS.length)|0],leaf:2+(Math.random()*3|0)});
      f.bloomAt=0;}
    for(let x=0;x<f.w;x++){fpx(f,x,ground,FXC.grass[(x+f.shade[x])%2]);for(let y=ground+1;y<f.h;y++)fpx(f,x,y,FXC.soil[(f.shade[y*f.w+x])%2]);}
    let all=true;
    for(const p of f.plants){
      if(t>p.delay&&p.hh<p.max)p.hh=Math.min(p.max,p.hh+.12);
      for(let i=1;i<=Math.floor(p.hh);i++){fpx(f,p.x,ground-i,FXC.stem);if(i===p.leaf)fpx(f,p.x+1,ground-i,FXC.leaf);}
      if(p.hh>=p.max){const cy=ground-Math.floor(p.hh)-1;
        for(const [dx,dy] of [[1,0],[-1,0],[0,-1],[0,1]])fpx(f,p.x+dx,cy+dy,p.c);fpx(f,p.x,cy,FXC.center);}
      else all=false;
    }
    if(all){f.bloomAt=f.bloomAt||t; if(t-f.bloomAt>2.5){f.plants=[];f.t0=now;}}
    f.g.putImageData(f.img,0,0);
  },
  sandbox(f,t,now){ // pour sand, then water (sloshing), then lava, draining between each
    const phase=t%10.8, m=[1,3,4][Math.floor(phase/3.6)], p=phase%3.6;
    if(p<2.2){const x=Math.round(f.w/2+Math.sin(t*2.3)*f.w*.32), n=Math.ceil(f.w*f.h*.55/66/(m===4?1.6:1)); // ~half full by the end of the pour
      for(let i=0;i<n;i++){const xx=x+((Math.random()*7)|0)-3,k=xx+(i&1)*f.w;if(xx>=0&&xx<f.w&&!f.grid[k])f.grid[k]=m;}}
    fxStep(f,m===3&&p<2.8?(Math.sin(t*5)>0?1:-1):0,p>2.8);
    fxPaint(f,now);
  }
};
let fxLast=0;
function fxLoop(now){
  if(now-fxLast>33&&document.visibilityState==='visible'){fxLast=now;
    for(const f of fxList){
      if(!f.b.isConnected)continue;
      if(f.w!==Math.max(8,Math.ceil(f.b.clientWidth/FXS))||!f.img)fxInit(f);
      if(reduceMotion&&f.drawn)continue;
      FX[f.kind](f,(now-f.t0)/1000,now); f.drawn=true;
    }
  }
  requestAnimationFrame(fxLoop);
}
requestAnimationFrame(fxLoop);

/* ---------- links: every view has its own address ---------- */
// /projects/<id>/, /resume/, /sandbox/ and /simple/ each open straight to that view, and Back/Forward work.
// BASE is wherever the site lives ("/" on odinsimonson.com, "/portfolio/" on github.io before the domain is connected).
const BASE=(()=>{const s=document.currentScript;return s&&s.src?new URL('..',s.src).pathname:'/';})();
const TITLES={'':'Odin Simonson · Portfolio',sandbox:'Sandbox · Odin Simonson',resume:'Resume · Odin Simonson',simple:'Odin Simonson · Projects'};
let routing=false; // true while applying a URL, so applying it doesn't push a new history entry
function currentPath(){
  if(!$('page').hidden&&pageIdx>=0)return 'projects/'+P[pageIdx].id;
  if(!$('plain').hidden)return 'simple';
  return view()||'';
}
function syncURL(){
  const p=currentPath(), url=BASE+(p?p+'/':'');
  document.title=p.startsWith('projects/')?`${P[pageIdx].name} · Odin Simonson`:TITLES[p]||TITLES[''];
  if(routing||location.pathname===url)return;
  try{history.pushState(null,'',url);}catch(e){}
}
function routeFromURL(){
  const path=location.pathname, rel=path.startsWith(BASE)?path.slice(BASE.length):path.replace(/^\//,'');
  return decodeURIComponent(rel).replace(/index\.html$/,'').replace(/\/+$/,'');
}
function applyRoute(){
  const r=routeFromURL(); routing=true;
  try{
    $('page').hidden=true; pageIdx=-1; $('plain').hidden=true;
    if(r==='sandbox'||r==='resume'){if(view()!==r)openView(r);} else if(view())closeView();
    if(r.startsWith('projects/'))openPage(r.slice(9));
    else if(r==='simple')$('plain').hidden=false;
  }finally{routing=false;}
  syncURL();
  return r;
}
addEventListener('popstate',applyRoute);

/* ---------- project page + skip the fun ---------- */
let pageIdx=-1;
function openPage(id){
  const i=P.findIndex(p=>p.id===id); if(i<0)return; pageIdx=i; const p=P[i];
  const prev=P[(i+P.length-1)%P.length], next=P[(i+1)%P.length];
  $('ppath').textContent=`odin@portfolio: ~/projects/${p.id}`;
  $('pbody').innerHTML=`<div class="dim">${p.year} · ${p.stack}</div><h1>${p.name}</h1>
  <div class="clip">[ gameplay clip goes here ]</div>
  <p style="margin:0;max-width:62ch">${p.pitch}</p>
  <div class="secs"><div><h2>## what I built</h2><p>${p.pitch.split('. ')[0]}.</p></div><div><h2>## hardest part</h2><p>${p.hard}</p></div><div><h2>## what I learned</h2><p>${p.learned}</p></div></div>
  <div class="pnav"><button class="tbtn" data-open="${prev.id}">‹ ${prev.id}</button><button class="tbtn" data-open="${next.id}">${next.id} ›</button></div>`;
  $('page').hidden=false; $('pback').focus(); syncURL();
}
function closePage(){$('page').hidden=true;pageIdx=-1;syncURL();}
$('pback').onclick=closePage;
$('plist').innerHTML=P.map(p=>`<article><h2>${p.name}</h2><div class="meta">${p.year} · ${p.stack}</div><p>${p.pitch}</p><p><b>Hardest part:</b> ${p.hard}</p><p><b>What I learned:</b> ${p.learned}</p></article>`).join('');
function closePlain(){$('plain').hidden=true;syncURL();}
$('skip').onclick=()=>{$('plain').hidden=false;$('fun').focus();syncURL();};
$('fun').onclick=closePlain;
const plainEl=$('plain');
try{if(localStorage.getItem('odin-plain')==='light')plainEl.classList.add('light');}catch(e){}
function syncPmode(){$('pmode').textContent=plainEl.classList.contains('light')?'☾ Dark mode':'☀ Light mode';}
$('pmode').onclick=()=>{plainEl.classList.toggle('light');syncPmode();
  try{localStorage.setItem('odin-plain',plainEl.classList.contains('light')?'light':'dark');}catch(e){}};
syncPmode();
addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(!$('page').hidden)closePage();else if(!$('plain').hidden)closePlain();}
  if(!$('page').hidden&&(e.key==='ArrowRight'||e.key==='ArrowLeft')&&document.activeElement!==cmd){
    openPage(P[(pageIdx+(e.key==='ArrowRight'?1:P.length-1))%P.length].id);}
});

/* ---------- left panel: sandbox / resume ---------- */
const world=$('world'), cv=$('sand'), ctx=cv.getContext('2d');
const CELL=4; let W=0,H=0,grid,col,mask,moved,VX,VY,life,img,grav=1,rainUntil=0,rainType=1,worldReady=false;
const gcv=$('glow'), gctx=gcv.getContext('2d'); let gimg, frame=0, wave=null;
const view=()=>document.body.classList.contains('open')?document.body.dataset.view:null;
let hideT;
const settle=()=>setTimeout(()=>{if(stick)scr.scrollTop=scr.scrollHeight;},760); // after the fold animation
function openView(v){clearTimeout(hideT);document.body.classList.add('open');document.body.dataset.view=v;$('resume').hidden=v!=='resume';setChips();settle();syncURL();}
function closeView(){document.body.classList.remove('open');hideT=setTimeout(()=>{if(!view())$('resume').hidden=true;},750);setChips();settle();syncURL();}
function openSandbox(){openView('sandbox');}
$('wclose').onclick=()=>exec('exit');
$('rclose').onclick=()=>exec('exit');
$('rproj').innerHTML=P.map(p=>`<div><div class="rrow"><b>${p.name}</b><span class="dim">${p.year} · ${p.stack}</span></div><div>${p.pitch.split('. ')[0]}.</div></div>`).join('');
function setGrav(v){
  const was=grav; grav=v; world.classList.toggle('flipped',v<0);
  if(v===0&&was!==0&&worldReady) // particles keep a bit of their fall and start drifting, like the crates
    for(let k=0;k<W*H;k++){const t=grid[k];if(!t||STATIC[t])continue;
      VX[k]=(Math.random()-.5)*.5; VY[k]=was*(.1+Math.random()*.3)+(Math.random()-.5)*.3;}
}
function initWorld(restamp){
  const r=world.getBoundingClientRect(); if(r.width<60||r.height<60)return;
  W=Math.ceil(r.width/CELL); H=Math.ceil(r.height/CELL);
  cv.width=W; cv.height=H;
  grid=new Uint8Array(W*H); col=new Uint8Array(W*H); mask=new Uint8Array(W*H); moved=new Uint8Array(W*H);
  VX=new Float32Array(W*H); VY=new Float32Array(W*H); life=new Uint8Array(W*H);
  img=ctx.createImageData(W,H); gcv.width=W; gcv.height=H; gimg=gctx.createImageData(W,H); stamp();
  if(!worldReady||restamp)dropCrates(); worldReady=true;
}
// grid indices covered by the big "ODIN" letters
function nameCells(){
  const o=document.createElement('canvas');o.width=W;o.height=H;const c=o.getContext('2d');
  let size=Math.min(H*.3,W*.3);c.font=`700 ${size}px Silkscreen, monospace`;
  const tw=c.measureText('ODIN').width; if(tw>W*.84){size*=W*.84/tw;c.font=`700 ${size}px Silkscreen, monospace`;}
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText('ODIN',W/2,H*.36);
  const d=c.getImageData(0,0,W,H).data, cells=[];
  for(let k=0;k<W*H;k++)if(d[k*4+3]>120)cells.push(k);
  return cells;
}
function stamp(){for(const k of nameCells()){grid[k]=2;col[k]=(Math.random()*3)|0;}}
let rt; new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>{if(sandboxOpen()){const old=worldReady;initWorld(false);if(old){sizeCrates();clampCrates();}}},160);}).observe(world);
// crates
const crates=P.map(p=>{
  const el=document.createElement('div');el.className='crate';
  el.innerHTML=`<div class="ci"><span class="cm">click me!</span><div class="bar">${p.id}</div><div class="bd"><b>${p.name}</b><span>${p.year} · ${p.stack.split(',')[0]}</span></div></div>`;
  el.title=`Open ${p.name}`;
  $('crates').appendChild(el);
  const c={p,el,x:0,y:0,vx:0,vy:0,w:0,h:0,rot:0,drag:false};
  el.addEventListener('pointerdown',e=>{e.stopPropagation();el.setPointerCapture(e.pointerId);const r=world.getBoundingClientRect();
    c.drag=true;c.ox=e.clientX-r.left-c.x;c.oy=e.clientY-r.top-c.y;c.sx=e.clientX;c.sy=e.clientY;c.moved=false;});
  el.addEventListener('pointermove',e=>{if(!c.drag)return;const r=world.getBoundingClientRect();
    const nx=e.clientX-r.left-c.ox,ny=e.clientY-r.top-c.oy;c.vx=nx-c.x;c.vy=ny-c.y;c.x=nx;c.y=ny;
    if(Math.hypot(e.clientX-c.sx,e.clientY-c.sy)>6)c.moved=true;});
  const up=()=>{if(!c.drag)return;c.drag=false;if(!c.moved){c.vx=c.vy=0;openPage(p.id);}};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  return c;
});
// size crates so all six fit side by side when there's room
function sizeCrates(){
  const fw=world.clientWidth, n=crates.length;
  const w=Math.max(96,Math.min(170,Math.floor((fw-16)/n)-10)), h=Math.max(62,Math.round(w*.55));
  crates.forEach(c=>{c.w=w;c.h=h;c.el.style.width=w+'px';c.el.style.height=h+'px';c.el.classList.toggle('sm',w<140);});
}
function dropCrates(){
  sizeCrates(); const fw=world.clientWidth, n=crates.length;
  crates.forEach((c,i)=>{c.x=Math.min(fw-c.w,Math.max(0,(i+.5)/n*fw-c.w/2));c.y=0;c.vx=(Math.random()-.5)*2;c.vy=i*.8;});
}
function clampCrates(){const fw=world.clientWidth,fh=world.clientHeight;crates.forEach(c=>{c.x=Math.min(Math.max(0,c.x),fw-c.w);c.y=Math.min(Math.max(0,c.y),fh-c.h);});}
function quake(){world.classList.remove('shake');void world.offsetWidth;world.classList.add('shake');
  crates.forEach(c=>{c.vx+=(Math.random()-.5)*22;c.vy-=(grav||1)*(6+Math.random()*12);});
  if(!grav&&worldReady)for(let k=0;k<W*H;k++)if(grid[k]){VX[k]+=(Math.random()-.5)*.9;VY[k]+=(Math.random()-.5)*.9;}}
// Crates float: find the liquid surface beside (or just under) the crate and push up in proportion to how deep
// it sits, settling around 45% submerged. Lava is thicker, so crates in it move slower and bob more lazily.
const liquidAt=j=>{const t=grid[j];return t===3||t===4?t:0;};
// Works in either gravity direction: g is +1 (down) or -1 (flipped), and "below" means along g.
function buoy(c,k,t){
  if(!worldReady||!grav)return;
  const g=grav, x0=Math.max(0,Math.floor(c.x/CELL)), x1=Math.min(W-1,Math.ceil((c.x+c.w)/CELL)-1);
  const yb=Math.max(0,Math.min(H-1,Math.floor((g>0?c.y+c.h:c.y)/CELL))); // row at the crate's leading edge
  const inY=y=>y>=0&&y<H;
  let surf=-1,type=0;
  for(const sx of [x0-1,x0-2,x1+1,x1+2]){
    if(!inX(sx)||!liquidAt(yb*W+sx))continue;
    let y=yb; while(inY(y-g)&&liquidAt((y-g)*W+sx))y-=g;
    if(surf<0||y*g<surf*g){surf=y;type=liquidAt(y*W+sx);}
  }
  if(surf<0){ // nothing beside it, so check whether it's resting on a pool
    const cx=Math.min(W-1,Math.max(0,((c.x+c.w/2)/CELL)|0));
    for(let i=1,y=yb+g;i<4&&inY(y);i++,y+=g){const l=liquidAt(y*W+cx);if(l){surf=y;type=l;break;}if(grid[y*W+cx])break;}
  }
  if(surf<0)return;
  const depth=Math.min(c.h,g>0?c.y+c.h-surf*CELL:(surf+1)*CELL-c.y); if(depth<=0)return;
  const lava=type===4, s=lava?.35:1;
  c.vy-=g*.6*(1-s)*k;                                                    // thick liquid: everything slows down
  c.vy-=g*1.33*s*(depth/c.h)*k;                                          // buoyancy
  c.vy+=Math.sin(t/(lava?950:420)+c.p.id.length)*(lava?.025:.06)*k;     // gentle bob
  c.vy*=Math.pow(lava?.86:.93,k); c.vx*=Math.pow(lava?.9:.97,k);
}
// crates never leave the box: all four edges are walls
function walls(c,fw,fh){
  if(c.y>fh-c.h){c.y=fh-c.h;c.vy=-Math.abs(c.vy)*.3;if(grav>0){c.vx*=.85;if(Math.abs(c.vy)<1.2)c.vy=0;}}
  if(c.y<0){c.y=0;c.vy=Math.abs(c.vy)*.3;if(grav<0){c.vx*=.85;if(Math.abs(c.vy)<1.2)c.vy=0;}}
  if(c.x<0){c.x=0;c.vx=Math.abs(c.vx)*.5;} if(c.x>fw-c.w){c.x=fw-c.w;c.vx=-Math.abs(c.vx)*.5;}
}
function physics(k){
  const fw=world.clientWidth, fh=world.clientHeight, now=performance.now();
  for(const c of crates){
    if(!c.drag){
      if(grav)c.vy+=.6*grav*k; else {c.vx*=.995;c.vy=c.vy*.995+(Math.random()-.5)*.08;}
      buoy(c,k,now);
      c.x+=c.vx*k;c.y+=c.vy*k;if(grav)c.vx*=Math.pow(.99,k);
    }
    walls(c,fw,fh);
  }
  for(let it=0;it<4;it++)for(let i=0;i<crates.length;i++)for(let j=i+1;j<crates.length;j++){
    const a=crates[i],b=crates[j];
    const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    if(ox<=0||oy<=0)continue;
    if(ox<oy){const s=a.x<b.x?-1:1;if(!a.drag)a.x+=s*ox/(b.drag?1:2);if(!b.drag)b.x-=s*ox/(a.drag?1:2);const t=a.vx;a.vx=b.vx*.6;b.vx=t*.6;}
    else{const up=a.y<b.y?a:b, dn=up===a?b:a;
      if(grav>=0){if(up.drag)dn.y+=oy;else{up.y-=oy;if(up.vy>0)up.vy=0;}}
      else{if(dn.drag)up.y-=oy;else{dn.y+=oy;if(dn.vy<0)dn.vy=0;}}
    }
  }
  for(const c of crates){
    walls(c,fw,fh);
    c.rot+=(Math.max(-12,Math.min(12,c.vx*1.5))-c.rot)*.2;
    c.el.style.transform=`translate(${c.x}px,${c.y}px) rotate(${c.rot}deg)`;
  }
}
// Crates displace what they overlap like a body sinking into a pool: each grain goes to the nearest free cell
// beside the crate on its own row, then the row above, and so on, so levels rise evenly instead of spiking.
function rasterCrates(){
  mask.fill(0);
  const R=crates.map(c=>({cr:c,x0:Math.max(0,Math.floor(c.x/CELL)),x1:Math.min(W,Math.ceil((c.x+c.w)/CELL)),
    y0:Math.max(0,Math.floor(c.y/CELL)),y1:Math.min(H,Math.ceil((c.y+c.h)/CELL))}));
  for(const r of R)for(let y=r.y0;y<r.y1;y++)if(r.x1>r.x0)mask.fill(1,y*W+r.x0,y*W+r.x1);
  const dir=grav<0?1:-1;
  for(const r of R)for(let y=r.y0;y<r.y1;y++)for(let x=r.x0;x<r.x1;x++){
    const k=y*W+x,t=grid[k]; if(!t||STATIC[t])continue;
    const c=col[k]; grid[k]=0;
    if(grav)shove(t,c,x,y,r,dir); else pushOut(t,c,x,y,r);
  }
}
// Gravity off: a grain leaves through the crate's nearest edge. If the way is crowded, the line of particles in
// front of it shifts outward by one cell (like being pushed), and everything picks up some of the crate's speed.
function pushOut(t,c,x,y,r){
  const cand=[[x-r.x0,-1,0],[r.x1-1-x,1,0],[y-r.y0,0,-1],[r.y1-1-y,0,1]].sort((a,b)=>a[0]-b[0]);
  const vx=Math.max(-1,Math.min(1,r.cr.vx/CELL*.5)), vy=Math.max(-1,Math.min(1,r.cr.vy/CELL*.5));
  for(const [,dx,dy] of cand){
    const sx=dx<0?r.x0-1:dx>0?r.x1:x, sy=dy<0?r.y0-1:dy>0?r.y1:y;
    let n=0,ok=false;
    for(let nx=sx,ny=sy;n<40;n++,nx+=dx,ny+=dy){
      if(!inX(nx)||ny<0||ny>=H)break;
      const j=ny*W+nx,g=grid[j]; if(mask[j]||STATIC[g])break;
      if(!g){ok=true;break;}
    }
    if(!ok)continue;
    for(let m=n;m>0;m--){const to=(sy+dy*m)*W+sx+dx*m, from=(sy+dy*(m-1))*W+sx+dx*(m-1);
      grid[to]=grid[from];col[to]=col[from];VX[to]=VX[from]+dx*.2+vx*.3;VY[to]=VY[from]+dy*.2+vy*.3;}
    const j=sy*W+sx; grid[j]=t;col[j]=c;VX[j]=vx+dx*.3;VY[j]=vy+dy*.3;
    return;
  }
}
function put(j,t,c){grid[j]=t;col[j]=c;VX[j]=0;VY[j]=0;}
function shove(t,c,x,y,r,dir){
  const first=(x-r.x0)<(r.x1-1-x)?-1:1;
  for(let yy=y,n=0;yy>=0&&yy<H&&n<160;yy+=dir,n++){
    const row=yy*W;
    if(dir<0?yy<r.y0:yy>=r.y1){const j=row+x;if(!grid[j]&&!mask[j]){put(j,t,c);return;}}
    for(const s of [first,-first])
      for(let xx=s<0?r.x0-1:r.x1,m=0;xx>=0&&xx<W&&m<100;xx+=s,m++){
        const j=row+xx; if(mask[j]||STATIC[grid[j]])break;
        if(!grid[j]){put(j,t,c);return;}
      }
  }
}
const inX=x=>x>=0&&x<W;
function swap(a,b){let t=grid[b];grid[b]=grid[a];grid[a]=t;t=col[b];col[b]=col[a];col[a]=t;t=life[b];life[b]=life[a];life[a]=t;
  let v=VX[b];VX[b]=VX[a];VX[a]=v;v=VY[b];VY[b]=VY[a];VY[a]=v;moved[b]=1;}
// lava melts sand and confetti, burns plants into smoke, and flashes water (and itself) into steam
function react(x,y,k){
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inX(nx)||ny<0||ny>=H)continue;
    const j=ny*W+nx,t=grid[j];
    if(t===3){grid[j]=6;grid[k]=6;moved[j]=moved[k]=1;return true;}
    if((t===1||t===7)&&Math.random()<.35)grid[j]=0;
    if(t>=8&&t<=12&&Math.random()<.4)grid[j]=Math.random()<.5?6:0;
  }
  return false;
}
// Plants: a seed that lands on something solid becomes a stem with a set height (life). The tip grows against
// gravity, wandering a little and dropping leaves; water next to it doubles the speed. At full height, or when
// blocked, it blooms into a flower of one random color.
function sprout(k){grid[k]=9;col[k]=(Math.random()*3)|0;life[k]=10+(Math.random()*28|0);}
function grow(x,y,k){
  const up=-grav, ny=y+up, l=life[k];
  const wet=(inX(x-1)&&grid[k-1]===3)||(inX(x+1)&&grid[k+1]===3)||grid[k+W]===3||grid[k-W]===3;
  if(Math.random()>(wet?.3:.14))return;
  const r=Math.random(), nx=x+(r<.15?-1:r<.3?1:0), j=ny*W+nx;
  if(l<=1||ny<0||ny>=H||!inX(nx)||(grid[j]&&grid[j]!==3)||mask[j]){life[k]=0;bloom(x,y);return;} // stems push up through water
  grid[j]=9;col[j]=(Math.random()*3)|0;life[j]=l-1;life[k]=0;moved[j]=1;
  if(Math.random()<.22){const s=Math.random()<.5?-1:1;if(inX(x+s)&&!grid[k+s]&&!mask[k+s]){grid[k+s]=11;col[k+s]=(Math.random()*2)|0;}}
}
function bloom(x,y){
  const up=-grav, cy=y+up; if(cy<0||cy>=H)return;
  const c=(Math.random()*PETALS.length)|0, ck=cy*W+x;
  const open=j=>(!grid[j]||grid[j]===3)&&!mask[j];
  if(open(ck)){grid[ck]=12;col[ck]=(Math.random()*2)|0;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,up],[1,up],[-1,up],[1,-up],[-1,-up]]){
    const nx=x+dx, ny=cy+dy; if(!inX(nx)||ny<0||ny>=H)continue;
    const j=ny*W+nx; if(open(j)){grid[j]=10;col[j]=c;}
  }
}
function step(){
  moved.fill(0);
  if(!grav)return floatStep();
  const ys=grav>0?H-1:0, ye=grav>0?-1:H, yd=grav>0?-1:1;
  for(let y=ys;y!==ye;y+=yd){
    const ltr=Math.random()<.5,row=y*W,ny=y+grav,edge=ny<0||ny>=H,nrow=ny*W;
    for(let i=0;i<W;i++){
      const x=ltr?i:W-1-i,k=row+x,t=grid[k];
      if(!t||moved[k])continue;
      if(t===9){if(life[k])grow(x,y,k);continue;}
      if(STATIC[t])continue;
      const d=Math.random()<.5?-1:1;
      if(t===6){ // steam rises against gravity, drifts, and fades
        if(Math.random()<.012){grid[k]=0;continue;}
        const uy=y-grav, free=j=>!mask[j]&&!grid[j];
        if(uy>=0&&uy<H){const u=uy*W+x;
          if(Math.random()<.8&&free(u)){swap(k,u);continue;}
          if(inX(x+d)&&free(u+d)){swap(k,u+d);continue;}}
        else if(Math.random()<.08){grid[k]=0;continue;}
        if(inX(x+d)&&free(k+d))swap(k,k+d);
        continue;
      }
      if(t===4){if(react(x,y,k))continue; if(Math.random()<.55)continue;}
      const b=nrow+x;
      if(t===1||t===7||t===8){
        if(!edge){
          const ok=j=>!mask[j]&&(grid[j]===0||grid[j]===3||grid[j]===6);
          if(ok(b)){swap(k,b);continue;}
          if(inX(x+d)&&ok(b+d)){swap(k,b+d);continue;}
          if(inX(x-d)&&ok(b-d)){swap(k,b-d);continue;}
        }
        // a seed that has come to rest on the floor, a crate or anything solid takes root
        if(t===8&&(edge||mask[b]||(grid[b]&&grid[b]!==3&&grid[b]!==4&&grid[b]!==6)))sprout(k);
      }else{
        const ok=j=>!mask[j]&&!grid[j];
        if(!edge){
          if(ok(b)){swap(k,b);continue;}
          if(inX(x+d)&&ok(b+d)){swap(k,b+d);continue;}
          if(inX(x-d)&&ok(b-d)){swap(k,b-d);continue;}
        }
        if(inX(x+d)&&ok(k+d)){swap(k,k+d);continue;}
        if(inX(x-d)&&ok(k-d))swap(k,k-d);
      }
    }
  }
}
// gravity off: every particle carries a velocity, drifts, bounces off walls and shares momentum when it bumps another
function floatStep(){
  const ltr=Math.random()<.5, ttb=Math.random()<.5;
  for(let yi=0;yi<H;yi++){const y=ttb?yi:H-1-yi;
    for(let i=0;i<W;i++){const x=ltr?i:W-1-i,k=y*W+x,t=grid[k];
      if(!t||STATIC[t]||moved[k])continue;
      if(t===4&&react(x,y,k))continue;
      if(t===6&&Math.random()<.008){grid[k]=0;continue;}
      let vx=VX[k]*.999+(Math.random()-.5)*.03, vy=VY[k]*.999+(Math.random()-.5)*.03;
      vx=Math.max(-1,Math.min(1,vx)); vy=Math.max(-1,Math.min(1,vy)); VX[k]=vx; VY[k]=vy;
      const sx=Math.random()<Math.abs(vx)?Math.sign(vx):0, sy=Math.random()<Math.abs(vy)?Math.sign(vy):0;
      if(!sx&&!sy)continue;
      const nx=x+sx, ny=y+sy;
      if(nx<0||nx>=W){VX[k]=-vx*.6;continue;}
      if(ny<0||ny>=H){VY[k]=-vy*.6;continue;}
      const j=ny*W+nx;
      if(!grid[j]&&!mask[j]){swap(k,j);continue;}
      if(sx&&sy){const jx=y*W+nx,jy=ny*W+x;
        if(!grid[jx]&&!mask[jx]){VY[k]=-vy*.5;swap(k,jx);continue;}
        if(!grid[jy]&&!mask[jy]){VX[k]=-vx*.5;swap(k,jy);continue;}}
      const o=grid[j]; if(o&&!STATIC[o]){VX[j]=(VX[j]+vx)*.5;VY[j]=(VY[j]+vy)*.5;}
      VX[k]=-vx*.5; VY[k]=-vy*.5;
    }
  }
}
function draw(){
  const d=img.data, g=gimg.data; frame++;
  for(let k=0,n=W*H;k<n;k++){const t=grid[k],o=k*4;
    if(t===4){ // lava shimmers through its colors and is copied to the glow layer
      const c=PAL[4][(col[k]+((frame+k*7)>>4))%4];d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;
      g[o]=255;g[o+1]=110;g[o+2]=30;g[o+3]=210;continue;}
    g[o+3]=0;
    if(t){const p=PAL[t],c=p[col[k]%p.length];d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}else d[o+3]=0;}
  if(wave&&wave.stage===0)drawWave(d);
  ctx.putImageData(img,0,0); gctx.putImageData(gimg,0,0);
}
// Reset as a tsunami: a wave rolls in from the left and washes away everything it passes, flinging the
// crates; then the crates drop back in and the name re-forms grain by grain.
function startTsunami(){setGrav(1);pouring=false;wave={t0:performance.now(),stage:0,front:-1,L:Math.max(30,Math.round(W*.35)),cleared:0,hit:new Set()};}
function waveStep(now){
  if(wave.stage===0){
    const p=Math.min(1,(now-wave.t0)/1600), e=p*p*(3-2*p);
    wave.front=-wave.L+(W+2*wave.L)*e;
    const to=Math.min(W,Math.floor(wave.front));
    for(let x=wave.cleared;x<to;x++)for(let y=0;y<H;y++)grid[y*W+x]=0;
    wave.cleared=Math.max(wave.cleared,to);
    for(const c of crates)if(!wave.hit.has(c)&&(c.x+c.w/2)/CELL<wave.front){
      wave.hit.add(c);c.drag=false;c.vx+=16+Math.random()*10;c.vy-=8+Math.random()*8;}
    if(p>=1){grid.fill(0);wave.stage=1;wave.t1=now;wave.cells=nameCells().sort(()=>Math.random()-.5);wave.done=0;dropCrates();}
  }else{
    const q=Math.min(1,(now-wave.t1)/800), n=Math.floor(wave.cells.length*q);
    for(let i=wave.done;i<n;i++){const k=wave.cells[i];grid[k]=2;col[k]=(Math.random()*3)|0;}
    wave.done=n; if(q>=1)wave=null;
  }
}
function drawWave(d){
  const f=wave.front, L=wave.L, peak=H*.72, FOAM=[235,245,255];
  const put=(x,y,c)=>{if(x<0||x>=W||y<0||y>=H)return;const o=(y*W+x)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;};
  // body: steep face at the front, a tall flat-ish back, then a long tail
  for(let x=Math.max(0,Math.floor(f-L));x<=Math.min(W-1,Math.floor(f));x++){
    const u=(f-x)/L, s=u<.08?Math.pow(u/.08,.6):u<.55?1-(u-.08)*.25:.88*Math.pow(1-(u-.55)/.45,1.3);
    const h=Math.round(s*peak+Math.sin(x*.35+frame*.25)*2), top=H-h;
    for(let y=Math.max(0,top);y<H;y++)put(x,y,y<top+2||(f-x<1.5&&y<top+h*.5)?FOAM:PAL[3][(x+y+(frame>>1))%3]);
  }
  // breaking lip: the crest curls forward over the face and droops
  const crest=Math.round(H-peak), fx=Math.floor(f);
  for(let i=1;i<=Math.round(L*.18);i++){
    const y0=crest+Math.round(i*i*.12);
    for(let t=0;t<4;t++)put(fx+i,y0+t,t<2?FOAM:PAL[3][(i+t)%3]);
  }
}
function crumbleAt(cx,cy,r){for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){
  if(!inX(x)||y<0||y>=H||(x-cx)**2+(y-cy)**2>r*r)continue;const k=y*W+x;
  if(grid[k]===2){grid[k]=1;col[k]=(Math.random()*5)|0;if(!grav){VX[k]=(Math.random()-.5)*.4;VY[k]=(Math.random()-.5)*.4;}}}}
function crumbleAll(){for(let k=0;k<W*H;k++)if(grid[k]===2){grid[k]=1;col[k]=(Math.random()*5)|0;if(!grav){VX[k]=(Math.random()-.5)*.4;VY[k]=(Math.random()-.5)*.4;}}}
function sweep(){for(let k=0;k<W*H;k++)if(grid[k]!==2)grid[k]=0;}
function place(x,y,t){if(!inX(x)||y<0||y>=H)return;const k=y*W+x;
  if(t===0){if(grid[k]!==2&&grid[k]!==5)grid[k]=0;return;} // rock and the name can't be erased
  if(!grid[k]&&!mask[k]){grid[k]=t;col[k]=(Math.random()*7)|0;life[k]=0;
    if(grav){VX[k]=VY[k]=0;}else{VX[k]=(Math.random()-.5)*.6;VY[k]=(Math.random()-.5)*.6;}}}
let pouring=false,pourType=1,px=0,py=0;
world.addEventListener('contextmenu',e=>e.preventDefault());
world.addEventListener('pointerdown',e=>{if(e.target.closest('.tbtn')||wave)return;pouring=true;pourType=e.button===2?0:brush;
  const r=world.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;});
addEventListener('pointerup',()=>pouring=false);
world.addEventListener('pointermove',e=>{const r=world.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;
  if(worldReady&&!crates.some(c=>c.drag))crumbleAt((px/CELL)|0,(py/CELL)|0,5);});
let last=performance.now(), prevW=-1;
function loop(now){
  const k=Math.min(3,(now-last)/16.67);last=now;
  const ww=world.clientWidth; // wait for the fold animation to settle before the first build
  if(sandboxOpen()&&!worldReady&&ww>60&&ww===prevW)initWorld(false);
  prevW=ww;
  if(sandboxOpen()&&worldReady){
    if(wave)waveStep(now);
    physics(k); rasterCrates();
    if(pouring&&!wave&&!crates.some(c=>c.drag)){const cx=(px/CELL)|0,cy=(py/CELL)|0,sp=pourType===5?5:9,hs=sp>>1;
      for(let n=0;n<(pourType===0?40:pourType===5?25:pourType===8?2:10);n++)place(cx+((Math.random()*sp)|0)-hs,cy+((Math.random()*sp)|0)-hs,pourType);}
    if(now<rainUntil)for(let n=0;n<Math.max(4,W/12);n++){const x=(Math.random()*W)|0,y=grav<0?H-1:0;
      place(x,y,rainType);if(!grav&&grid[y*W+x])VY[y*W+x]=.7;}
    step(); draw();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- boot ---------- */
if(document.fonts&&document.fonts.load)document.fonts.load('700 40px Silkscreen').catch(()=>{});
setChips();
const startRoute=applyRoute();
const known=startRoute===''||currentPath()===startRoute;
if(!known){try{history.replaceState(null,'',BASE);}catch(e){}}
(async()=>{
  const boot=['ODIN-BIOS v2.6 · memory check 640K ok','mounting /projects ........ 6 found','loading personality.dll ... ok','mounting /sandbox ......... ready',''];
  for(const l of boot){print(l,'dim');await sleep(200);}
  print(`<span class="hi">   ___  ___ ___ _  _
  / _ \\|   \\_ _| \\| |
 | (_) | |) | || .\` |
  \\___/|___/___|_|\\_|</span>
game dev · simulations · student
type ${L('help')}, or <span class="hi">✦ ${L('run sandbox')}</span> to open the sandbox.`);
  if(!known)print(`404: ~/${esc(startRoute)}: no such page. try ${L('ls')}`,'err');
  promptEl.hidden=false; if(!matchMedia('(pointer:coarse)').matches)cmd.focus({preventScroll:true});
})();
