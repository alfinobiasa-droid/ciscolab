import MODULES from "../data/modules.json";
import {toast, levelOf, S, $} from "../core.js";
import {go} from "../main.js";
import {MDONE} from "./lesson.js";

const PFX="netlab:";
const allData=()=>{const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(PFX))o[k]=localStorage.getItem(k)}}catch(x){}return o};
function renderMenu(){
 const lv=levelOf(S.xp),d=Object.keys(MDONE).length,note=t=>'<p style="color:var(--mute);margin:6px 0 12px">'+t+'</p>';
 $("#view").innerHTML='<h2 style="margin:4px 0 12px">Menu</h2>'
 +'<div class="qcard"><b>Progres kamu</b><div class="stats"><div class="stat"><b>'+S.xp+' XP</b><span>Level '+lv.n+' · '+lv.name+'</span></div><div class="stat"><b>🔥 '+S.streak+'</b><span>Streak</span></div><div class="stat"><b>'+d+' / '+MODULES.length+'</b><span>Modul selesai</span></div></div><button class="act alt" data-st="theme">Ganti tema terang/gelap</button></div>'
 +'<div class="qcard" style="margin-top:14px"><b>Cadangkan atau pindahkan progres</b>'+note('Ekspor menghasilkan teks yang bisa disalin. Tempel di perangkat lain lalu tekan Impor.')+'<textarea id="st-box" class="inp" rows="4" style="min-height:96px;padding:10px" aria-label="Data progres"></textarea><div style="display:flex;gap:10px"><button class="act" style="flex:1;width:auto" data-st="export">Ekspor</button><button class="act alt" style="flex:1;width:auto" data-st="import">Impor</button></div></div>'
 +'<div class="qcard" style="margin-top:14px"><b>Reset progres</b>'+note('Menghapus XP, streak, kuis, quest, dan progres modul di perangkat ini.')+'<button class="act" style="background:#d63c4f;margin-top:0" data-st="reset">Reset semua progres</button></div>';
}
document.addEventListener("click",e=>{
 const t=e.target.closest("#mbtn,[data-st]");if(!t)return;
 if(t.id==="mbtn")return go("menu");
 const a=t.dataset.st,box=$("#st-box"),manual=()=>toast("Salin teks di kotak secara manual");
 if(a==="theme")return $("#theme").click();
 if(a==="export"){box.value=JSON.stringify(allData());box.select();try{navigator.clipboard.writeText(box.value).then(()=>toast("Tersalin ke clipboard"),manual)}catch(x){manual()}return}
 if(a==="import"){
  try{const o=JSON.parse(box.value),ks=Object.keys(o);if(!ks.length||ks.some(k=>!k.startsWith(PFX)||typeof o[k]!=="string"))throw 0;ks.forEach(k=>localStorage.setItem(k,o[k]));toast("Progres diimpor. Memuat ulang...");setTimeout(()=>location.reload(),600)}
  catch(x){toast("Teks tidak valid. Tempel hasil Ekspor.")}
  return;
 }
 if(a==="reset"){if(t.dataset.arm){try{Object.keys(allData()).forEach(k=>localStorage.removeItem(k))}catch(x){}location.reload();return}t.dataset.arm="1";t.textContent="Yakin? Ketuk lagi untuk menghapus"}
});

export {renderMenu, PFX, allData};
