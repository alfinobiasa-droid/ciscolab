import {S, $} from "../core.js";
import {L, pool} from "../pages/quiz.js";
import {isIp, ip2n, validMask, maskLen, netOf, sameNet, pad} from "./net.js";
import {wild} from "../pages/subnet.js";

const RT={},SW={};let SB=RT;
function useDevice(d){SB=d==="switch"?SW:RT}
const CHIPS=["enable","configure terminal","hostname R1","interface g0/0","ip address 192.168.1.1 255.255.255.0","no shutdown","exit","end","show ip interface brief","show ip route","ip route 0.0.0.0 0.0.0.0 192.168.1.254","ping 192.168.1.1","enable secret cisco123","line console 0","password konsol1","login","banner motd #Akses terbatas#","copy running-config startup-config","ip dhcp pool LAN1","network 192.168.1.0 255.255.255.0","default-router 192.168.1.1","ip nat inside","ip nat outside","access-list 10 deny 192.168.1.50","access-list 10 permit any","ip access-group 10 out","access-list 100 deny tcp any any eq 80","access-list 100 permit ip any any","ip access-group 100 in","simulate 192.168.1.10 10.0.0.5 tcp 80","show running-config"];
const HELP=["Command yang didukung:","  enable, disable, configure terminal, exit, end","  hostname <nama>, interface <g0/0>, ip address <ip> <mask>","  no shutdown, shutdown, ip route <net> <mask> <next-hop>","  show running-config, show ip interface brief, show ip route","  enable secret <pw>, banner motd #pesan#, line console 0, password <pw>, login","  copy running-config startup-config, no ip address","  ip dhcp excluded-address, ip dhcp pool, network, default-router, dns-server","  ip nat inside|outside, ip nat inside source list N interface X overload","  access-list N permit|deny <src>, ip access-group N in|out, show access-lists","  access-list 100 permit|deny <ip|icmp|tcp|udp> <src> <dst> [eq port] (extended)","  simulate <src> <dst> [icmp|tcp|udp] [port]  (uji ACL, khusus simulator)","  ping <ip>, do <show ...>, clear"];

const conn=()=>Object.entries(SB.ifs).filter(([,v])=>v.up&&v.ip).map(([name,v])=>({name,ip:v.ip,mask:v.mask}));
const sbPrompt=()=>SB.host+({user:">",priv:"#",config:"(config)#",if:"(config-if)#",vlan:"(config-vlan)#",line:"(config-line)#",dhcp:"(dhcp-config)#"})[SB.mode];
const HELPSW=["Command yang didukung (Switch):","  enable, disable, configure terminal, exit, end, hostname <nama>","  vlan <id>, name <nama>, no vlan <id>","  interface <fa0/1 | g0/1>, shutdown, no shutdown","  switchport mode <access|trunk>, switchport access vlan <id>","  switchport trunk native vlan <id>, switchport trunk allowed vlan <daftar>","  show vlan brief, show interfaces trunk, show running-config","  enable secret <pw>, banner motd #pesan#, copy running-config startup-config","  do <show ...>, clear"];
const SWCHIPS=["enable","configure terminal","vlan 10","name Sales","vlan 20","interface fa0/1","switchport mode access","switchport access vlan 10","interface g0/1","switchport mode trunk","end","show vlan brief","show interfaces trunk"];
const short=n=>n.replace("FastEthernet","Fa").replace("GigabitEthernet","Gi");

function sbInit(o,dev){
 const sw=dev==="switch",ifc=()=>({ip:"",mask:"",up:false,nat:"",acl:{}}),port=()=>({up:true,mode:"access",vlan:1,native:1,allowed:"all"}),ifs={};
 if(sw)["FastEthernet0/1","FastEthernet0/2","FastEthernet0/3","FastEthernet0/4","GigabitEthernet0/1"].forEach(k=>ifs[k]=port());
 else["GigabitEthernet0/0","GigabitEthernet0/1"].forEach(k=>ifs[k]=ifc());
 Object.assign(o,{dev,host:sw?"Switch":"Router",mode:"user",cur:null,curV:null,routes:[],seen:{},hist:[],hi:0,vlans:{1:{name:"default"}},secret:"",banner:"",con:{pw:"",login:false},saved:false,dhcp:{ex:[],pools:{}},curP:null,nat:[],acls:{},ifs,lines:[`Simulator ${sw?"Switch":"Router"}. Ketik ? untuk bantuan.`]});
}
function sbReset(){sbInit(SB,SB.dev)}
function swVlans(){
 const rows=Object.entries(SB.vlans).sort((a,b)=>a[0]-b[0]).map(([id,v])=>pad(id,5)+pad(v.name,33)+pad("active",10)+Object.entries(SB.ifs).filter(([,p])=>p.mode==="access"&&p.vlan==id).map(([k])=>short(k)).join(", "));
 return[pad("VLAN",5)+pad("Name",33)+pad("Status",10)+"Ports","---- -------------------------------- --------- -------------------------------",...rows];
}
function swTrunk(){
 const t=Object.entries(SB.ifs).filter(([,p])=>p.mode==="trunk");
 if(!t.length)return[];
 return[pad("Port",12)+pad("Mode",8)+pad("Encapsulation",15)+pad("Status",14)+"Native vlan",...t.map(([k,p])=>pad(short(k),12)+pad("on",8)+pad("802.1q",15)+pad(p.up?"trunking":"not-trunking",14)+p.native),"",pad("Port",12)+"Vlans allowed on trunk",...t.map(([k,p])=>pad(short(k),12)+(p.allowed==="all"?"1-4094":p.allowed))];
}
function swConfig(){
 const o=["Building configuration...","","Current configuration:","!","hostname "+SB.host,"!"];
 secLines(o);
 Object.entries(SB.vlans).filter(([id])=>id!=="1").forEach(([id,v])=>o.push("vlan "+id," name "+v.name,"!"));
 Object.entries(SB.ifs).forEach(([k,p])=>{
  o.push("interface "+k);
  if(p.mode==="trunk"){o.push(" switchport mode trunk");if(p.native!==1)o.push(" switchport trunk native vlan "+p.native);if(p.allowed!=="all")o.push(" switchport trunk allowed vlan "+p.allowed)}
  else{if(p.vlan!==1)o.push(" switchport access vlan "+p.vlan);o.push(" switchport mode access")}
  if(!p.up)o.push(" shutdown");
  o.push("!");
 });
 return[...o,"end"];
}
const PORTS={www:80,http:80,https:443,ftp:21,telnet:23,ssh:22,domain:53,smtp:25};
const spec=(w,i)=>w[i]==="any"?[{any:1},i+1]:w[i]==="host"&&isIp(w[i+1])?[{ip:w[i+1],wild:"0.0.0.0"},i+2]:isIp(w[i])?(isIp(w[i+1])?[{ip:w[i],wild:w[i+1]},i+2]:[{ip:w[i],wild:"0.0.0.0"},i+1]):null;
const specTxt=s=>s.any?"any":s.wild==="0.0.0.0"?"host "+s.ip:s.ip+" "+s.wild;
const specHit=(s,ip)=>!!s.any||((((ip2n(ip)^ip2n(s.ip))&~ip2n(s.wild))>>>0)===0);
function aclEval(id,p){
 for(const e of SB.acls[id]||[]){
  const hit=e.proto?((e.proto==="ip"||e.proto===p.proto)&&specHit(e.src,p.src)&&specHit(e.dst,p.dst)&&(!e.port||e.port===p.port)):specHit(e.src,p.src);
  if(hit)return{ok:e.act==="permit",line:e.act+" "+e.txt};
 }
 return{ok:false,line:"deny any (implisit)"};
}
function sbSim(w){
 SB.seen.sim=true;
 const[,s,d,pr="icmp",pt]=w;
 if(!isIp(s)||!isIp(d)||!["icmp","tcp","udp","ip"].includes(pr))return["% Pemakaian: simulate <src> <dst> [icmp|tcp|udp] [port]"];
 const p={src:s,dst:d,proto:pr,port:pt?(PORTS[pt]||+pt):0},c=conn(),head="Simulasi paket "+s+" -> "+d+" ("+pr+(p.port?" "+p.port:"")+")";
 const inI=c.find(x=>sameNet(x.ip,s,x.mask));
 if(!inI)return[head,"Hasil : DIBUANG, sumber tidak berada di jaringan yang terhubung ke router."];
 let outI=c.find(x=>sameNet(x.ip,d,x.mask)),via="terhubung langsung";
 if(!outI){const r=SB.routes.filter(r=>netOf(d,r.mask)===r.net&&c.some(x=>sameNet(x.ip,r.nh,x.mask))).sort((a,b)=>maskLen(b.mask)-maskLen(a.mask))[0];if(r){outI=c.find(x=>sameNet(x.ip,r.nh,x.mask));via="via "+r.nh}}
 if(!outI)return[head,"Masuk : "+short(inI.name),"Hasil : DIBUANG, tidak ada route ke "+d];
 const chk=(f,dir)=>{const id=(SB.ifs[f.name].acl||{})[dir];return id?{id,...aclEval(id,p)}:null},a=chk(inI,"in"),b=chk(outI,"out");
 const t=(x,dir)=>x?" (ACL "+x.id+" "+dir+": "+(x.ok?"lolos":"ditolak")+")":" (tanpa ACL)";
 const bl=a&&!a.ok?[a,short(inI.name),"in"]:b&&!b.ok?[b,short(outI.name),"out"]:null;
 return[head,"Masuk : "+short(inI.name)+t(a,"in"),"Keluar: "+short(outI.name)+" ("+via+")"+t(b,"out"),bl?"Hasil : DIBLOKIR oleh ACL "+bl[0].id+" pada "+bl[1]+" ("+bl[2]+"), aturan: "+bl[0].line:"Hasil : DITERUSKAN"];
}
const sbAcls=()=>Object.entries(SB.acls).flatMap(([id,r])=>[(id>=100?"Extended":"Standard")+" IP access list "+id,...r.map((x,i)=>"    "+(i+1)*10+" "+x.act+"   "+x.txt)]);
const svcLines=o=>{
 SB.dhcp.ex.forEach(e=>o.push("ip dhcp excluded-address "+e[0]+(e[1]!==e[0]?" "+e[1]:"")));
 Object.entries(SB.dhcp.pools).forEach(([k,p])=>o.push("ip dhcp pool "+k,p.net?" network "+p.net+" "+p.mask:false,p.gw?" default-router "+p.gw:false,p.dns?" dns-server "+p.dns:false,"!"));
 SB.nat.forEach(r=>o.push("ip nat inside source list "+r.acl+" interface "+r.ifc+" overload"));
 Object.entries(SB.acls).forEach(([id,r])=>r.forEach(x=>o.push("access-list "+id+" "+x.act+" "+x.txt)));
};
const secLines=o=>{
 if(SB.secret)o.push("enable secret 5 ********","!");
 if(SB.banner)o.push("banner motd ^C"+SB.banner+"^C","!");
 if(SB.con.pw||SB.con.login)o.push("line con 0"," password "+SB.con.pw,SB.con.login?" login":false,"!");
};
function sbBrief(){
 return [pad("Interface",27)+pad("IP-Address",16)+pad("OK?",5)+pad("Method",7)+pad("Status",23)+"Protocol",
 ...Object.entries(SB.ifs).map(([k,v])=>pad(k,27)+pad(v.ip||"unassigned",16)+pad("YES",5)+pad(v.ip?"manual":"unset",7)+pad(v.up?"up":"administratively down",23)+(v.up?"up":"down"))];
}
function sbRoutes(){
 SB.seen.route=true;const c=conn(),st=SB.routes.filter(r=>c.some(x=>sameNet(x.ip,r.nh,x.mask)));
 const isDef=r=>r.net==="0.0.0.0"&&r.mask==="0.0.0.0",def=st.find(isDef);
 const o=["Codes: C - connected, S - static, L - local, * - candidate default","",def?`Gateway of last resort is ${def.nh} to network 0.0.0.0`:"Gateway of last resort is not set",""];
 c.forEach(x=>{o.push(`C    ${netOf(x.ip,x.mask)}/${maskLen(x.mask)} is directly connected, ${x.name}`);o.push(`L    ${x.ip}/32 is directly connected, ${x.name}`)});
 st.forEach(r=>o.push(`${isDef(r)?"S*":"S "}   ${r.net}/${maskLen(r.mask)} [1/0] via ${r.nh}`));
 return o;
}
function sbConfig(){
 if(SB.dev==="switch")return swConfig();
 const o=["Building configuration...","","Current configuration:","!","hostname "+SB.host,"!"];
 secLines(o);
 Object.entries(SB.ifs).forEach(([k,v])=>o.push("interface "+k,v.ip?` ip address ${v.ip} ${v.mask}`:" no ip address",v.up?false:" shutdown",v.nat?" ip nat "+v.nat:false,...Object.entries(v.acl||{}).map(([d,id])=>" ip access-group "+id+" "+d),"!"));
 svcLines(o);
 SB.routes.forEach(r=>o.push(`ip route ${r.net} ${r.mask} ${r.nh}`));
 return [...o,"!","end"].filter(l=>l!==false);
}
function sbPing(t){
 if(!isIp(t))return["% Unrecognized host or address, or protocol not running."];
 const c=conn(),ok=c.some(x=>x.ip===t||sameNet(x.ip,t,x.mask))||SB.routes.some(r=>c.some(x=>sameNet(x.ip,r.nh,x.mask))&&netOf(t,r.mask)===r.net);
 return["Type escape sequence to abort.",`Sending 5, 100-byte ICMP Echos to ${t}, timeout is 2 seconds:`,ok?"!!!!!":"UUUUU",ok?"Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms":"Success rate is 0 percent (0/5)"];
}
function sbRun(line){
 const w=line.trim().split(/\s+/).filter(Boolean);if(!w.length)return[];
 const c0=w[0].toLowerCase(),n=w.length,M=SB.mode,cfg=M==="config"||M==="if"||M==="vlan"||M==="line"||M==="dhcp",show=M==="user"||M==="priv";
 const m=(i,word,min=1)=>!!w[i]&&w[i].length>=min&&word.startsWith(w[i].toLowerCase());
 const bad="% Invalid input detected at '^' marker.";
 if(c0==="?"||c0==="help")return SB.dev==="switch"?HELPSW:HELP;
 if(c0==="do"&&cfg&&n>1){SB.mode="priv";const o=sbRun(w.slice(1).join(" "));SB.mode=M;return o}
 if(c0==="end"&&cfg&&n===1){SB.mode="priv";SB.cur=null;return[]}
 if(m(0,"enable",3)&&M==="user"&&n===1){SB.mode="priv";return[]}
 if(m(0,"disable",3)&&M==="priv"&&n===1){SB.mode="user";return[]}
 if(m(0,"configure",4)&&m(1,"terminal")&&M==="priv"&&n===2){SB.mode="config";return["Enter configuration commands, one per line.  End with CNTL/Z."]}
 if(c0==="exit"&&n===1){if(M==="if"||M==="vlan"||M==="line"||M==="dhcp"){SB.mode="config";SB.cur=null}else if(M==="config")SB.mode="priv";else if(M==="priv")SB.mode="user";return[]}
 if(m(0,"hostname",4)&&cfg&&n===2){if(!/^[A-Za-z][\w-]{0,62}$/.test(w[1]))return["% Invalid hostname"];SB.host=w[1];SB.mode="config";SB.cur=null;return[]}
 if(m(0,"interface",3)&&cfg&&n>=2){
  const mm=w.slice(1).join("").match(/^(g|gi|gig|gigabit|gigabitethernet|f|fa|fast|fastethernet)(\d+\/\d+)$/i),nm=mm&&(/^g/i.test(mm[1])?"GigabitEthernet":"FastEthernet")+mm[2];
  if(!nm||!SB.ifs[nm])return["% Invalid interface. Contoh: g0/1 atau fa0/1"];
  SB.mode="if";SB.cur=nm;return[];
 }
 if(SB.dev==="router"&&M==="if"&&c0==="ip"&&m(1,"address",2)&&n===4){
  if(!isIp(w[2])||!validMask(w[3]))return[bad];
  Object.assign(SB.ifs[SB.cur],{ip:w[2],mask:w[3]});return[];
 }
 if(M==="if"&&c0==="no"&&m(1,"shutdown",3)&&n===2){
  const i=SB.ifs[SB.cur],was=i.up;i.up=true;
  return was?[]:[`%LINK-5-CHANGED: Interface ${SB.cur}, changed state to up`,`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${SB.cur}, changed state to up`];
 }
 if(M==="if"&&m(0,"shutdown",3)&&n===1){
  SB.ifs[SB.cur].up=false;
  return[`%LINK-5-CHANGED: Interface ${SB.cur}, changed state to administratively down`,`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${SB.cur}, changed state to down`];
 }
 if(SB.dev==="router"&&cfg&&c0==="ip"&&m(1,"route",2)&&n===5){
  const[,,a,mk,nh]=w;if(!isIp(a)||!validMask(mk)||!isIp(nh))return[bad];
  const r={net:netOf(a,mk),mask:mk,nh};
  if(!SB.routes.some(x=>x.net===r.net&&x.mask===r.mask&&x.nh===r.nh))SB.routes.push(r);
  SB.mode="config";SB.cur=null;return[];
 }
 if(cfg){
  if(c0==="enable"&&m(1,"secret",3)&&n===3){SB.secret=w[2];SB.mode="config";return[]}
  if(c0==="banner"&&m(1,"motd",2)&&n>=3){
   const t=line.trim().replace(/^\S+\s+\S+\s*/,""),e=t.lastIndexOf(t[0]);
   if(t.length<3||e<1)return["% Format: banner motd #pesan#"];
   SB.banner=t.slice(1,e);SB.mode="config";return[];
  }
  if(c0==="line"&&m(1,"console",3)&&n===3&&w[2]==="0"){SB.mode="line";return[]}
 }
 if(M==="line"){
  if(c0==="password"&&n===2){SB.con.pw=w[1];return[]}
  if(c0==="login"&&n===1){SB.con.login=true;return[]}
 }
 if(SB.dev==="router"){
  if(c0==="simulate"&&show)return sbSim(w);
  if(cfg&&c0==="ip"&&m(1,"dhcp",2)){
   if(m(2,"excluded-address",3)&&(n===4||n===5)&&isIp(w[3])&&(n===4||isIp(w[4]))){SB.dhcp.ex.push([w[3],w[4]||w[3]]);SB.mode="config";return[]}
   if(m(2,"pool",2)&&n===4){SB.dhcp.pools[w[3]]=SB.dhcp.pools[w[3]]||{net:"",mask:"",gw:"",dns:""};SB.curP=w[3];SB.mode="dhcp";return[]}
  }
  if(M==="dhcp"){
   const p=SB.dhcp.pools[SB.curP];
   if(c0==="network"&&n===3&&isIp(w[1])&&validMask(w[2])){p.net=netOf(w[1],w[2]);p.mask=w[2];return[]}
   if(m(0,"default-router",3)&&n===2&&isIp(w[1])){p.gw=w[1];return[]}
   if(m(0,"dns-server",3)&&n===2&&isIp(w[1])){p.dns=w[1];return[]}
  }
  if(M==="if"&&c0==="ip"&&m(1,"nat",2)&&n===3&&(w[2]==="inside"||w[2]==="outside")){SB.ifs[SB.cur].nat=w[2];return[]}
  if(M==="if"&&c0==="ip"&&m(1,"access-group",3)&&n===4&&/^(in|out)$/i.test(w[3])){const i=SB.ifs[SB.cur];i.acl=i.acl||{};i.acl[w[3].toLowerCase()]=w[2];return[]}
  if(cfg&&c0==="ip"&&m(1,"nat",2)&&m(2,"inside",2)&&m(3,"source",2)&&m(4,"list",2)&&m(6,"interface",3)&&n===9&&w[8].toLowerCase()==="overload"){SB.nat.push({acl:w[5],ifc:w[7]});SB.mode="config";return[]}
  if(cfg&&c0==="access-list"&&/^\d+$/.test(w[1])&&(w[2]==="permit"||w[2]==="deny")){
   const id=+w[1];let e=null;
   if(id>=1&&id<=99){const s=spec(w,3);if(s&&s[1]===n)e={act:w[2],src:s[0],txt:specTxt(s[0])}}
   else if(id>=100&&id<=199&&["ip","icmp","tcp","udp"].includes(w[3])){
    const s=spec(w,4),d=s&&spec(w,s[1]);
    if(d){let i=d[1],port=0;if(w[i]==="eq"&&w[i+1]){port=PORTS[w[i+1]]||+w[i+1];i+=2}
     if(i===n&&(!port||w[3]==="tcp"||w[3]==="udp"))e={act:w[2],proto:w[3],src:s[0],dst:d[0],port,txt:w[3]+" "+specTxt(s[0])+" "+specTxt(d[0])+(port?" eq "+port:"")}}
   }
   if(!e)return[bad];
   (SB.acls[id]=SB.acls[id]||[]).push(e);SB.mode="config";return[];
  }
 }
 if(M==="if"&&SB.dev==="router"&&c0==="no"&&m(1,"ip",2)&&m(2,"address",2)&&n===3){Object.assign(SB.ifs[SB.cur],{ip:"",mask:""});return[]}
 if(M==="priv"&&m(0,"copy",2)&&m(1,"running-config",3)&&m(2,"startup-config",3)&&n===3){SB.saved=true;return["Destination filename [startup-config]?","Building configuration...","[OK]"]}
 if(SB.dev==="switch"){
  if(cfg&&c0==="vlan"&&n===2){const v=+w[1];if(!(v>=1&&v<=4094))return[bad];SB.vlans[v]=SB.vlans[v]||{name:"VLAN"+String(v).padStart(4,"0")};SB.mode="vlan";SB.curV=v;return[]}
  if(M==="vlan"&&c0==="name"&&n===2){SB.vlans[SB.curV].name=w[1];return[]}
  if(cfg&&c0==="no"&&m(1,"vlan")&&n===3){const v=+w[2];if(v===1)return["% Default VLAN 1 may not be deleted."];delete SB.vlans[v];SB.mode="config";return[]}
  if(M==="if"&&m(0,"switchport",3)){
   const i=SB.ifs[SB.cur],a=w.slice(1).map(x=>x.toLowerCase());
   if(a[0]==="mode"&&n===3&&(a[1]==="access"||a[1]==="trunk")){i.mode=a[1];return[]}
   if(a[0]==="access"&&a[1]==="vlan"&&n===4){
    const v=+w[3];if(!(v>=1&&v<=4094))return[bad];
    i.vlan=v;
    if(!SB.vlans[v]){SB.vlans[v]={name:"VLAN"+String(v).padStart(4,"0")};return["% Access VLAN does not exist. Creating vlan "+v]}
    return[];
   }
   if(a[0]==="trunk"&&a[1]==="native"&&a[2]==="vlan"&&n===5){i.native=+w[4];return[]}
   if(a[0]==="trunk"&&a[1]==="allowed"&&a[2]==="vlan"&&n===5){i.allowed=w[4];return[]}
  }
 }
 if(m(0,"show",2)&&show){
  if(SB.dev==="switch"&&m(1,"vlan",2)&&m(2,"brief")&&n===3)return swVlans();
  if(SB.dev==="switch"&&m(1,"interfaces",3)&&m(2,"trunk",2)&&n===3)return swTrunk();
  if(SB.dev==="router"&&m(1,"ip",2)&&m(2,"nat",2)&&m(3,"translations",3)&&n===4)return["Pro Inside global      Inside local       Outside local      Outside global"];
  if(SB.dev==="router"&&m(1,"ip",2)&&m(2,"dhcp",2)&&m(3,"binding",3)&&n===4)return["IP address       Client-ID/Hardware address    Lease expiration        Type"];
  if(SB.dev==="router"&&m(1,"access-lists",3)&&n===2)return sbAcls();
  if(SB.dev==="router"&&m(1,"ip",2)&&m(2,"interface",3)&&m(3,"brief")&&n===4)return sbBrief();
  if(SB.dev==="router"&&m(1,"ip",2)&&m(2,"route",3)&&n===3)return sbRoutes();
  if(M==="priv"&&m(1,"running-config",3)&&n===2)return sbConfig();
 }
 if(SB.dev==="router"&&m(0,"ping",3)&&show&&n===2)return sbPing(w[1]);
 const known=["enable","disable","configure","hostname","interface","ip","no","show","ping","exit","end","shutdown"];
 return[c0.length>=2&&known.some(k=>k.startsWith(c0))?bad:"Command not supported in simulator."];
}

export {useDevice, sbInit, sbReset, swVlans, swTrunk, swConfig, aclEval, sbSim, sbBrief, sbRoutes, sbConfig, sbPing, sbRun, RT, SW, SB, CHIPS, HELP, conn, sbPrompt, HELPSW, SWCHIPS, short, PORTS, spec, specTxt, specHit, sbAcls, svcLines, secLines};
