import MODULES from "../data/modules.json";
import {CATS, levelOf, S, $, esc, hl} from "../core.js";
import {progOf} from "./lesson.js";

function moduleCard(m){
 const p=progOf(m.id),q=S.q.trim();
 return `<article class="mod" style="--c:${m.color}">
  <div><div class="n">Modul ${m.id}</div><h3>${hl(m.title,q)}</h3></div>
  <div class="meta"><span class="tag o">${m.level}</span><span class="tag">⏱ ${m.min} menit</span><span class="tag">${m.devices.join(" · ")}</span></div>
  <div class="topics">${m.topics.map(t=>`<span>${hl(t,q)}</span>`).join("")}</div>
  <div><div class="bar${p===100?" done":""}" role="progressbar" aria-label="Progres modul" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div><small style="color:var(--mute)">Progress ${p}%${p===100?" · selesai":""}</small></div>
  <button class="go${p===100?" done":""}" data-start="${m.id}"${p===100?` aria-label="Modul selesai, buka untuk review"`:""}>${p===100?"✓ Modul Selesai":p>0?"Lanjutkan Modul →":"Mulai Modul →"}</button></article>`;
}

function filtered(){
 const q=S.q.trim().toLowerCase();
 return MODULES.filter(m=>(S.cat==="Semua"||m.cat===S.cat)&&(!q||[m.title,m.cat,m.level,...m.topics,...m.devices].join(" ").toLowerCase().includes(q)));
}

function renderModules(){
 const lv=levelOf(S.xp);
 $("#view").innerHTML=`
 <section class="hero"><h1>Kuasai Jaringan Cisco Lebih Cepat</h1>
 <p>Belajar Cisco IOS, routing, switching, VLAN, subnetting, dan troubleshooting secara interaktif.</p>
 <label class="search"><span aria-hidden="true">🔍</span><input id="q" type="search" placeholder="Cari topik, command, VLAN, OSPF, subnetting..." value="${esc(S.q)}" aria-label="Cari"><button class="clr" id="clr" aria-label="Hapus pencarian" ${S.q?"":"hidden"}>✕</button></label></section>
 <div class="stats"><div class="stat"><b>${S.xp} XP</b><span>Level ${lv.n} · ${lv.name}</span></div><div class="stat"><b>🔥 ${S.streak}</b><span>Streak</span></div><div class="stat"><b>${MODULES.length}</b><span>Modul</span></div></div>
 <div class="chips" role="group" aria-label="Kategori">${CATS.map(c=>`<button class="chip" data-cat="${c}" aria-pressed="${c===S.cat}">${c}</button>`).join("")}</div>
 <div id="list"></div>`;
 renderList();
}

function renderList(){
 const r=filtered();
 $("#list").innerHTML=`<div class="count">${r.length} modul ditemukan</div>`+(r.length?`<div class="grid">${r.map(moduleCard).join("")}</div>`:`<div class="empty"><div style="font-size:2.4rem">🔎</div><b>Tidak ada hasil</b><p style="color:var(--mute);margin:6px 0 0">Coba kata kunci lain atau pilih kategori Semua.</p></div>`);
 const c=$("#clr");if(c)c.hidden=!S.q;
}

export {moduleCard, filtered, renderModules, renderList};
