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

/* ---------------- التشغيل ---------------- */
function boot(){
 if(!getApps().length){setTimeout(boot,200);return}
 const app=getApp();auth=getAuth(app);db=getFirestore(app);
 onAuthStateChanged(auth,u=>{
  if(!u||u.uid!==(user&&user.uid)){people=null;cfg=null;isAdmin=false;adminUid=""}
  user=u;
  if(u)waitApp();
 });
}
function waitApp(){
 let n=0;const t=setInterval(()=>{
  const app=Q("#app");n++;
  if(app&&!app.classList.contains("hidden")){clearInterval(t);init();checkAdmin()}
  else if(n>120)clearInterval(t);
 },500);
}
async function checkAdmin(){
 if(!user||adminUid===user.uid)return;
 adminUid=user.uid;
 try{const s=await getDoc(doc(db,"admins",user.uid));isAdmin=s.exists();if(isAdmin&&tab==="sites"&&pageVisible())render()}catch{isAdmin=false}
}
const pageVisible=()=>{const p=Q("#page-suggest");return p&&!p.classList.contains("hidden")};

/* ---------------- الواجهة ---------------- */
const svgUrl=s=>`url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const IC_SEARCH=svgUrl("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='11' cy='11' r='7' fill='none' stroke='#000' stroke-width='2.6'/><path d='M16.5 16.5L21 21' stroke='#000' stroke-width='2.6' stroke-linecap='round'/></svg>");
const IC_STAR=svgUrl("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill-rule='evenodd' d='M20.7 3.3C14.5 2.4 8.9 5 6.6 10.4c-.8 1.9-.9 3.9-.5 5.7L3 19.2 4.8 21l3.1-3.1c1.8.4 3.8.3 5.7-.5 5.4-2.3 8-7.9 7.1-14.1zM8.9 15.1l.9.9 7.2-7.2-.9-.9z'/></svg>");
const CSS=`
:root{--kp-search:${IC_SEARCH};--kp-star:${IC_STAR}}
.kp-ic{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.17em;background-color:currentColor;-webkit-mask:var(--ic) center/contain no-repeat;mask:var(--ic) center/contain no-repeat;flex:none}
.kp-ic.kp-search{--ic:var(--kp-search)}.kp-ic.kp-star{--ic:var(--kp-star)}
.bottom-nav .kp-lbl{display:none}
.kp-tabs{display:flex;gap:8px;margin:0 0 12px;overflow-x:auto;padding-bottom:2px}
.kp-tab{border:0;border-radius:999px;padding:9px 16px;background:var(--s);color:var(--t);border:1px solid var(--b);white-space:nowrap;font-weight:bold}
.kp-tab.on{background:var(--p-soft);color:var(--p);border-color:var(--p-soft)}
.kp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media(min-width:700px){.kp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.kp-card{position:relative;background:var(--s);border:1px solid var(--b);border-radius:14px;padding:14px 10px 12px;text-align:center;display:grid;gap:4px;justify-items:center}
.kp-pa{border:0;background:none;padding:0}.kp-pa img{width:84px;height:84px;border-radius:50%;object-fit:cover;background:var(--bg);border:1px solid var(--b)}
.kp-nm{font-weight:bold;overflow-wrap:anywhere;line-height:1.5}.kp-sub{font-size:12px;color:var(--m);min-height:18px}
.kp-add{width:100%;margin-top:4px}
.kp-x{position:absolute;top:4px;inset-inline-start:6px;border:0;background:none;color:var(--m);font-size:20px;line-height:1;padding:4px 6px}
.kp-sec{background:var(--s);border:1px solid var(--b);border-radius:14px;padding:6px 12px 12px;margin-bottom:12px}
.kp-sh{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.kp-sh h3{margin:10px 0;font-size:17px}
.kp-site{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--b);flex-wrap:wrap}
.kp-site.dim{opacity:.55}
.kp-lt{width:44px;height:44px;border-radius:12px;background:var(--p-soft);color:var(--p);display:grid;place-items:center;font-weight:900;font-size:19px;flex:none}
.kp-si{flex:1;min-width:0;display:grid}.kp-si strong{overflow-wrap:anywhere}.kp-si span{overflow-wrap:anywhere}
.kp-adm{display:flex;gap:4px;flex-wrap:wrap}.kp-adm button{border:1px solid var(--b);background:var(--bg);color:var(--t);border-radius:8px;padding:3px 9px;font-size:12px}
.kp-empty{text-align:center;color:var(--m);padding:30px 12px}
.kp-warn{background:#fff4d6;color:#7a5a00;border-radius:10px;padding:8px 10px;font-size:13px;margin-bottom:10px}body.dark .kp-warn{background:#3b3216;color:#f1d98a}
.kp-ov{position:fixed;inset:0;z-index:400;background:#0009;display:grid;place-items:center;padding:14px}
.kp-box{width:100%;max-width:460px;max-height:90vh;overflow:auto;background:var(--s);color:var(--t);border-radius:16px;padding:18px;display:grid;gap:10px}
.kp-box h2{margin:0;font-size:19px}.kp-box label{display:grid;gap:4px;font-size:14px}.kp-box .chk{display:flex;align-items:center;gap:8px}
.kp-view{position:fixed;inset:0;z-index:410;background:var(--bg);display:flex;flex-direction:column}
.kp-vh{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--s);border-bottom:1px solid var(--b)}.kp-vh strong{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kp-view iframe{flex:1;width:100%;border:0;background:#fff}.kp-vn{font-size:12px;color:var(--m);padding:5px 12px;background:var(--s)}
.kp-ic.kp-star{width:1.1em!important;height:1.1em!important}
.nav-btn i.kp-ic{width:1.1em!important;height:1.1em!important}
@media(max-width:700px){
 .app-layout{margin:0 auto!important;padding:0 0 82px!important}
 #page-suggest>.kp-title{display:none!important}
 #page-suggest{padding:10px 10px 0}
 #welcome-note{margin:8px 10px!important}
 #posts-feed>.card,#user-profile-posts-feed>.card{border-radius:0!important;border-width:1px 0!important;box-shadow:none!important;padding:12px 14px!important;margin-bottom:8px!important}
 .post-body{font-size:16.5px;line-height:1.75}
 .post .post-image{max-height:none;border-radius:0;margin:0 -14px;width:calc(100% + 28px);max-width:none}
 .quoted .post-image{margin:0;width:100%;max-width:100%}
 .post-actions{flex-wrap:nowrap;gap:0}
 .post-actions .action-btn{font-size:14px}
 .post-actions .react-more{flex:0 0 44px}
 #new-post-form.kp-compact{padding:10px 14px!important;border-radius:0!important;border-width:1px 0!important;box-shadow:none!important;margin-bottom:8px!important}
 #new-post-form.kp-compact:not(.kp-open)>*:not(:first-child){display:none!important}
 #new-post-form.kp-compact:not(.kp-open)>.row{cursor:pointer;padding:0!important;border:0!important}
 #new-post-form.kp-compact:not(.kp-open)>.row strong{flex:1;border:1px solid var(--b);border-radius:999px;padding:9px 16px;font-weight:normal;color:var(--m)}
}`;

function init(){
 if(injected)return;
 const app=Q("#app"),main=Q("main.main-column"),bn=Q(".bottom-nav"),sb=Q(".sidebar .nav-list");
 if(!app||!main||!bn||!sb)return;
 injected=true;
 const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
 /* مربع النشر المختصر بشكل فيسبوك */
 const form=Q("#new-post-form");
 if(form){
  form.classList.add("kp-compact");
  const s=form.querySelector(".row strong");if(s)s.textContent="بم تفكر؟";
  const open=()=>{form.classList.add("kp-open");setTimeout(()=>Q("#new-post-text")?.focus(),30)};
  form.addEventListener("click",e=>{if(!form.classList.contains("kp-open")&&e.target.closest(".row"))open()});
  form.addEventListener("submit",()=>setTimeout(()=>form.classList.remove("kp-open"),50));
  form.addEventListener("focusout",()=>setTimeout(()=>{
   if(form.contains(document.activeElement))return;
   const empty=!Q("#new-post-text").value.trim()&&!Q("#new-post-video-url").value.trim()&&Q("#media-preview-container").classList.contains("hidden");
   if(empty)form.classList.remove("kp-open");
  },250));
 }
 /* أزرار التنقل */
 const mk=()=>{const b=document.createElement("button");b.className="nav-btn";b.dataset.kp="suggest";b.setAttribute("aria-label","اقتراحات");b.title="اقتراحات";b.innerHTML='<i class="kp-ic kp-star"></i><span class="kp-lbl"> اقتراحات</span>';b.onclick=showSuggest;return b};
 bn.appendChild(mk());
 sb.insertBefore(mk(),sb.children[4]||null);
 bn.querySelectorAll(".nav-btn").forEach(b=>{if(!b.getAttribute("aria-label"))b.setAttribute("aria-label",b.textContent.trim())});
 /* الصفحة */
 const pg=document.createElement("section");pg.id="page-suggest";pg.className="page hidden";
 pg.innerHTML='<h2 class="page-title kp-title">اقتراحات</h2><div class="kp-tabs"><button type="button" class="kp-tab on" data-t="people">أشخاص قد تعرفهم</button><button type="button" class="kp-tab" data-t="sites">مواقع ومنصات</button></div><div id="kp-body"></div>';
 main.appendChild(pg);
 new MutationObserver(()=>{if(pg.classList.contains("hidden"))document.querySelectorAll('[data-kp]').forEach(b=>b.classList.remove("active"))}).observe(pg,{attributes:true,attributeFilter:["class"]});
 pg.querySelector(".kp-tabs").addEventListener("click",e=>{const b=e.target.closest(".kp-tab");if(!b)return;tab=b.dataset.t;pg.querySelectorAll(".kp-tab").forEach(x=>x.classList.toggle("on",x===b));render()});
 pg.addEventListener("click",onClick);
}
function showSuggest(){
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("hidden",p.id!=="page-suggest"));
 document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.kp==="suggest"));
 window.scrollTo(0,0);checkAdmin();render();
}
function render(){tab==="people"?renderPeople(false):renderSites(false)}
const skel='<div class="skeleton"></div>';

/* ---------------- أشخاص قد تعرفهم ---------------- */
const hidKey=()=>"kp-hid-"+user.uid,pplKey=()=>"kp-people-"+user.uid;
async function loadPeople(){
 const me=(await getDoc(doc(db,"users",user.uid))).data()||{};
 myName=me.displayName||me.name||user.displayName||"عضو";
 const mine=new Set(arr(me.friends)),blocked=new Set(arr(me.blockedUsers)),hid=new Set(arr(lsGet(hidKey())));
 let pending=new Set();
 try{const s=await getDocs(query(collection(db,"friendRequests"),where("from","==",user.uid),where("status","==","pending")));s.docs.forEach(d=>pending.add(d.data().to))}catch{}
 const skip=x=>!x||x===user.uid||mine.has(x)||blocked.has(x)||hid.has(x);
 const mutual=new Map();
 const sample=[...mine].sort(()=>Math.random()-.5).slice(0,10);
 const fdocs=await Promise.all(sample.map(f=>getDoc(doc(db,"users",f)).catch(()=>null)));
 fdocs.forEach(s=>{
  if(!s||!s.exists())return;const d=s.data();
  if(d.hideFriends)return;
  arr(d.friends).forEach(x=>{if(!skip(x))mutual.set(x,(mutual.get(x)||0)+1)});
 });
 const ids=[...mutual.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(x=>x[0]);
 const out=[];
 const add=(id,d,n)=>{
  if(!d||arr(d.blockedUsers).includes(user.uid))return;
  const th=safeImg(d.thumb)||safeImg(d.photoURL);
  out.push({uid:id,name:d.displayName||d.name||"عضو",thumb:th&&th.length<12000?th:"",mutual:n,sent:pending.has(id)});
 };
 const got=await Promise.all(ids.map(id=>getDoc(doc(db,"users",id)).catch(()=>null)));
 got.forEach((s,i)=>{if(s&&s.exists())add(ids[i],s.data(),mutual.get(ids[i]))});
 if(out.length<12){
  try{
   const s=await getDocs(query(collection(db,"users"),orderBy("createdAt","desc"),limit(20)));
   const seen=new Set(out.map(x=>x.uid));
   for(const d of s.docs){if(out.length>=12)break;if(seen.has(d.id)||skip(d.id))continue;add(d.id,d.data(),0)}
  }catch{}
 }
 return out;
}
async function renderPeople(force){
 const b=Q("#kp-body");if(!b||!user)return;
 const c=lsGet(pplKey());
 if(!force&&!people&&c&&Date.now()-c.t<PEOPLE_TTL){people=c.list;peopleAt=c.t}
 if(force||!people||Date.now()-peopleAt>PEOPLE_TTL){
  if(!online()&&people){/* نعرض المخزّن */}
  else if(!online()&&!people){b.innerHTML='<div class="kp-empty">الاقتراحات تحتاج إلى اتصال بالإنترنت.</div>';return}
  else{
   b.innerHTML=skel+skel;
   try{people=await loadPeople();peopleAt=Date.now();lsSet(pplKey(),{t:peopleAt,list:people})}
   catch(e){console.warn(e);if(tab==="people")b.innerHTML='<div class="kp-empty">تعذّر تحميل الاقتراحات الآن. حاول لاحقًا.</div>';return}
  }
 }
 if(tab!=="people")return;
 const list=people.filter(p=>!arr(lsGet(hidKey())).includes(p.uid));
 b.innerHTML=(list.length?`<div class="kp-grid">${list.map(p=>`<div class="kp-card"><button type="button" class="kp-x" data-act="hide" data-uid="${esc(p.uid)}" aria-label="إخفاء الاقتراح">×</button><button type="button" class="open-profile kp-pa" data-uid="${esc(p.uid)}" aria-label="${esc(p.name)}"><img src="${esc(p.thumb||DEF)}" alt="" loading="lazy" decoding="async"></button><div class="kp-nm">${esc(p.name)}</div><div class="kp-sub">${p.mutual?esc(p.mutual+" "+(p.mutual===1?"صديق مشترك":"أصدقاء مشتركين")):"عضو في كلمات"}</div><button type="button" class="btn kp-add ${p.sent?"secondary":""}" data-act="add" data-uid="${esc(p.uid)}" ${p.sent?"disabled":""}>${p.sent?"تم الإرسال ✓":"إضافة"}</button></div>`).join("")}</div>`:'<div class="kp-empty">لا توجد اقتراحات الآن. أضف أصدقاء أكثر وستظهر هنا اقتراحات جديدة.</div>')+'<div style="text-align:center;margin-top:12px"><button type="button" class="btn secondary" data-act="refresh">تحديث الاقتراحات</button></div>';
}
async function addFriend(id,btn){
 if(!online())return toast("هذا الإجراء يحتاج إلى اتصال بالإنترنت.");
 const p=(people||[]).find(x=>x.uid===id);if(!p)return;
 btn.disabled=true;
 try{
  const ref=doc(db,"friendRequests",user.uid+"_"+id),s=await getDoc(ref);
  if(!(s.exists()&&s.data().status==="pending")){
   await setDoc(ref,{from:user.uid,to:id,status:"pending",fromName:myName,toName:p.name,createdAt:serverTimestamp()});
   addDoc(collection(db,"users",id,"notifications"),{from:user.uid,type:"friend_request",text:myName+" أرسل إليك طلب صداقة.",read:false,createdAt:serverTimestamp()}).catch(()=>{});
  }
  p.sent=true;lsSet(pplKey(),{t:peopleAt,list:people});
  btn.textContent="تم الإرسال ✓";btn.classList.add("secondary");toast("تم إرسال الطلب.");
 }catch(e){console.warn(e);btn.disabled=false;toast("تعذّر إرسال الطلب.")}
}

/* ---------------- مواقع ومنصات ---------------- */
function norm(d){
 const secs=arr(d&&d.sections).slice(0,MAX_SECTIONS).map(s=>({
  id:String(s.id||uid8()).slice(0,20),title:String(s.title||"").slice(0,60),hidden:!!s.hidden,
  sites:arr(s.sites).slice(0,MAX_SITES).map(x=>({id:String(x.id||uid8()).slice(0,20),name:String(x.name||"").slice(0,60),url:safeLink(x.url),desc:String(x.desc||"").slice(0,140),embed:!!x.embed,hidden:!!x.hidden})).filter(x=>x.name&&x.url)
 }));
 return{sections:secs};
}
async function loadCfg(){
 cfgNoRules=false;
 try{
  const s=await getDoc(doc(db,"config","sites"));
  cfg=norm(s.exists()?s.data():{});lsSet("kp-sites",cfg);cfgAt=Date.now();
 }catch(e){
  cfgNoRules=e&&e.code==="permission-denied";
  cfg=norm(lsGet("kp-sites")||{});
 }
}
const totalSites=()=>cfg.sections.reduce((n,s)=>n+s.sites.length,0);
async function renderSites(force){
 const b=Q("#kp-body");if(!b||!user)return;
 if(force||!cfg||Date.now()-cfgAt>SITES_TTL){
  if(!cfg)b.innerHTML=skel;
  if(online())await loadCfg();else if(!cfg)cfg=norm(lsGet("kp-sites")||{});
 }
 if(tab!=="sites")return;
 const secs=cfg.sections.filter(s=>isAdmin||(!s.hidden&&s.sites.some(x=>!x.hidden)));
 let h="";
 if(isAdmin){
  if(cfgNoRules)h+='<div class="kp-warn">تعذّر قراءة الإعدادات: أضف قاعدة <b>config</b> في قواعد Firestore ثم أعد المحاولة.</div>';
  h+=`<div class="kp-adm" style="margin-bottom:10px"><button type="button" data-act="secAdd" style="padding:8px 14px;font-size:14px">+ قسم جديد</button><span class="muted small" style="align-self:center">${cfg.sections.length}/${MAX_SECTIONS} أقسام · ${totalSites()}/${MAX_SITES} موقعًا</span></div>`;
 }
 if(!secs.length)h+='<div class="kp-empty">'+(isAdmin?"لم تُضف أقسامًا بعد. اضغط «قسم جديد» للبدء.":"لا توجد مواقع بعد. ستضيفها الإدارة قريبًا.")+"</div>";
 h+=secs.map(s=>{
  const sites=s.sites.filter(x=>isAdmin||!x.hidden);
  return `<div class="kp-sec"><div class="kp-sh"><h3>${esc(s.title)}${s.hidden?' <span class="muted small">(مخفي)</span>':""}</h3>${isAdmin?`<div class="kp-adm"><button type="button" data-act="siteAdd" data-s="${esc(s.id)}">+ موقع</button><button type="button" data-act="secEdit" data-s="${esc(s.id)}">تسمية</button><button type="button" data-act="secHide" data-s="${esc(s.id)}">${s.hidden?"إظهار":"إخفاء"}</button><button type="button" data-act="secUp" data-s="${esc(s.id)}">▲</button><button type="button" data-act="secDown" data-s="${esc(s.id)}">▼</button><button type="button" data-act="secDel" data-s="${esc(s.id)}">حذف</button></div>`:""}</div>${sites.map(x=>`<div class="kp-site ${x.hidden?"dim":""}"><span class="kp-lt">${esc([...x.name][0]||"؟")}</span><div class="kp-si"><strong>${esc(x.name)}</strong>${x.desc?`<span class="muted small">${esc(x.desc)}</span>`:""}</div><button type="button" class="btn" data-act="open" data-s="${esc(s.id)}" data-x="${esc(x.id)}">فتح</button>${isAdmin?`<div class="kp-adm" style="flex-basis:100%"><button type="button" data-act="siteEdit" data-s="${esc(s.id)}" data-x="${esc(x.id)}">تعديل</button><button type="button" data-act="siteHide" data-s="${esc(s.id)}" data-x="${esc(x.id)}">${x.hidden?"إظهار":"إخفاء"}</button><button type="button" data-act="siteUp" data-s="${esc(s.id)}" data-x="${esc(x.id)}">▲</button><button type="button" data-act="siteDown" data-s="${esc(s.id)}" data-x="${esc(x.id)}">▼</button><button type="button" data-act="siteDel" data-s="${esc(s.id)}" data-x="${esc(x.id)}">حذف</button></div>`:""}</div>`).join("")}</div>`;
 }).join("");
 b.innerHTML=h;
}
async function saveCfg(){
 lsSet("kp-sites",cfg);
 if(!online()){toast("لا يوجد اتصال؛ لم يُحفظ التعديل على الخادم.");return}
 try{await setDoc(doc(db,"config","sites"),{sections:cfg.sections,updatedAt:serverTimestamp()});cfgAt=Date.now();cfgNoRules=false}
 catch(e){console.warn(e);toast(e&&e.code==="permission-denied"?"لا توجد صلاحية: أضف قاعدة config في Firestore.":"تعذّر حفظ التعديل.");cfgAt=0;await loadCfg()}
 renderSites(false);
}
const secOf=id=>cfg.sections.find(s=>s.id===id);
const move=(a,i,d)=>{const j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]]};
function ask(title,fields,ok){
 const ov=document.createElement("div");ov.className="kp-ov";
 ov.innerHTML=`<form class="kp-box"><h2>${esc(title)}</h2>${fields.map((f,i)=>f.type==="check"?`<label class="chk"><input type="checkbox" name="f${i}" ${f.val?"checked":""}> ${esc(f.label)}</label>`:`<label>${esc(f.label)}<input class="field" name="f${i}" ${f.type==="url"?'type="url" inputmode="url" dir="ltr"':""} maxlength="${f.max||80}" value="${esc(f.val||"")}" ${f.ph?`placeholder="${esc(f.ph)}"`:""}></label>`).join("")}<div class="kp-adm"><button class="btn" type="submit" style="padding:9px 16px">حفظ</button><button class="btn secondary" type="button" data-x style="padding:9px 16px">إلغاء</button></div></form>`;
 document.body.appendChild(ov);
 const close=()=>ov.remove();
 ov.addEventListener("click",e=>{if(e.target===ov||e.target.closest("[data-x]"))close()});
 ov.querySelector("form").onsubmit=e=>{
  e.preventDefault();
  const el=e.currentTarget.elements,vals=fields.map((f,i)=>f.type==="check"?el["f"+i].checked:el["f"+i].value.trim());
  for(let i=0;i<fields.length;i++){if(fields[i].req&&!vals[i])return toast("املأ الحقل: "+fields[i].label)}
  if(ok(vals)!==false)close();
 };
 setTimeout(()=>ov.querySelector("input")?.focus(),50);
}
function openSite(sec,x){
 if(!x.embed){window.open(x.url,"_blank","noopener,noreferrer");return}
 const v=document.createElement("div");v.className="kp-view";
 v.innerHTML=`<div class="kp-vh"><strong>${esc(x.name)}</strong><a class="btn secondary" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" style="padding:7px 12px">فتح في المتصفح</a><button type="button" class="btn" data-x style="padding:7px 12px">إغلاق</button></div><div class="kp-vn">إن بقيت الصفحة فارغة فالموقع يمنع العرض داخل التطبيق؛ افتحه في المتصفح.</div><iframe src="${esc(x.url)}" title="${esc(x.name)}" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>`;
 document.body.appendChild(v);
 v.addEventListener("click",e=>{if(e.target.closest("[data-x]"))v.remove()});
}

/* ---------------- النقرات ---------------- */
function onClick(e){
 const t=e.target.closest("[data-act]");if(!t)return;
 const act=t.dataset.act,sid=t.dataset.s,xid=t.dataset.x;
 if(act==="add")return addFriend(t.dataset.uid,t);
 if(act==="hide"){const h=arr(lsGet(hidKey()));h.push(t.dataset.uid);lsSet(hidKey(),h.slice(-200));renderPeople(false);return}
 if(act==="refresh"){if(!online())return toast("يحتاج اتصالًا بالإنترنت.");renderPeople(true);return}
 if(!cfg)return;
 if(act==="open"){const s=secOf(sid),x=s&&s.sites.find(y=>y.id===xid);if(x)openSite(s,x);return}
 if(!isAdmin)return;
 const s=secOf(sid),si=cfg.sections.findIndex(q=>q.id===sid),x=s&&s.sites.find(y=>y.id===xid),xi=s?s.sites.findIndex(y=>y.id===xid):-1;
 if(act==="secAdd"){
  if(cfg.sections.length>=MAX_SECTIONS)return toast("وصلت إلى الحد الأقصى للأقسام.");
  ask("قسم جديد",[{label:"اسم القسم (مثال: أخبار)",val:"",req:1,max:60}],v=>{cfg.sections.push({id:uid8(),title:v[0],hidden:false,sites:[]});saveCfg()});
 }else if(act==="secEdit"&&s)ask("تسمية القسم",[{label:"اسم القسم",val:s.title,req:1,max:60}],v=>{s.title=v[0];saveCfg()});
 else if(act==="secHide"&&s){s.hidden=!s.hidden;saveCfg()}
 else if(act==="secUp"&&s){move(cfg.sections,si,-1);saveCfg()}
 else if(act==="secDown"&&s){move(cfg.sections,si,1);saveCfg()}
 else if(act==="secDel"&&s){if(confirm("حذف القسم «"+s.title+"» وكل مواقعه؟")){cfg.sections.splice(si,1);saveCfg()}}
 else if(act==="siteAdd"&&s){
  if(totalSites()>=MAX_SITES)return toast("وصلت إلى الحد الأقصى للمواقع.");
  ask("موقع جديد",[{label:"الاسم",val:"",req:1,max:60},{label:"الرابط (https://...)",val:"",req:1,type:"url",max:500,ph:"https://example.com"},{label:"وصف قصير (اختياري)",val:"",max:140},{label:"يفتح داخل كلمات (للمواقع التي تسمح بذلك فقط)",type:"check",val:false}],v=>{
   const u=safeLink(v[1]);if(!u){toast("الرابط يجب أن يبدأ بـ https://");return false}
   s.sites.push({id:uid8(),name:v[0],url:u,desc:v[2],embed:!!v[3],hidden:false});saveCfg();
  });
 }else if(act==="siteEdit"&&x){
  ask("تعديل الموقع",[{label:"الاسم",val:x.name,req:1,max:60},{label:"الرابط",val:x.url,req:1,type:"url",max:500},{label:"وصف قصير",val:x.desc,max:140},{label:"يفتح داخل كلمات",type:"check",val:x.embed}],v=>{
   const u=safeLink(v[1]);if(!u){toast("الرابط يجب أن يبدأ بـ https://");return false}
   Object.assign(x,{name:v[0],url:u,desc:v[2],embed:!!v[3]});saveCfg();
  });
 }else if(act==="siteHide"&&x){x.hidden=!x.hidden;saveCfg()}
 else if(act==="siteUp"&&x){move(s.sites,xi,-1);saveCfg()}
 else if(act==="siteDown"&&x){move(s.sites,xi,1);saveCfg()}
 else if(act==="siteDel"&&x){if(confirm("حذف الموقع «"+x.name+"»؟")){s.sites.splice(xi,1);saveCfg()}}
}

boot();
