import MODULES from "../data/modules.json";
import {dayStreak, store, S, $, esc, pad2, dailyState, dailyList, levelInfo} from "../core.js";
import {go} from "../main.js";
import {QS, Q, pct} from "./quiz.js";
import {progOf} from "./lesson.js";
import {badgeCard} from "./badges.js";
import {liveTopo, topoLegend} from "./netview.js";

const modPct=id=>progOf(id);
const TOPO='<svg class="dh-art" viewBox="0 0 272 90" role="img" aria-label="Topologi: PC, switch, router, PC"><g stroke="#12b8d6" stroke-width="2" stroke-linecap="round" fill="none"><path d="M36 45H92M128 45H174M210 45H236"/></g><g fill="#0b1f3a" stroke="#fff" stroke-width="2"><rect x="10" y="30" width="26" height="30" rx="5"/><rect x="92" y="32" width="36" height="26" rx="5"/><circle cx="192" cy="45" r="18"/><rect x="236" y="30" width="26" height="30" rx="5"/></g><g fill="#34d399"><circle cx="23" cy="72" r="4"/><circle cx="110" cy="72" r="4"/><circle cx="192" cy="72" r="4"/><circle cx="249" cy="72" r="4"/></g></svg>';
const greet=()=>{const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"};
function dailyCard(){
 const dq=dailyList(),ds=dailyState(),n=dq.filter(q=>ds.done[q.id]).length;
 return `<section class="pan"><div class="lbl-row"><p class="lbl">Daily Quest</p><span class="muted" style="font-size:.82rem">${n} / ${dq.length} Completed</span></div><div class="xpbar" style="margin-bottom:6px"><i data-w="${Math.round(n/dq.length*100)}" style="width:0"></i></div>${dq.map(q=>{const c=Math.min(ds.cnt[q.ev]||0,q.n),ok=!!ds.done[q.id];return `<div class="dq${ok?" ok":""}"><i aria-hidden="true">${ok?"✓":""}</i><span>${q.t}${q.n>1?" ("+c+"/"+q.n+")":""}</span><b>+${q.xp} XP</b></div>`}).join("")}</section>`;
}
function contCard(cur){
 if(!cur)return `<section class="pan allok"><p class="lbl">All Modules Completed</p><h2 class="h2">Semua Modul Selesai 🎉</h2><p class="muted" style="margin:0">Kamu sudah menyelesaikan seluruh modul NETLAB.</p><div class="seg" style="margin-top:14px"><button class="act alt" style="width:auto;flex:1" data-go="modul">Review Modul</button><button class="act" style="width:auto;flex:1" data-dash="exam">Exam Mode →</button></div></section>`;
 const p=modPct(cur.id);
 return `<section class="pan"><p class="lbl">Continue Learning</p><h2 class="h2">${cur.title}</h2><p class="muted" style="margin:0 0 10px">${cur.cat} · ${cur.level} · ${cur.min} min</p><div class="bar" role="progressbar" aria-label="Progres modul" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><i style="width:${p}%"></i></div><div class="prog-foot"><span>Progress</span><span>${p}%</span></div><button class="go" data-start="${cur.id}">${p>0?"Lanjutkan Modul →":"Mulai Modul →"}</button></section>`;
}
document.addEventListener("click",e=>{if(e.target.closest("[data-dash=exam]")){Q.exam=true;Q.run=null;go("kuis")}});
function renderDashboard(){
 const lv=levelInfo(S.xp),last=store.get("lastModule",null),done=MODULES.filter(m=>modPct(m.id)===100).length,acc=pct(QS.ok,QS.ans);
 const inprog=MODULES.filter(m=>modPct(m.id)>0&&modPct(m.id)<100),cur=inprog.find(m=>m.id===last)||inprog[0]||MODULES.find(m=>modPct(m.id)===0)||null;
 const weak=Object.entries(QS.cat||{}).filter(([,v])=>v[1]>=3).map(([c,v])=>[c,Math.round(v[0]/v[1]*100)]).sort((a,b)=>a[1]-b[1])[0];
 const recs=MODULES.filter(m=>modPct(m.id)<100&&m.id!==(cur&&cur.id)).slice(0,2);
 const row=(t,s,b,a)=>`<div class="cc"><div style="min-width:0"><b>${t}</b><div class="cd">${s}</div></div><button class="cpy" ${a}>${b}</button></div>`;
 const st=[["Modules Completed",done+" / "+MODULES.length],["Quiz Completed",store.get("quizHistory",[]).length],["Total XP",S.xp],["Accuracy",QS.ans?acc+"%":"–"]];
 $("#view").innerHTML=`<div class="dash-head"><h1 class="pg dh-t">${greet()}, ${lv.name} 👋</h1><p class="muted" style="margin:4px 0 0">Ready to build your network?</p></div>
 <div class="dash-grid">
 <section class="pan"><p class="lbl">User Progress</p><div class="prog-row"><div><div class="lvbig">LEVEL ${pad2(lv.n)}</div><b style="font-size:1.15rem">${lv.name}</b></div><div class="streak">🔥 ${dayStreak()} Day Streak</div></div>
  <div class="xpbar" role="progressbar" aria-label="XP progress to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${lv.pct}"><i data-w="${lv.pct}" style="width:0"></i></div>
  <div class="prog-foot"><span>${S.xp}${lv.next?" / "+lv.next:""} XP</span><span>${lv.next?(lv.next-S.xp)+" XP to Level "+pad2(lv.n+1):"Max level"}</span></div></section>
 ${contCard(cur)}</div>
 <p class="lbl sp">Statistics</p><div class="stats4">${st.map(x=>`<div class="stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("")}</div>
 <p class="lbl sp">Network Activity</p><section class="pan"><div id="dtopo">${liveTopo()}</div>${topoLegend()}</section>
 <div class="dash-grid">${dailyCard()}<section class="pan"><p class="lbl">Recommended</p>${weak&&weak[1]<75?row("Review: "+esc(weak[0]),"Quiz accuracy "+weak[1]+"%","Practice",`data-sr="qz" data-v="${esc(weak[0])}"`):""}${recs.map(m=>row(esc(m.title),m.level+" · "+m.min+" min","Open",`data-start="${m.id}"`)).join("")||(weak?"":'<p class="muted">All modules completed. Try Exam mode in Quiz.</p>')}</section></div>
 ${badgeCard()}`;
 requestAnimationFrame(()=>document.querySelectorAll(".xpbar i[data-w]").forEach(b=>{b.style.width=b.dataset.w+"%"}));
}

export {dailyCard, contCard, renderDashboard, modPct, TOPO, greet};
