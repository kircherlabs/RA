/* Ra rules engine. Plain script in browsers; CommonJS for the included tests. */
(function(root) {
'use strict';
const CIV = ['Art','Religion','Writing','Agriculture','Astronomy'];
const MON = ['Sphinx','Pyramids','Obelisks','Statues','Mortuary','Shrine','Temple','Step Pyramid'];
const GROUPS = {2:[[9,6,5,2],[8,7,4,3]],3:[[13,8,5,2],[12,9,6,3],[11,10,7,4]],4:[[13,6,2],[12,7,3],[11,8,4],[10,9,5]],5:[[16,7,2],[15,8,3],[14,9,4],[13,10,5],[12,11,6]]};
const LIMIT = {2:6,3:8,4:9,5:10};
const DIS = {war:'civilization',earthquake:'monument',funeral:'pharaoh',drought:'river'};
const LABEL = {ra:'Ra',pharaoh:'Pharaoh',nile:'Nile',flood:'Flood',god:'God',gold:'Gold',war:'War',earthquake:'Earthquake',funeral:'Funeral',drought:'Drought'};
const clone = x => JSON.parse(JSON.stringify(x));
const count = (p,k) => p.tiles.filter(t=>t.kind===k).length;
const name = t => t.type || LABEL[t.kind];
function rand(s) { s.rng = (s.rng + 0x6D2B79F5) >>> 0; let t=s.rng; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }
function shuffle(s,a) { for(let i=a.length-1;i>0;i--) { const j=Math.floor(rand(s)*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function deck() {
 const a=[]; let id=0;
 const add=(kind,n,type)=>{for(let i=0;i<n;i++) a.push({id:++id,kind,...(type?{type}: {})});};
 CIV.forEach(t=>add('civilization',5,t)); MON.forEach(t=>add('monument',5,t));
 for(const [k,n] of Object.entries({ra:30,pharaoh:25,nile:25,flood:12,god:8,gold:5,war:4,earthquake:2,funeral:2,drought:2})) add(k,n);
 return a;
}
function log(s,msg) { s.log.push(msg); if(s.log.length>160) s.log.shift(); }
function highest(s) { return s.players.reduce((best,p,i)=>Math.max(...p.disks.map(d=>d.value))>Math.max(...s.players[best].disks.map(d=>d.value))?i:best,0); }
function create(players,seed=Date.now()) {
 if(players.length<2||players.length>5) throw Error('Choose 2–5 players.');
 const s={version:1,rng:seed>>>0,seed:seed>>>0,epoch:1,ra:0,limit:LIMIT[players.length],center:1,track:[],discard:[],phase:'turn',turn:0,auction:null,pending:null,reports:[],log:[],steps:0};
 const groups=shuffle(s,clone(GROUPS[players.length]));
 s.players=players.map((p,i)=>({name:String(p.name||'Player '+(i+1)).slice(0,28),control:['human','easy','normal','hard'].includes(p.control)?p.control:'human',score:10,tiles:[],disks:groups[i].map(value=>({value,used:false}))}));
 s.bag=shuffle(s,deck()); s.turn=highest(s); log(s,'Epoch 1 begins. '+s.players[s.turn].name+' has the highest Sun Disk and starts.'); return s;
}
function actor(s) { return s.phase==='auction'?s.auction.order[s.auction.pos]:s.phase==='disaster'?s.pending.player:s.turn; }
function next(s,from) {
 if(!s.players.some(p=>p.disks.some(d=>!d.used))) { endEpoch(s,'All Sun Disks have been used.'); return; }
 for(let i=1;i<=s.players.length;i++) { const j=(from+i)%s.players.length; if(s.players[j].disks.some(d=>!d.used)) {s.turn=j;s.phase='turn';return;} }
}
function beginAuction(s,reason) {
 const order=[]; for(let i=1;i<=s.players.length;i++) {const j=(s.turn+i)%s.players.length; if(s.players[j].disks.some(d=>!d.used)) order.push(j);}
 s.auction={caller:s.turn,reason,full:s.track.length===8,order,pos:0,bids:[],high:0,winner:null}; s.phase='auction';
 log(s,s.players[s.turn].name+(reason==='draw'?' drew Ra.':' invoked Ra.')+' One round of bidding begins.');
}
function mustBid(s) { const a=s.auction; return s.phase==='auction'&&a.reason==='invoke'&&!a.full&&actor(s)===a.caller&&a.high===0; }
function legal(s) {
 const p=s.players[actor(s)];
 if(s.phase==='auction') return {bids:p.disks.filter(d=>!d.used&&d.value>s.auction.high).map(d=>d.value),pass:!mustBid(s)};
 if(s.phase==='turn') return {draw:s.track.length<8&&s.bag.length>0,invoke:true,god:count(p,'god')>0&&s.track.some(t=>t.kind!=='god')};
 if(s.phase==='god') return {targets:s.track.filter(t=>t.kind!=='god').map(t=>t.id),done:s.godSpent>0,cancel:s.godSpent===0};
 if(s.phase==='disaster') return {targets:disasterTargets(s).map(t=>t.id),needed:s.pending.left};
 return {};
}
function finishAuction(s) {
 const a=s.auction; s.auction=null;
 if(a.winner===null) {if(a.reason==='invoke'&&a.full) {s.discard.push(...s.track);s.track=[];log(s,'Everyone passed on a full track: all Auction tiles are discarded.');} else log(s,'Everyone passed: the tiles and center Sun Disk stay.'); next(s,a.caller);return;}
 const p=s.players[a.winner],d=p.disks.find(d=>d.value===a.high); const old=s.center; d.value=old; d.used=true; s.center=a.high;
 const tiles=s.track; s.track=[]; p.tiles.push(...tiles.filter(t=>!DIS[t.kind]));
 log(s,p.name+' wins '+tiles.length+' tile'+(tiles.length===1?'':'s')+' with '+a.high+'; takes disk '+old+' face down.');
 acquireDisasters(s,a.winner,tiles.filter(t=>DIS[t.kind]),{phase:'turn',from:a.caller});
}
function acquireDisasters(s,player,tiles,resume) {
 if(!tiles.length) {resumeAfter(s,resume);return;}
 s.pending={player,queue:tiles,left:2,resume};s.phase='disaster'; settleDisaster(s);
}
function disasterTargets(s) {
 const p=s.players[s.pending.player],k=s.pending.queue[0].kind;
 if(k==='drought') {const floods=p.tiles.filter(t=>t.kind==='flood');return floods.length?floods:p.tiles.filter(t=>t.kind==='nile');}
 return p.tiles.filter(t=>t.kind===DIS[k]);
}
function settleDisaster(s) {
 while(s.pending) {
  const q=s.pending,targets=disasterTargets(s);
  if(q.left&&targets.length) return;
  const t=q.queue.shift(); s.discard.push(t); log(s,name(t)+' resolved for '+s.players[q.player].name+'.');
  if(q.queue.length) q.left=2; else {const r=q.resume;s.pending=null;resumeAfter(s,r);return;}
 }
}
function resumeAfter(s,r) { if(r.phase==='god') {s.phase='god';s.turn=r.from; if(!count(s.players[s.turn],'god')||!s.track.some(t=>t.kind!=='god')) next(s,r.from);} else next(s,r.from); }
function scoreRows(s,final=s.epoch===3) {
 const ph=s.players.map(p=>count(p,'pharaoh')), hi=Math.max(...ph),lo=Math.min(...ph);
 const sums=s.players.map(p=>p.disks.reduce((v,d)=>v+d.value,0)),shi=Math.max(...sums),slo=Math.min(...sums);
 return s.players.map((p,i)=>{
  const cv=new Set(p.tiles.filter(t=>t.kind==='civilization').map(t=>t.type)).size;
  const ms=MON.map(t=>p.tiles.filter(x=>x.kind==='monument'&&x.type===t).length),types=ms.filter(n=>n>0).length;
  const r={Pharaohs:hi===lo?0:ph[i]===hi?5:ph[i]===lo?-2:0,River:count(p,'flood')+(count(p,'flood')?count(p,'nile'):0),Gods:2*count(p,'god'),Gold:3*count(p,'gold'),Civilizations:cv===0?-5:cv<3?0:5*(cv-2)};
  if(final) {r.Monuments=(types<=6?types:types===7?10:15)+ms.reduce((v,n)=>v+(n>=3?5*(n-2):0),0);r['Sun Disks']=shi===slo?0:sums[i]===shi?5:sums[i]===slo?-5:0;}
  return r;
 });
}
function endEpoch(s,reason) {
 const rows=scoreRows(s); const report={epoch:s.epoch,reason,rows:rows.map((r,i)=>{
  const p=s.players[i],earned=Object.values(r).reduce((a,b)=>a+b,0),before=p.score;p.score=Math.max(0,p.score+earned);
  return {name:p.name,categories:r,earned,before,total:p.score,applied:p.score-before};
 })};
 s.reports.push(report); s.auction=null; log(s,'Epoch '+s.epoch+' ends. '+reason);
 if(s.epoch===3) {s.phase='gameover';s.winner=winner(s);log(s,s.players[s.winner].name+' wins with '+s.players[s.winner].score+' points.');} else s.phase='epoch';
}
function winner(s) { return s.players.reduce((best,p,i)=>p.score>s.players[best].score||(p.score===s.players[best].score&&Math.max(...p.disks.map(d=>d.value))>Math.max(...s.players[best].disks.map(d=>d.value)))?i:best,0); }
function advance(s) {
 if(s.phase!=='epoch') throw Error('The Epoch is not finished.');
 for(const p of s.players) {s.discard.push(...p.tiles.filter(t=>!['pharaoh','nile','monument'].includes(t.kind)));p.tiles=p.tiles.filter(t=>['pharaoh','nile','monument'].includes(t.kind));p.disks.forEach(d=>d.used=false);}
 s.discard.push(...s.track);s.track=[];s.ra=0;s.epoch++;s.phase='turn';s.turn=highest(s);log(s,'Epoch '+s.epoch+' begins. '+s.players[s.turn].name+' starts.');
}
function act(s,a) {
 const l=legal(s),p=s.players[actor(s)];
 if(a.type==='nextEpoch') {advance(s);s.steps++;return;}
 if(s.phase==='auction') {
  if(a.type!=='bid'||!(a.value===0?l.pass:l.bids.includes(a.value))) throw Error('Choose a legal bid or pass.');
  const au=s.auction,j=actor(s);au.bids.push({player:j,value:a.value}); if(a.value>0) {au.high=a.value;au.winner=j;} log(s,p.name+(a.value?' bids '+a.value+'.':' passes.'));au.pos++;if(au.pos===au.order.length) finishAuction(s);
 } else if(s.phase==='disaster') {
  if(a.type!=='discard'||!l.targets.includes(a.id)) throw Error('Choose a matching tile to discard.');
  const index=p.tiles.findIndex(t=>t.id===a.id);const t=p.tiles.splice(index,1)[0];s.discard.push(t);s.pending.left--;log(s,p.name+' discards '+name(t)+'.');settleDisaster(s);
 } else if(s.phase==='god') {
  if(a.type==='done'&&l.done) next(s,s.turn);
  else if(a.type==='cancelGod'&&l.cancel) s.phase='turn';
  else if(a.type==='take'&&l.targets.includes(a.id)&&count(p,'god')) {
   const g=p.tiles.findIndex(t=>t.kind==='god');s.discard.push(...p.tiles.splice(g,1));s.godSpent++;const t=s.track.splice(s.track.findIndex(t=>t.id===a.id),1)[0];log(s,p.name+' spends a God for '+name(t)+'.');
   if(DIS[t.kind]) acquireDisasters(s,s.turn,[t],{phase:'god',from:s.turn}); else {p.tiles.push(t);if(!count(p,'god')||!s.track.some(t=>t.kind!=='god')) next(s,s.turn);}
  } else throw Error('Choose a non-God tile or finish your action.');
 } else if(s.phase==='turn') {
  if(a.type==='draw'&&l.draw) {const t=s.bag.pop();if(t.kind==='ra') {s.discard.push(t);s.ra++;if(s.ra===s.limit) endEpoch(s,'The final Ra space was reached. No auction takes place.');else beginAuction(s,'draw');} else {s.track.push(t);log(s,p.name+' draws '+name(t)+'.');next(s,s.turn);}}
  else if(a.type==='invoke') beginAuction(s,'invoke');
  else if(a.type==='god'&&l.god) {s.phase='god';s.godSpent=0;}
  else throw Error('That action is unavailable.');
 } else throw Error('No player action is available.');
 s.steps++;
}
/* Bots evaluate the real scoring marginal, then add future value of permanent
   collections. They see public collections/disks, never the shuffled bag. */
function position(s,j) {
 const p=s.players[j],r=scoreRows(s)[j];let value=Object.values(r).reduce((a,b)=>a+b,0);
 if(s.epoch<3) {
  const remaining=3-s.epoch, ph=count(p,'pharaoh'),river=count(p,'nile');
  value+=remaining*(ph*.8+river*.55);
  const ms=MON.map(t=>p.tiles.filter(x=>x.kind==='monument'&&x.type===t).length),types=ms.filter(n=>n>0).length;
  value+=(types<=6?types:types===7?10:15)*.8+ms.reduce((v,n)=>v+(n>=3?5*(n-2):n===2?1.7:.3),0);
 }
 return value;
}
function lossChoice(s) {
 const j=actor(s),p=s.players[j],targets=disasterTargets(s);let best=targets[0],value=-Infinity;
 for(const t of targets) {const c=clone(s);c.players[j].tiles=c.players[j].tiles.filter(x=>x.id!==t.id);const v=position(c,j);if(v>value) {best=t;value=v;}}
 return best.id;
}
function lotValue(s,j,tiles=s.track) {
 const c=clone(s),before=position(c,j);c.players[j].tiles.push(...tiles.filter(t=>!DIS[t.kind]));
 for(const d of tiles.filter(t=>DIS[t.kind])) {
  c.pending={player:j,queue:[d],left:2};c.phase='disaster';
  for(let i=0;i<2;i++) {if(!disasterTargets(c).length) break;const id=lossChoice(c);c.players[j].tiles=c.players[j].tiles.filter(t=>t.id!==id);}
 }
 return position(c,j)-before;
}
function bidChoice(s,j) {
 const p=s.players[j],available=p.disks.filter(d=>!d.used).map(d=>d.value).sort((a,b)=>a-b),high=s.auction.high;
 const v=lotValue(s,j),pressure=s.ra/s.limit,min=available[0],max=Math.max(...p.disks.map(d=>d.value)),lvl=p.control;
 let willingness=v+(s.center-min)*.27+(pressure>.55?(pressure-.55)*10:0)+(available.length>1?0:1);
 if(lvl==='easy') willingness+= (rand(s)-.5)*7-1;
 const opponents=s.players.flatMap((q,i)=>i===j?[]:q.disks.filter(d=>!d.used).map(d=>d.value));
 const candidates=available.filter(v=>v>high);
 if(mustBid(s)) return candidates[0];
 let chosen=0,utility=-Infinity;
 for(const disk of candidates) {
  const cost=(1.4+disk/max*7+(disk-min)*.18)*(lvl==='hard'?1-pressure*.35:1);
  let u=willingness-cost;
  if(lvl==='hard') {
   const later=s.auction.order.slice(s.auction.pos+1);
   const danger=later.filter(i=>s.players[i].disks.some(d=>!d.used&&d.value>disk)&&lotValue(s,i)>3).length;
   u-=danger*.85;
   // Denying a particularly useful lot is worth a modest premium. Losing
   // an auction costs nothing, so uncertainty should not force a pass.
   const rivals=s.players.map((q,i)=>i!==j&&q.disks.some(d=>!d.used)?lotValue(s,i):0);
   u+=Math.max(0,...rivals)*.22;
   if(s.epoch===3) {const c=clone(s),d=c.players[j].disks.find(d=>d.value===disk);d.value=s.center;u+=(scoreRows(c)[j]['Sun Disks']-scoreRows(s)[j]['Sun Disks'])*.8;}
  }
  if(!opponents.some(x=>x>disk)) u+=.4;
  if(u>utility) {utility=u;chosen=disk;}
 }
 return utility>=0?chosen:0;
}
function bot(s) {
 if(s.phase==='epoch') return {type:'nextEpoch'};
 if(s.phase==='gameover') return null;
 const j=actor(s),p=s.players[j],l=legal(s);
 if(s.phase==='auction') return {type:'bid',value:bidChoice(s,j)};
 if(s.phase==='disaster') return {type:'discard',id:lossChoice(s)};
 if(s.phase==='god') {
  const choices=s.track.filter(t=>t.kind!=='god').map(t=>({id:t.id,value:lotValue(s,j,[t])})).sort((a,b)=>b.value-a.value);
  return choices.length&&choices[0].value>2.25?{type:'take',id:choices[0].id}:l.done?{type:'done'}:{type:'cancelGod'};
 }
 if(l.god) {const best=Math.max(...s.track.filter(t=>t.kind!=='god').map(t=>lotValue(s,j,[t])));if(best>2.7) return {type:'god'};}
 if(!l.draw) return {type:'invoke'};
 const v=lotValue(s,j),pressure=s.ra/s.limit,available=p.disks.filter(d=>!d.used),min=Math.min(...available.map(d=>d.value));
 const enemy=s.players.some((q,i)=>i!==j&&q.disks.some(d=>!d.used&&d.value>Math.max(...available.map(x=>x.value))));
 const threshold=p.control==='easy'?7+rand(s)*5:p.control==='hard'?6.5:8;
 if((v+(s.center-min)*.2+pressure*4>threshold&&(!enemy||s.track.length>=5||pressure>.65))||(pressure>.8&&v>2)) return {type:'invoke'};
 return {type:'draw'};
}
function assertState(s) {
 const fail=msg=>{throw Error('Invalid save: '+msg);};
 if(!s||s.version!==1||!Array.isArray(s.players)||s.players.length<2||s.players.length>5) fail('unsupported game format.');
 if(!['turn','auction','god','disaster','epoch','gameover'].includes(s.phase)||![1,2,3].includes(s.epoch)||s.limit!==LIMIT[s.players.length]||!Number.isInteger(s.ra)||s.ra<0||s.ra>s.limit) fail('phase or Epoch.');
 if(!Number.isInteger(s.turn)||!s.players[s.turn]||!Number.isInteger(s.rng)||!Number.isInteger(s.center)) fail('turn or disks.');
 const diskValues=[s.center];const all=[];
 for(const p of s.players) {
  if(typeof p.name!=='string'||p.name.length>28||!['human','easy','normal','hard'].includes(p.control)||!Number.isInteger(p.score)||p.score<0||!Array.isArray(p.tiles)||!Array.isArray(p.disks)||p.disks.length!==GROUPS[s.players.length][0].length) fail('player.');
  p.disks.forEach(d=>{if(!Number.isInteger(d.value)||typeof d.used!=='boolean') fail('Sun Disk.');diskValues.push(d.value);});all.push(...p.tiles);
 }
 const max=s.players.length===5?16:s.players.length===2?9:13;
 if(diskValues.length!==max||new Set(diskValues).size!==max||diskValues.some(v=>v<1||v>max)) fail('Sun Disk conservation.');
 for(const k of ['bag','track','discard','log','reports']) if(!Array.isArray(s[k])) fail(k+'.');
 if(s.track.length>8||s.log.some(v=>typeof v!=='string')||s.log.length>160||s.reports.length>3) fail('track or history.');
 if(s.phase==='auction') {
  const a=s.auction;if(!a||!Number.isInteger(a.caller)||!s.players[a.caller]||!['draw','invoke'].includes(a.reason)||typeof a.full!=='boolean'||!Array.isArray(a.order)||!a.order.length||new Set(a.order).size!==a.order.length||a.order.some(j=>!Number.isInteger(j)||!s.players[j])||!Number.isInteger(a.pos)||a.pos<0||a.pos>=a.order.length||!Array.isArray(a.bids)||a.bids.length!==a.pos||!Number.isInteger(a.high)||a.high<0||a.high>max||(a.winner!==null&&!s.players[a.winner])) fail('auction.');
  const order=[];for(let i=1;i<=s.players.length;i++){const j=(a.caller+i)%s.players.length;if(s.players[j].disks.some(d=>!d.used))order.push(j);}
  if(JSON.stringify(order)!==JSON.stringify(a.order)||a.full!==(s.track.length===8)||a.caller!==s.turn)fail('auction order.');
  let high=0,win=null;for(let i=0;i<a.bids.length;i++){const b=a.bids[i];if(!b||b.player!==order[i]||!Number.isInteger(b.value)||b.value<0||(b.value&&(!s.players[b.player].disks.some(d=>!d.used&&d.value===b.value)||b.value<=high)))fail('bid history.');if(b.value){high=b.value;win=b.player;}}
  if(a.high!==high||a.winner!==win)fail('highest bid.');
 }
 if(s.phase==='disaster') {const q=s.pending;if(!q||!s.players[q.player]||!Array.isArray(q.queue)||!q.queue.length||q.queue.some(t=>!DIS[t.kind])||!Number.isInteger(q.left)||q.left<1||q.left>2||!q.resume||!['god','turn'].includes(q.resume.phase)||!s.players[q.resume.from]) fail('disaster.');all.push(...q.queue);}
 all.push(...s.bag,...s.track,...s.discard);
 const expected=deck();const byId=new Map(expected.map(t=>[t.id,t]));
 if(all.length!==expected.length||new Set(all.map(t=>t.id)).size!==expected.length||all.some(t=>!byId.has(t.id)||byId.get(t.id).kind!==t.kind||byId.get(t.id).type!==t.type)) fail('tile conservation.');
 if(s.players.some(p=>p.tiles.some(t=>t.kind==='ra'||DIS[t.kind]))||s.track.some(t=>t.kind==='ra')) fail('tile location.');
 if(['turn','god'].includes(s.phase)&&!s.players[s.turn].disks.some(d=>!d.used)) fail('active player has no disks.');
 if(s.phase==='god'&&(!Number.isInteger(s.godSpent)||s.godSpent<0||s.godSpent>8||!count(s.players[s.turn],'god')||!s.track.some(t=>t.kind!=='god')))fail('God action.');
 if(s.phase==='disaster'&&!disasterTargets(s).length) fail('no disaster target.');
 if(s.reports.some(r=>!r||!Array.isArray(r.rows)||r.rows.length!==s.players.length||r.rows.some(v=>!v||typeof v.name!=='string'||!v.categories||Object.values(v.categories).some(n=>!Number.isInteger(n))||!Number.isInteger(v.earned)||!Number.isInteger(v.total)))) fail('score report.');
 if(s.phase==='gameover'&&s.winner!==winner(s)) fail('winner.');
 return true;
}
const api={CIV,MON,GROUPS,LIMIT,DIS,LABEL,create,actor,legal,act,bot,clone,count,name,scoreRows,lotValue,assertState,winner,deck,lossChoice};
if(typeof module!=='undefined'&&module.exports) module.exports=api;else root.Ra=api;
})(typeof globalThis!=='undefined'?globalThis:this);
