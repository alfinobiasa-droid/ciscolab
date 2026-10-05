import {toast, store, S, $, esc} from "../core.js";
import {pool} from "./quiz.js";
import {useDevice, lxInit, sbInit, sbReset, sbRun, RT, SW, LX, SB, LXHELP, LXCHIPS, CHIPS, HELP, sbPrompt, HELPSW, SWCHIPS} from "../sim/engine.js";
import {has} from "./reference.js";
import {devStatus, liveTopo, topoLegend} from "./netview.js";

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
 const sbs=$("#sbstat");if(sbs)sbs.innerHTML=sbStatus();
 const dk=SB.dev==="switch"?"sw":SB.dev==="linux"?"srv":"rt",db=$("#devbadge");if(db)db.innerHTML=(SB.dev==="linux"?"debian":SB.host)+" · "+(SB.dev==="linux"?"ONLINE":{ok:"ONLINE",warn:"WARNING",off:"OFFLINE"}[devStatus(SB,dk)]);
 const tp=$("#sbtopo");if(tp)tp.innerHTML=liveTopo(dk);
}
let LASTEX=null;
const CMDEX=[
 [/^enable secret/i,"enable secret","Password untuk masuk ke Privileged EXEC Mode.","Melindungi akses konfigurasi. Kata secret berarti password disimpan terenkripsi (hash), bukan teks biasa.","R1(config)# enable secret cisco123","Saat kamu mengetik enable, router meminta password."],
 [/^en(a(b(le?)?)?)?$/i,"enable","Naik dari User EXEC (>) ke Privileged EXEC (#).","Mode # dibutuhkan untuk show lengkap dan untuk masuk ke mode konfigurasi.","Router> enable","Prompt berubah menjadi Router#."],
 [/^conf\w*\s+t/i,"configure terminal","Masuk ke Global Configuration Mode.","Semua perubahan konfigurasi dimulai dari mode ini.","Router# configure terminal","Prompt berubah menjadi Router(config)#."],
 [/^hostname\s/i,"hostname","Mengubah nama perangkat Cisco.","Agar administrator mudah mengenali perangkat, misalnya R1, R2, R3.","Router(config)# hostname R1","Prompt berubah menjadi R1(config)#."],
 [/^int(erface)?\s+\S/i,"interface","Memilih interface yang ingin dikonfigurasi.","IP address dan status harus diatur pada interface tertentu.","R1(config)# interface gigabitEthernet 0/0","Prompt berubah menjadi R1(config-if)#."],
 [/^ip\s+address\s/i,"ip address","Memberikan alamat IP dan subnet mask kepada interface.","Agar interface bisa berkomunikasi di jaringan IP dan menjadi gateway LAN-nya.","R1(config-if)# ip address 192.168.1.1 255.255.255.0","Interface punya IP. Cek dengan show ip interface brief."],
 [/^no\s+shut/i,"no shutdown","Mengaktifkan interface.","Interface router Cisco secara default administratively down, jadi harus dinyalakan.","R1(config-if)# no shutdown","Muncul pesan changed state to up dan topologi berubah menjadi UP."],
 [/^shut/i,"shutdown","Mematikan interface secara administratif.","Dipakai saat perawatan atau untuk memutus link sementara.","R1(config-if)# shutdown","Status interface menjadi administratively down."],
 [/^line\s+con/i,"line console 0","Masuk ke pengaturan port console.","Port console bisa diakses secara fisik, jadi perlu diberi password.","R1(config)# line console 0","Prompt berubah menjadi R1(config-line)#."],
 [/^password\s/i,"password","Menetapkan password pada line yang sedang dipilih.","Melindungi akses lewat console atau vty.","R1(config-line)# password konsol1","Password tersimpan. Tambahkan login agar diminta."],
 [/^login$/i,"login","Mengaktifkan pemeriksaan password pada line.","Tanpa login, password yang sudah dibuat tidak pernah diminta.","R1(config-line)# login","Akses ke line sekarang meminta password."],
 [/^banner\s+motd/i,"banner motd","Membuat pesan yang tampil saat seseorang masuk ke perangkat.","Sebagai peringatan bahwa akses hanya untuk yang berwenang.","R1(config)# banner motd #Akses terbatas#","Pesan tampil sebelum prompt login."],
 [/^copy\s+r\w*\s+s/i,"copy running-config startup-config","Menyimpan konfigurasi yang berjalan (RAM) ke NVRAM.","Konfigurasi di RAM hilang saat perangkat mati atau reload.","R1# copy running-config startup-config","Muncul [OK] dan show startup-config berisi konfigurasi."],
 [/^sh\w*\s+ip\s+int\w*\s+b/i,"show ip interface brief","Menampilkan ringkasan IP dan status semua interface.","Cara tercepat memeriksa interface mana yang up atau down.","R1# show ip interface brief","Tabel interface, IP address, Status, dan Protocol."],
 [/^sh\w*\s+run/i,"show running-config","Menampilkan konfigurasi yang sedang berjalan.","Untuk memeriksa apakah command yang diketik sudah tersimpan benar.","R1# show running-config","Seluruh konfigurasi aktif ditampilkan."],
 [/^ip\s+route\s/i,"ip route","Membuat static route.","Agar router tahu jalur menuju jaringan yang tidak terhubung langsung.","R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.0.2","Route muncul dengan kode S di show ip route."],
 [/^vlan\s+\d+/i,"vlan","Membuat VLAN atau masuk ke konfigurasinya.","Memisahkan jaringan secara logis di switch yang sama.","Switch(config)# vlan 10","VLAN 10 muncul di show vlan brief."],
 [/^switchport\s/i,"switchport","Mengatur mode atau VLAN sebuah port switch.","Menentukan port sebagai access (satu VLAN) atau trunk (banyak VLAN).","Switch(config-if)# switchport access vlan 10","Port menjadi anggota VLAN yang dipilih."],
 [/^ping\s/i,"ping","Menguji apakah tujuan dapat dijangkau.","Langkah pertama troubleshooting konektivitas.","R1# ping 192.168.1.10","!!!!! berarti berhasil, ..... atau UUUUU berarti gagal."],
 [/^(exit|end)$/i,"exit / end","Keluar satu mode (exit) atau langsung ke Privileged EXEC (end).","Untuk berpindah mode dengan cepat.","R1(config-if)# end","Prompt berubah ke mode yang lebih tinggi."],
 [/^chmod\s/i,"chmod","Mengubah hak akses file atau direktori.","Mengatur siapa yang boleh membaca (r), menulis (w), dan menjalankan (x).","chmod 755 file.sh","Pemilik rwx, grup dan lainnya r-x."],
 [/^mkdir\s/i,"mkdir","Membuat direktori baru.","Untuk menata file dalam folder.","mkdir kebun_binatang","Direktori muncul di ls -l."]
];
const exHtml=e=>`<p class="lbl">Penjelasan command</p><b class="mono">${esc(e.t)}</b><p class="lbl sp">Apa itu?</p><p style="margin:0">${esc(e.what)}</p><p class="lbl sp">Kenapa digunakan?</p><p style="margin:0">${esc(e.why)}</p><p class="lbl sp">Contoh</p><pre class="code">${esc(e.ex)}</pre><p class="lbl sp">Hasil</p><p style="margin:0">${esc(e.res)}</p>`;
function showExplain(v){
 const m=CMDEX.find(x=>x[0].test(v.trim()));if(!m)return;
 LASTEX={t:m[1],what:m[2],why:m[3],ex:m[4],res:m[5]};
 const p=$("#cmdex");if(p){p.hidden=false;p.innerHTML=exHtml(LASTEX)}
}
const HINT={title:"",cmds:null};
function sbStatus(){
 const f=Object.values(SB.ifs||{}),up=f.filter(i=>i.up).length,k=SB.dev==="switch"?"sw":"rt";
 if(SB.dev==="linux")return `<span class="ok">● Shell ready</span><span>Commands ${SB.hist.length}</span><span>Users ${SB.users.length}</span>`;
 const st=devStatus(SB,k),lab={ok:"Network Healthy",warn:"Check interfaces",off:"Not configured"}[st];
 return `<span class="${st==="ok"?"ok":st==="warn"?"warn":""}">● ${lab}</span><span>Commands ${SB.hist.length}</span><span>Interfaces up ${up}/${f.length}</span><span>${SB.dev==="switch"?"VLANs "+Object.keys(SB.vlans).length:"Routes "+SB.routes.length}</span>`;
}
function renderSandbox(){
 const k=SB.dev==="switch"?"sw":SB.dev==="linux"?"srv":"rt";
 $("#view").innerHTML=`<div class="sb-head"><div><p class="crumb2">NETLAB / SANDBOX</p><h1 class="pg" style="margin:2px 0 0">Sandbox</h1></div><div class="devbadge" id="devbadge"></div></div>
 <div class="seg" style="margin:12px 0">${["router","switch","linux"].map(d=>`<button class="chip" data-sbact="dev-${d}" aria-pressed="${SB.dev===d}">${{router:"Router",switch:"Switch",linux:"Linux"}[d]}</button>`).join("")}</div>
 ${HINT.cmds&&HINT.cmds.length?`<div class="pan hintc" id="tryhint"><div class="lbl-row"><b>Latihan: ${esc(HINT.title)}</b><button class="chip s" data-sbact="hintx">Tutup</button></div><p class="muted" style="margin:6px 0">Coba jalankan command berikut satu per satu:</p><ol class="prac">${HINT.cmds.map(c=>`<li><code>${esc(c)}</code></li>`).join("")}</ol></div>`:""}
 <div class="sbx"><section class="pan"><p class="lbl">Network Topology</p><div id="sbtopo">${liveTopo(k)}</div>${topoLegend()}</section>
 <section class="pan"><div class="lbl-row"><p class="lbl">${SB.dev==="linux"?"Linux Terminal":"Cisco CLI"}</p><div class="tools"><button class="chip s" data-sbact="clear">Clear</button><button class="chip s" data-sbact="copy">Copy</button><button class="chip s" data-sbact="reset">Reset</button></div></div>
 <div class="term" id="term"><div id="tout"></div><label class="tin"><span id="tp"></span><input id="tcmd" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Command"></label></div>
 <div class="seg" style="margin-top:10px">${(SB.dev==="linux"?LXCHIPS:SB.dev==="switch"?SWCHIPS:CHIPS).map(c=>`<button class="chip" data-sb="${esc(c)}">${esc(c)}</button>`).join("")}<button class="chip" data-sbact="help">? Help</button></div>
 <p class="hint muted">Tab: autocomplete · ↑ ↓: history · Ping succeeds when the target is on a connected network or has a valid route.</p>
 <div class="pan flat cmdex" id="cmdex" ${LASTEX?"":"hidden"}>${LASTEX?exHtml(LASTEX):""}</div></section></div>
 <div class="statusbar" id="sbstat"></div>`;
 sbDraw();
}
document.addEventListener("keydown",e=>{
 if(e.target.id!=="tcmd")return;
 const i=e.target;
 if(e.key==="Enter"){
  const v=i.value;SB.lines.push(sbPrompt()+" "+v);
  if(v.trim().toLowerCase()==="clear")SB.lines=[];else SB.lines.push(...sbRun(v));
  showExplain(v);
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
  if(t.dataset.sbact==="hintx"){HINT.cmds=null;return renderSandbox()}
  if(t.dataset.sbact==="clear"){SB.lines=[];return sbDraw()}
  if(t.dataset.sbact==="copy"){try{navigator.clipboard.writeText(SB.lines.join("\n")).then(()=>toast("Terminal copied"),()=>toast("Copy failed"))}catch(x){toast("Copy failed")}return}
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

export {sbComplete, sbDraw, showExplain, sbStatus, renderSandbox, CMDLIST, LASTEX, CMDEX, exHtml, HINT, pk, sbSave};
