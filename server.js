/* كلمات — الإضافة الأولى: شاشة رئيسية بمقاس فيسبوك + قسم الاقتراحات (أشخاص + مواقع ومنصات)
   ملف مستقل: لا يغيّر index.htm إلا بسطر واحد في آخره. */
import{getApps,getApp}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import{getFirestore,doc,getDoc,setDoc,addDoc,collection,query,where,orderBy,limit,getDocs,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const MAX_SECTIONS=12,MAX_SITES=60,PEOPLE_TTL=30*60*1000,SITES_TTL=10*60*1000;
const Q=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:[];
const safeImg=v=>{v=String(v||"");return /^(https:\/\/|data:image\/(jpeg|png|webp|gif);base64,)/i.test(v)?v:""};
const safeLink=v=>{try{const u=new URL(String(v||"").trim());return u.protocol==="https:"?u.href:""}catch{return""}};
const DEF="data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="50" fill="#dbeafe"/><circle cx="50" cy="36" r="19" fill="#0284c7"/><path d="M15 100c2-26 17-38 35-38s33 12 35 38" fill="#0284c7"/></svg>');
const uid8=()=>Math.random().toString(36).slice(2,9);
const online=()=>navigator.onLine!==false;
let tT=null;
function toast(s){const t=Q("#toast");if(!t)return;t.textContent=s;t.classList.remove("hidden");clearTimeout(tT);tT=setTimeout(()=>t.classList.add("hidden"),3500)}
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

let auth,db,user=null,injected=false,tab="people",isAdmin=false,myName="عضو";
let people=null,peopleAt=0,cfg=null,cfgAt=0,cfgNoRules=false,adminUid="";
