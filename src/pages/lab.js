import {xpPop, dailyEvent, store, S, $, esc, quietly} from "../core.js";
import {go} from "../main.js";
import {withDevice, sbInit, sbRun, sbPrompt} from "../sim/engine.js";
import {RULES} from "./quest.js";
import {renderTrouble} from "./trouble.js";
import {topoSvg} from "./lesson.js";
import {has} from "./reference.js";

const LABS=[
{id:"e1",lvl:"Easy",title:"Interface router mati",dev:"router",sym:"PC1 tidak bisa menjangkau gateway 192.168.1.1.",nodes:[["PC1","pc"],["SW1","sw"],["R1","rt","bad"],["PC2","pc"]],
 setup:["enable","conf t","hostname R1","int g0/0","ip address 192.168.1.1 255.255.255.0","exit","int g0/1","ip address 10.0.0.1 255.255.255.252","no shutdown","end"],
 tools:["show ip interface brief","ping 192.168.1.10","show interfaces"],solved:{test:"iface",name:"GigabitEthernet0/0",up:true},hint:"Lihat kolom Status pada show ip interface brief.",
 exp:"Gi0/0 berstatus administratively down. Perbaikan: interface g0/0 lalu no shutdown."},
{id:"e2",lvl:"Easy",title:"IP gateway salah subnet",dev:"router",sym:"PC di LAN 192.168.1.0/24 tidak bisa di-ping dari R1.",nodes:[["PC1","pc"],["SW1","sw"],["R1","rt","bad"],["Server","srv"]],
 setup:["enable","conf t","hostname R1","int g0/0","ip address 192.168.2.1 255.255.255.0","no shutdown","exit","int g0/1","ip address 10.0.0.1 255.255.255.252","no shutdown","end"],
 tools:["show ip interface brief","ping 192.168.1.10"],solved:{test:"cmd_out",cmd:"ping 192.168.1.10",has:"!!!!!"},hint:"PC berada di 192.168.1.0/24. Apakah IP Gi0/0 sesuai?",
 exp:"Gi0/0 memakai 192.168.2.1/24, padahal LAN PC adalah 192.168.1.0/24. Perbaikan: ip address 192.168.1.1 255.255.255.0."},
{id:"m1",lvl:"Medium",title:"Internet tidak terjangkau",dev:"router",sym:"LAN bisa ping gateway, tetapi 8.8.8.8 tidak terjangkau.",nodes:[["PC1","pc"],["R1","rt","bad"],["ISP","rt"],["Internet","cloud"]],
 setup:["enable","conf t","hostname R1","int g0/0","ip address 192.168.1.1 255.255.255.0","no shutdown","exit","int g0/1","ip address 10.0.0.1 255.255.255.252","no shutdown","end"],
 tools:["ping 8.8.8.8","show ip route","traceroute 8.8.8.8"],solved:{test:"cmd_out",cmd:"ping 8.8.8.8",has:"!!!!!"},hint:"Gateway of last resort belum diatur.",
 exp:"R1 belum punya default route menuju ISP (10.0.0.2). Perbaikan: ip route 0.0.0.0 0.0.0.0 10.0.0.2 di global configuration."},
{id:"m2",lvl:"Medium",title:"Dua PC beda VLAN",dev:"switch",sym:"PC1 (Fa0/1) dan PC2 (Fa0/2) satu subnet, tetapi tidak bisa saling ping.",nodes:[["PC1","pc"],["SW1","sw","bad"],["PC2","pc"]],
 setup:["enable","conf t","hostname SW1","vlan 10","name Sales","vlan 20","name Admin","int fa0/1","switchport access vlan 10","int fa0/2","switchport access vlan 20","end"],
 tools:["show vlan brief","show running-config"],solved:{test:"ports_same_vlan",a:"FastEthernet0/1",b:"FastEthernet0/2"},hint:"Bandingkan VLAN pada Fa0/1 dan Fa0/2.",
 exp:"Fa0/2 berada di VLAN 20, sedangkan Fa0/1 di VLAN 10. Perbaikan: interface fa0/2 lalu switchport access vlan 10."},
{id:"h1",lvl:"Hard",title:"ACL memblokir seluruh LAN",dev:"router",sym:"Host 192.168.1.10 tidak bisa mengakses server 10.0.0.5.",nodes:[["PC1","pc"],["R1","rt","bad"],["Server","srv"]],
 setup:["enable","conf t","hostname R1","int g0/0","ip address 192.168.1.1 255.255.255.0","no shutdown","exit","int g0/1","ip address 10.0.0.1 255.255.255.0","no shutdown","exit","access-list 10 deny 192.168.1.0 0.0.0.255","access-list 10 permit any","int g0/1","ip access-group 10 out","end"],
 tools:["simulate 192.168.1.10 10.0.0.5 icmp","show access-lists","show running-config"],solved:{test:"cmd_out",cmd:"simulate 192.168.1.10 10.0.0.5 icmp",has:"DITERUSKAN"},hint:"Periksa ACL yang terpasang pada Gi0/1 dan aturannya.",
 exp:"ACL 10 menolak seluruh LAN 192.168.1.0/24 pada Gi0/1 (out). Perbaikan: interface g0/1 lalu no ip access-group 10 out, atau ubah ACL agar hanya host tertentu yang ditolak."}];
const LAB={on:false,id:null,obj:null,lines:[],solved:false,gain:false};
const LABDONE=store.get("labs",{});
const LCHIPS={router:["configure terminal","interface g0/0","interface g0/1","no shutdown","ip address ","no ip access-group 10 out","end"],switch:["configure terminal","interface fa0/1","interface fa0/2","switchport access vlan 10","end"]};
function labOpen(id){
 const sc=LABS.find(x=>x.id===id);
 LAB.id=id;LAB.obj={};LAB.solved=false;LAB.gain=false;
 sbInit(LAB.obj,sc.dev);
 quietly(()=>withDevice(LAB.obj,()=>sc.setup.forEach(c=>sbRun(c))));
 LAB.obj.seen={};LAB.lines=["Masalah: "+sc.sym,"Gunakan tombol alat atau ketik command untuk mendiagnosis dan memperbaiki."];
}
function labRun(cmd){
 const sc=LABS.find(x=>x.id===LAB.id);
 LAB.lines.push(...withDevice(LAB.obj,()=>[sbPrompt()+" "+cmd,...sbRun(cmd)]));
 if(!LAB.solved&&RULES[sc.solved.test](LAB.obj,sc.solved)){
  LAB.solved=true;LAB.gain=!LABDONE[sc.id];
  if(LAB.gain){LABDONE[sc.id]=true;store.set("labs",LABDONE);S.xp+=50;store.set("xp",S.xp);xpPop(50);dailyEvent("trouble")}
  return renderLab();
 }
 labDraw();
}
function labDraw(){
 const o=$("#lout");if(!o)return;
 o.innerHTML=LAB.lines.map(l=>`<div class="tl">${esc(l)||"&nbsp;"}</div>`).join("");
 $("#lp").textContent=withDevice(LAB.obj,sbPrompt);
 const t=$("#lterm");t.scrollTop=t.scrollHeight;
}
function renderLab(){
 const v=$("#view"),lvc={Easy:"#1a9b5c",Medium:"var(--orange)",Hard:"#d63c4f"};
 const tabs=`<div class="seg" style="margin-bottom:12px"><button class="chip" data-lab="cases" aria-pressed="false">Kasus</button><button class="chip" data-lab="home" aria-pressed="true">Lab Interaktif</button></div>`;
 if(!LAB.id){
  v.innerHTML=`<h1 class="pg" style="margin:4px 0 6px">Troubleshooting</h1>${tabs}<p style="color:var(--mute);margin:0 0 12px">Diagnosis perangkat di simulator. Temukan penyebabnya, perbaiki dengan command, dan dapatkan +50 XP.</p><div class="grid">${LABS.map(sc=>`<article class="mod" style="--c:${lvc[sc.lvl]}"><div><div class="n">${sc.lvl}</div><h3>${sc.title}</h3></div><p style="margin:0;color:var(--mute)">${sc.sym}</p><div class="meta"><span class="tag">${LABDONE[sc.id]?"Selesai ✓":"Belum selesai"}</span><span class="tag o">+50 XP</span></div><button class="go" data-lab="open" data-v="${sc.id}">${LABDONE[sc.id]?"Ulangi Lab":"Mulai Lab"}</button></article>`).join("")}</div>`;
  return;
 }
 const sc=LABS.find(x=>x.id===LAB.id),nodes=sc.nodes.map(n=>[n[0],n[1],n[2]==="bad"&&!LAB.solved?"bad":"ok"]);
 v.innerHTML=`<button class="chip" data-lab="home" style="margin-bottom:10px">← Semua lab</button><div class="qcard"><div class="qtop"><span>${sc.lvl}</span><span>${LAB.solved?"Selesai":"Sedang berjalan"}</span></div><h1 class="pg" style="margin:6px 0">${sc.title}</h1><p style="margin:0">${sc.sym}</p>${topoSvg(nodes)}
 ${LAB.solved?`<div role="status" class="fb ok"><b>✅ Problem solved!${LAB.gain?" +50 XP":""}</b><p>${esc(sc.exp)}</p></div>`:`<b>Alat diagnosis</b><div class="seg" style="margin:8px 0">${sc.tools.map(c=>`<button class="chip" data-lab="run" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>`}
 <div class="term" id="lterm" style="height:min(46vh,380px);margin-top:12px"><div id="lout"></div><label class="tin"><span id="lp"></span><input id="lcmd" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Command lab"></label></div>
 <div class="seg" style="margin-top:10px">${LCHIPS[sc.dev].map(c=>`<button class="chip" data-lab="fill" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>
 ${LAB.solved?"":`<button class="chip" data-lab="hint" style="margin-top:10px">Petunjuk</button>`}</div>`;
 labDraw();
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-lab]");if(!t)return;
 const a=t.dataset.lab,v=t.dataset.v;
 if(a==="cases"){LAB.on=false;LAB.id=null;return renderTrouble()}
 if(a==="home"){LAB.on=true;LAB.id=null;return renderLab()}
 if(a==="open"){LAB.on=true;labOpen(v);return renderLab()}
 if(a==="run")return labRun(v);
 if(a==="fill"){const i=$("#lcmd");i.value=v;i.focus();return}
 if(a==="hint"){LAB.lines.push("Petunjuk: "+LABS.find(x=>x.id===LAB.id).hint);labDraw()}
});
document.addEventListener("keydown",e=>{
 if(e.target.id!=="lcmd"||e.key!=="Enter")return;
 const v=e.target.value.trim();e.target.value="";if(v)labRun(v);
});

export {labOpen, labRun, labDraw, renderLab, LABS, LAB, LABDONE, LCHIPS};
