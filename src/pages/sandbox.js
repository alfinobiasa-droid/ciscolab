import {store, $, esc} from "../core.js";
import {pool} from "./quiz.js";
import {useDevice, lxInit, sbInit, sbReset, sbRun, RT, SW, LX, SB, LXHELP, LXCHIPS, CHIPS, HELP, sbPrompt, HELPSW, SWCHIPS} from "../sim/engine.js";

const CMDLIST={
 "r:user":"enable|ping |traceroute |show ip interface brief|show ip route|show interfaces|show ip protocols|simulate ",
 "r:priv":"disable|configure terminal|ping |traceroute |show running-config|show startup-config|show ip interface brief|show ip route|show interfaces|show ip protocols|show access-lists|copy running-config startup-config|simulate |exit",
 "r:config":"hostname |interface |ip route |no ip route |ip dhcp pool |ip dhcp excluded-address |ip nat inside source list |access-list |no access-list |router rip|router ospf |router eigrp |enable secret |banner motd |line console 0|do show |end|exit",
 "r:if":"ip address |no ip address|no shutdown|shutdown|ip nat inside|ip nat outside|ip access-group |no ip access-group |exit|end",
 "r:line":"password |login|exit|end","r:router":"network |version 2|no auto-summary|router-id |passive-interface |exit|end","r:dhcp":"network |default-router |dns-server |exit|end",
 "s:user":"enable|show vlan brief|show interfaces trunk","s:priv":"disable|configure terminal|show vlan brief|show interfaces trunk|show interfaces|show running-config|show startup-config|copy running-config startup-config",
 "s:config":"hostname |vlan |no vlan |interface |enable secret |banner motd |line console 0|do show |end|exit",
 "s:if":"switchport mode access|switchport mode trunk|switchport access vlan |switchport trunk native vlan |switchport trunk allowed vlan |shutdown|no shutdown|exit|end","s:vlan":"name |exit|end","s:line":"password |login|exit|end",
 "l":"pwd|cd |ls |ls -l |mkdir |touch |cp |cp -r |mv |rm |rm -r |rmdir |chmod |chown |useradd |passwd|whoami|cat |help|clear"};
function sbComplete(inp){
 const v=inp.value.replace(/^\s+/,""),low=v.toLowerCase();
 const list=(CMDLIST[SB.dev==="linux"?"l":(SB.dev==="switch"?"s":"r")+":"+SB.mode]||"").split("|").filter(Boolean);
 const c=list.filter(x=>x.startsWith(low));
 if(!c.length)return;
 if(c.length===1){inp.value=c[0];return}
 let p=c[0];c.forEach(x=>{while(!x.startsWith(p))p=p.slice(0,-1)});
 if(p.length>v.length)inp.value=p;
 else{SB.lines.push(sbPrompt()+" "+v,c.map(x=>x.trim()).join("   "));sbDraw()}
}
function sbDraw(){
 $("#tout").innerHTML=SB.lines.map(l=>`<div class="tl">${esc(l)||"&nbsp;"}</div>`).join("");
 $("#tp").textContent=sbPrompt();
 const t=$("#term");t.scrollTop=t.scrollHeight;
}
function renderSandbox(){
 $("#view").innerHTML=`<h1 class="pg" style="margin:4px 0 6px">Sandbox CLI</h1><div class="seg" style="margin-bottom:10px"><button class="chip" data-sbact="dev-router" aria-pressed="${SB.dev==="router"}">Router</button><button class="chip" data-sbact="dev-switch" aria-pressed="${SB.dev==="switch"}">Switch</button><button class="chip" data-sbact="dev-linux" aria-pressed="${SB.dev==="linux"}">Linux</button></div>
 <p style="color:var(--mute);margin:0 0 12px">Simulator sederhana, bukan Cisco IOS asli. Ketuk command untuk mengisinya ke terminal, lalu tekan Enter. Ping dianggap berhasil bila tujuan ada di jaringan yang terhubung atau punya static route valid.</p>
 <div class="term" id="term"><div id="tout"></div><label class="tin"><span id="tp"></span><input id="tcmd" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Command Cisco"></label></div>
 <div class="seg">${(SB.dev==="linux"?LXCHIPS:SB.dev==="switch"?SWCHIPS:CHIPS).map(c=>`<button class="chip" data-sb="${esc(c)}">${esc(c)}</button>`).join("")}<button class="chip" data-sbact="help">? Bantuan</button><button class="chip" data-sbact="reset">↺ Reset</button></div>`;
 sbDraw();
}
document.addEventListener("keydown",e=>{
 if(e.target.id!=="tcmd")return;
 const i=e.target;
 if(e.key==="Enter"){
  const v=i.value;SB.lines.push(sbPrompt()+" "+v);
  if(v.trim().toLowerCase()==="clear")SB.lines=[];else SB.lines.push(...sbRun(v));
  if(v.trim())SB.hist.push(v);
  SB.hi=SB.hist.length;i.value="";sbSave();sbDraw();
 }else if(e.key==="ArrowUp"){e.preventDefault();if(SB.hi>0)i.value=SB.hist[--SB.hi]||""}
 else if(e.key==="ArrowDown"){e.preventDefault();if(SB.hi<SB.hist.length-1)i.value=SB.hist[++SB.hi];else{SB.hi=SB.hist.length;i.value=""}}
 else if(e.key==="Tab"){e.preventDefault();sbComplete(i)}
});
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-sb],[data-sbact]");
 if(t){
  if(t.dataset.sbact==="reset"){sbReset();sbSave();return renderSandbox()}
  if(t.dataset.sbact==="help"){SB.lines.push(sbPrompt()+" ?",...(SB.dev==="linux"?LXHELP:SB.dev==="switch"?HELPSW:HELP));return sbDraw()}
  if(t.dataset.sbact.slice(0,4)==="dev-"){useDevice(t.dataset.sbact.slice(4));sbSave();return renderSandbox()}
  const i=$("#tcmd");i.value=t.dataset.sb;i.focus();return;
 }
 if(e.target.closest("#term")&&!getSelection().toString())$("#tcmd").focus();
});
const pk=o=>({host:o.host,mode:o.mode,cur:o.cur,curV:o.curV,routes:o.routes,ifs:o.ifs,vlans:o.vlans,seen:o.seen,secret:o.secret,banner:o.banner,con:o.con,saved:o.saved,startup:o.startup,dhcp:o.dhcp,curP:o.curP,nat:o.nat,acls:o.acls,rp:o.rp,os:o.os,ei:o.ei,proto:o.proto,fs:o.fs,cwd:o.cwd,users:o.users});
const sbSave=()=>store.set("sb2",{rt:pk(RT),sw:pk(SW),lx:pk(LX),dev:SB.dev});
sbInit(RT,"router");sbInit(SW,"switch");lxInit(LX);
{const old=store.get("sb",null),sv=store.get("sb2",null);
 if(old)Object.assign(RT,old);
 if(sv){Object.assign(RT,sv.rt);Object.assign(SW,sv.sw);if(sv.lx)Object.assign(LX,sv.lx);useDevice(sv.dev)}}

export {sbComplete, sbDraw, renderSandbox, CMDLIST, pk, sbSave};
