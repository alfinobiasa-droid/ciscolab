

const CATS=["Semua","Dasar Cisco","Switching & VLAN","Routing","Subnetting","Layanan","Keamanan","Linux","Troubleshooting"];

const PAGES=[
{k:"modul",i:"📚",t:"Modul"},{k:"trouble",i:"🔧",t:"Trouble",d:"Kasus troubleshooting: cari penyebab PC1 tidak bisa ping PC2."},
{k:"sandbox",i:"💻",t:"Sandbox",d:"Simulator CLI Cisco: enable, configure terminal, interface, ip address."},
{k:"quest",i:"🎯",t:"Quest",d:"Misi konfigurasi dengan hadiah XP."},{k:"kuis",i:"🏆",t:"Kuis",d:"Bank soal 100+ dengan soal acak dan skor."},
{k:"cheat",i:"📋",t:"Cheat",d:"Daftar command dengan tombol salin."},{k:"kamus",i:"📖",t:"Kamus",d:"Istilah jaringan: VLAN, OSPF, CIDR, NAT, dan lainnya."},
{k:"subnet",i:"🧮",t:"Subnet",d:"Kalkulator subnet dan konversi CIDR ↔ subnet mask."}
];

const store={
 get(k,f){try{const v=localStorage.getItem("netlab:"+k);return v?JSON.parse(v):f}catch(e){return f}},
 set(k,v){try{localStorage.setItem("netlab:"+k,JSON.stringify(v))}catch(e){}}
};
const LEVELS=[[0,"Network Rookie"],[100,"Cisco Learner"],[300,"Network Technician"],[600,"Routing Specialist"],[1000,"Network Engineer"]];
const levelOf=xp=>{let n=0;LEVELS.forEach((l,i)=>{if(xp>=l[0])n=i});return{n:n+1,name:LEVELS[n][1]}};

const S={cat:"Semua",q:"",page:location.hash.slice(1)||"modul",progress:store.get("progress",{}),xp:store.get("xp",0),streak:store.get("streak",0)};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const hl=(t,q)=>{t=esc(t);if(!q)return t;const r=new RegExp("("+q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","ig");return t.replace(r,"<mark>$1</mark>")};

function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2600)}

export {toast, CATS, PAGES, store, LEVELS, levelOf, S, $, esc, hl};
