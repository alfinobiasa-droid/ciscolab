import "./pwa.js";
import "./style.css";
import {PAGES, store, S, $} from "./core.js";
import {renderModules, renderList} from "./pages/home.js";
import {renderQuiz, Q} from "./pages/quiz.js";
import {renderSandbox} from "./pages/sandbox.js";
import {renderQuest} from "./pages/quest.js";
import {renderTrouble} from "./pages/trouble.js";
import {openModule, renderModule, MD} from "./pages/lesson.js";
import {renderSubnet} from "./pages/subnet.js";
import {renderCheat, renderKamus} from "./pages/reference.js";
import {renderSearch} from "./pages/search.js";
import {renderMenu} from "./pages/settings.js";
import {renderDashboard} from "./pages/dashboard.js";

function renderSoon(p){
 $("#view").innerHTML=`<div class="soon"><div class="big">${p.i}</div><h2 style="margin:8px 0">${p.t}</h2><p style="color:var(--mute);max-width:46ch;margin:0 auto 18px">${p.d}</p><span class="tag o">Hadir di fase berikutnya</span></div>`;
}

function renderNav(){
 $("#nav").innerHTML=PAGES.map(p=>`<button data-go="${p.k}" ${p.k===S.page?'aria-current="page"':""}><span>${p.i}</span>${p.t}</button>`).join("");
}

function render(){
 renderNav();
 const p=PAGES.find(x=>x.k===S.page)||PAGES[0];
 if(p.k==="kuis"&&Q.run&&Q.run.i>=Q.run.items.length)Q.run=null;
 S.page==="cari"?renderSearch():S.page==="menu"?renderMenu():p.k==="dashboard"?renderDashboard():p.k==="modul"?(MD.id?renderModule():renderModules()):p.k==="kuis"?renderQuiz():p.k==="sandbox"?renderSandbox():p.k==="quest"?renderQuest():p.k==="trouble"?renderTrouble():p.k==="subnet"?renderSubnet():p.k==="cheat"?renderCheat():p.k==="kamus"?renderKamus():renderSoon(p);
 window.scrollTo(0,0);
}

function go(k){if(k==="modul")MD.id=null;S.page=k;history.replaceState(null,"","#"+k);render()}

document.addEventListener("click",e=>{
 const t=e.target.closest("[data-go],[data-cat],[data-start],#clr,#sbtn,#logo,#theme");if(!t)return;
 if(t.dataset.go)return go(t.dataset.go);
 if(t.id==="logo")return go("dashboard");
 if(t.id==="sbtn"){go("cari");return setTimeout(()=>$("#gq")?.focus(),50)}
 if(t.id==="theme"){const r=document.documentElement,d=getComputedStyle(r).getPropertyValue("--bg").trim()==="#0a1626";r.dataset.theme=d?"light":"dark";return store.set("theme",r.dataset.theme)}
 if(t.dataset.cat){S.cat=t.dataset.cat;document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.cat===S.cat));return renderList()}
 if(t.id==="clr"){S.q="";$("#q").value="";$("#q").focus();return renderList()}
 if(t.dataset.start)return openModule(+t.dataset.start);
});
document.addEventListener("input",e=>{if(e.target.id==="q"){S.q=e.target.value;renderList()}});
const th=store.get("theme",null);if(th)document.documentElement.dataset.theme=th;
render();

export {renderSoon, renderNav, render, go, th};
