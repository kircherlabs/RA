/* Presentation model for player-board scoring. Awards come from the rules engine. */
(function(root){
'use strict';
const E=root.Ra||(typeof require!=='undefined'?require('./engine.js'):null);
function sum(a){return a.reduce((v,n)=>v+n,0);}
function plural(n,word){return n+' '+word+(n===1?'':'s');}
function rankText(value,values,word){const high=Math.max(...values),low=Math.min(...values),disks=word==='disk sum',owned=disks?'Disk sum '+value:plural(value,'Pharaoh');if(high===low)return (disks?'All disk sums = '+value:'Everyone has '+plural(value,'Pharaoh'))+' → 0 points.';if(value===high)return owned+' · '+(values.filter(n=>n===high).length>1?'tied for ':'')+(disks?'highest total':'most')+' → +5 points.';if(value===low)return owned+' · '+(values.filter(n=>n===low).length>1?'tied for ':'')+(disks?'lowest total':'fewest')+' → '+(disks?'−5':'−2')+' points.';return owned+' · '+(disks?'highest total ':'most ')+high+', '+(disks?'lowest total ':'fewest ')+low+' → 0 points.';}
function board(s,i){const p=s.players[i],settled=['epoch','gameover'].includes(s.phase),report=settled?s.reports.at(-1)?.rows[i]:null,earnedRows=report?report.categories:E.scoreRows(s)[i],finalRows=E.scoreRows(s,true)[i];
 const n=k=>E.count(p,k),cv=new Set(p.tiles.filter(t=>t.kind==='civilization').map(t=>t.type)).size;
 const ms=E.MON.map(type=>({type,count:p.tiles.filter(t=>t.kind==='monument'&&t.type===type).length})),types=ms.filter(t=>t.count>0).length,sets=ms.filter(t=>t.count>=3),diversity=types<=6?types:types===7?10:15,multiplicity=sum(sets.map(t=>5*(t.count-2)));
 const disks=p.disks.map(d=>d.value).sort((a,b)=>a-b),diskSum=sum(disks),diskSums=s.players.map(x=>sum(x.disks.map(d=>d.value)));
 const categories=[
  {key:'Pharaohs',label:'Pharaohs',points:earnedRows.Pharaohs,active:true,explanation:rankText(n('pharaoh'),s.players.map(x=>E.count(x,'pharaoh')),'Pharaohs')},
  {key:'River',label:'Nile & Flood',points:earnedRows.River,active:true,explanation:n('flood')?n('flood')+' Flood × 1 + '+n('nile')+' Nile × 1 = '+earnedRows.River+' points.':'0 Floods → '+plural(n('nile'),'Nile tile')+' inactive → 0 points.'},
  {key:'Gods',label:'Gods',points:earnedRows.Gods,active:true,explanation:n('god')+' unspent × 2 = '+earnedRows.Gods+' points.'},
  {key:'Gold',label:'Gold',points:earnedRows.Gold,active:true,explanation:n('gold')+' Gold × 3 = '+earnedRows.Gold+' points.'},
  {key:'Civilizations',label:'Civilizations',points:earnedRows.Civilizations,active:true,explanation:cv===0?'No Civilizations → −5 points.':plural(cv,'distinct type')+' → '+earnedRows.Civilizations+' points.'+(cv<3?' Need 3 different types for 5 points.':' Duplicates add no points.')},
  {key:'Monuments',label:'Monuments',points:earnedRows.Monuments||0,active:s.epoch===3,potential:finalRows.Monuments,explanation:plural(types,'distinct type')+' → '+diversity+' diversity points; identical sets → '+multiplicity+' points.',detail:sets.length?sets.map(t=>t.count+' '+t.type+' → '+5*(t.count-2)+' points').join(' · '):'No identical sets of 3 or more.'},
  {key:'Sun Disks',label:'Sun Disks',points:earnedRows['Sun Disks']||0,active:s.epoch===3,potential:finalRows['Sun Disks'],explanation:rankText(diskSum,diskSums,'disk sum'),detail:disks.join(' + ')+' = '+diskSum+' (face up and face down; center disk excluded).'}
 ];
 const net=report?report.earned:sum(Object.values(earnedRows));
 return {epoch:s.epoch,settled:!!report,provisional:s.phase==='disaster',categories,net,banked:p.score,before:report?report.before:p.score,after:report?report.total:Math.max(0,p.score+net),applied:report?report.applied:Math.max(0,p.score+net)-p.score,history:s.reports.map(r=>({epoch:r.epoch,...r.rows[i]})),diskSum};
}
const api={board};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RaScoring=api;
})(typeof globalThis!=='undefined'?globalThis:this);
