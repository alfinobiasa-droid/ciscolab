import MODULES from "../data/modules.json";
import LESSONS from "../data/lessons.json";
import {dailyEvent, store, S, $, esc} from "../core.js";
import {render, go} from "../main.js";
import {L, pct, shuffle} from "./quiz.js";

/* Format materi: [judul, penjelasan, contoh/output, tips, pertanyaan, pilihan, indeks jawaban] */

const MD={id:null,i:0,sel:null,order:[],bad:[],msg:""};
const LS=store.get("lessons",{}),MDONE=store.get("modDone",{});
const doneSet=id=>LS[id]||[];
const isDone=(id,i)=>doneSet(id).includes(i);
const unlocked=(id,i)=>i===0||isDone(id,i-1);
function setLesson(i){MD.i=i;MD.sel=null;MD.bad=[];MD.msg="";MD.order=shuffle(LESSONS[MD.id][i][5].map((_,k)=>k))}
function openModule(id){MD.id=id;store.set("lastModule",id);setLesson(Math.min(doneSet(id).length,LESSONS[id].length-1));S.page="modul";render()}
function completeLesson(){
 const id=MD.id,n=LESSONS[id].length;
 (LS[id]=LS[id]||[]).push(MD.i);
 S.xp+=10;S.streak++;dailyEvent("lesson");MD.msg="✓ Benar! +10 XP";
 const pct=Math.round(LS[id].length/n*100);S.progress[id]=pct;
 if(pct===100&&!MDONE[id]){MDONE[id]=true;S.xp+=50;MD.msg+=" · Modul selesai! +50 XP";store.set("modDone",MDONE)}
 store.set("lessons",LS);store.set("progress",S.progress);store.set("xp",S.xp);store.set("streak",S.streak);
}
function renderModule(){
 const m=MODULES.find(x=>x.id===MD.id),ls=LESSONS[m.id],l=ls[MD.i],done=isDone(m.id,MD.i),solved=done||MD.sel!=null;
 const pct=Math.round(doneSet(m.id).length/ls.length*100),last=MD.i===ls.length-1;
 $("#view").innerHTML=`<button class="chip" data-md="back" style="margin-bottom:10px">← Semua modul</button>
 <div class="qcard" style="border-top:5px solid ${m.color}"><h1 class="pg" style="margin:0 0 8px;line-height:1.25">${m.title}</h1>
 <div class="meta"><span class="tag o">${m.level}</span><span class="tag">⏱ ${m.min} menit</span><span class="tag">Progress ${pct}%</span></div>
 <div class="bar" style="margin:12px 0 4px"><i style="width:${pct}%"></i></div>
 ${ls.map((x,i)=>{const d=isDone(m.id,i),u=unlocked(m.id,i);return `<button class="opt${i===MD.i?" sel":""}" data-md="go" data-v="${i}" ${u?"":"disabled"}><b>${d?"✓":u?i+1:"🔒"}</b><span>${x[0]}</span></button>`}).join("")}</div>
 <div class="qcard" style="margin-top:14px"><h3 style="margin:0 0 8px">${l[0]}</h3><p style="margin:0">${esc(l[1])}</p><pre class="code">${esc(l[2])}</pre>
 <div class="fb ok" style="margin:12px 0"><b>Tips:</b> ${esc(l[3])}</div>
 <b>Mini quiz</b><p style="margin:4px 0 0">${esc(l[4])}</p>
 ${MD.order.map((oi,d)=>{const c=solved?(oi===l[6]?" ok":""):(MD.bad.includes(d)?" no":"");return `<button class="opt${c}" data-md="pick" data-v="${d}" ${solved||MD.bad.includes(d)?"disabled":""}><b>${L[d]}</b><span>${esc(l[5][oi])}</span></button>`}).join("")}
 ${MD.msg?`<div role="status" class="fb ok"><b>${MD.msg}</b></div>`:MD.bad.length&&!solved?`<div role="status" class="fb no"><b>✗ Belum tepat.</b> Baca penjelasan di atas, lalu coba lagi.</div>`:""}
 <div style="display:flex;gap:10px"><button class="act alt" style="flex:1;width:auto" data-md="prev" ${MD.i?"":"disabled"}>Materi Sebelumnya</button><button class="act" style="flex:1;width:auto" data-md="next" ${solved&&!last?"":"disabled"}>Materi Berikutnya</button></div></div>`;
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-md]");if(!t||MD.id==null)return;
 const a=t.dataset.md,v=+t.dataset.v,l=LESSONS[MD.id][MD.i];
 if(a==="back")MD.id=null;
 else if(a==="go"&&unlocked(MD.id,v))setLesson(v);
 else if(a==="prev")setLesson(MD.i-1);
 else if(a==="next")setLesson(MD.i+1);
 else if(a==="pick"&&!isDone(MD.id,MD.i)){
  if(MD.order[v]===l[6]){MD.sel=v;completeLesson()}else{MD.bad.push(v);S.streak=0;store.set("streak",0)}
 }
 MD.id==null?render():renderModule();
 if(a!=="pick")window.scrollTo(0,0);
});

export {setLesson, openModule, completeLesson, renderModule, MD, LS, MDONE, doneSet, isDone, unlocked};
