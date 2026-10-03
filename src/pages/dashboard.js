import MODULES from "../data/modules.json";
import {store, S, $, esc, dailyState, dailyList, levelInfo} from "../core.js";
import {go} from "../main.js";
import {QS, pct} from "./quiz.js";
import {MDONE} from "./lesson.js";
import {badgeCard} from "./badges.js";

const modPct=id=>S.progress[id]||0;
const TOPO='<svg class="dh-art" viewBox="0 0 272 90" role="img" aria-label="Topologi: PC, switch, router, PC"><g stroke="#12b8d6" stroke-width="2" stroke-linecap="round" fill="none"><path d="M36 45H92M128 45H174M210 45H236"/></g><g fill="#0b1f3a" stroke="#fff" stroke-width="2"><rect x="10" y="30" width="26" height="30" rx="5"/><rect x="92" y="32" width="36" height="26" rx="5"/><circle cx="192" cy="45" r="18"/><rect x="236" y="30" width="26" height="30" rx="5"/></g><g fill="#34d399"><circle cx="23" cy="72" r="4"/><circle cx="110" cy="72" r="4"/><circle cx="192" cy="72" r="4"/><circle cx="249" cy="72" r="4"/></g></svg>';
function renderDashboard(){
 const lv=levelInfo(S.xp),last=store.get("lastModule",null),done=Object.keys(MDONE).length,acc=pct(QS.ok,QS.ans);
 const cur=MODULES.find(m=>m.id===last&&modPct(m.id)<100)||MODULES.find(m=>modPct(m.id)<100)||MODULES[0];
 const dq=dailyList(),ds=dailyState();
 const weak=Object.entries(QS.cat||{}).filter(([,v])=>v[1]>=3).map(([c,v])=>[c,Math.round(v[0]/v[1]*100)]).sort((a,b)=>a[1]-b[1])[0];
 const recs=MODULES.filter(m=>modPct(m.id)<100&&m.id!==cur.id).slice(0,2);
 const row=(t,s,b,a)=>`<div class="cc"><div style="min-width:0"><b>${t}</b><div class="cd">${s}</div></div><button class="cpy" ${a}>${b}</button></div>`;
 const st=[[done+" / "+MODULES.length,"Modul selesai"],[store.get("quizHistory",[]).length,"Kuis dikerjakan"],[S.xp+" XP","Total XP"],[(QS.ans?acc+"%":"-"),"Akurasi kuis"]];
 $("#view").innerHTML=`<section class="dash-hero"><div class="dh-main"><h1 class="dh-title">Halo, ${lv.name}! 👋</h1>
 <p class="dh-sub">Level ${lv.n} · ${S.xp} XP · 🔥 ${S.streak} streak</p>
 <div class="xpbar" role="progressbar" aria-label="Progres menuju level berikutnya" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${lv.pct}"><i style="width:0"></i></div>
 <p class="dh-next">${lv.next?(lv.next-S.xp)+" XP lagi menuju Level "+(lv.n+1)+" · "+lv.nextName:"Level tertinggi tercapai"}</p></div>${TOPO}</section>
 <div class="stats4">${st.map(x=>`<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div>
 <div class="dgrid"><div class="dgrid-col">
 <article class="dcard"><h2 class="dh2">Lanjutkan belajar</h2><b>${cur.title}</b><div class="bar" style="margin:10px 0 4px"><i style="width:${modPct(cur.id)}%"></i></div><small style="color:var(--mute)">${modPct(cur.id)}% selesai</small><button class="go" style="width:100%;margin-top:12px" data-start="${cur.id}">Lanjutkan Belajar →</button></article>
 <article class="dcard" style="margin-top:14px"><h2 class="dh2">Rekomendasi</h2>${weak&&weak[1]<75?row("Perdalam: "+esc(weak[0]),"Akurasi kuis "+weak[1]+"%, latihan lagi","Latihan",`data-sr="qz" data-v="${esc(weak[0])}"`):""}${recs.map(m=>row(esc(m.title),m.level+" · "+m.min+" menit","Buka",`data-start="${m.id}"`)).join("")||(weak?"":'<p style="color:var(--mute)">Semua modul selesai. Coba mode ujian di Kuis.</p>')}</article></div>
 <article class="dcard"><h2 class="dh2">Quest harian</h2><p style="color:var(--mute);margin:0 0 6px;font-size:.9rem">Selesai otomatis saat kamu melakukannya. Reset tiap hari.</p>${dq.map(q=>{const c=Math.min(ds.cnt[q.ev]||0,q.n),ok=!!ds.done[q.id];return `<div class="dq${ok?" ok":""}"><i aria-hidden="true">${ok?"✓":""}</i><span>${q.t}${q.n>1?" ("+c+"/"+q.n+")":""}</span><b>+${q.xp} XP</b></div>`}).join("")}</article></div>${badgeCard()}`;
 requestAnimationFrame(()=>{const b=$(".xpbar i");if(b)b.style.width=lv.pct+"%"});
}

export {renderDashboard, modPct, TOPO};
