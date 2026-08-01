
const STORAGE_KEY="objectif85-v1-finale";
let selectedDate=new Date();
let calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
let calendarSelectedDate=new Date(selectedDate);

const defaults={
  age:48,height:185,currentWeight:93,targetWeight:85,currentWaist:97,targetWaist:89,
  sessions:4,equipment:"Haltères et poids du corps",forbidden:"Porc",budget:""
};

function keyFor(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function load(){return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"days":{},"shopping":{},"settings":{},"performances":{}}')}
function save(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function settings(){return{...defaults,...(load().settings||{})}}
function getDay(d=selectedDate){
  const s=load();
  return s.days[keyFor(d)]||{meals:{},sports:{},series:{},weight:"",waist:"",steps:"",water:"",protein:"",sleep:""};
}
function setDay(data,d=selectedDate){const s=load();s.days[keyFor(d)]=data;save(s)}
function cycleIndex(d){const start=new Date(2026,0,1);const n=Math.floor((new Date(d.getFullYear(),d.getMonth(),d.getDate())-start)/86400000);return((n%28)+28)%28}
function weekDates(d){const x=new Date(d),shift=(x.getDay()+6)%7;x.setDate(x.getDate()-shift);return Array.from({length:7},(_,i)=>{const y=new Date(x);y.setDate(x.getDate()+i);return y})}
function dayProgram(d){return SPORT_PROGRAM[d.getDay()]}
function completion(d){
  const x=getDay(d),program=dayProgram(d);
  const mealDone=Object.values(x.meals||{}).filter(Boolean).length;
  const sportDone=Object.values(x.sports||{}).filter(Boolean).length;
  const total=4+program.exercises.length;
  return total?Math.round((mealDone+sportDone)/total*100):0;
}
function latestMetric(key,fallback){
  const list=Object.entries(load().days||{}).sort((a,b)=>b[0].localeCompare(a[0]));
  const found=list.find(([,d])=>d[key]!==""&&d[key]!=null);
  return found?Number(found[1][key]):fallback;
}
function renderWeek(){
  const r=document.getElementById("weekStrip");r.innerHTML="";
  weekDates(selectedDate).forEach(d=>{
    const b=document.createElement("button");b.className="day-chip"+(keyFor(d)===keyFor(selectedDate)?" active":"");
    const sc=completion(d);
    b.innerHTML=`<span>${d.toLocaleDateString("fr-FR",{weekday:"short"}).replace(".","").toUpperCase()}</span><strong>${d.getDate()}</strong><i style="background:${sc===100?"#52b85a":sc>0?"#ff8a27":"#697482"}"></i>`;
    b.addEventListener("click",()=>{selectedDate=d;renderToday()});r.appendChild(b);
  })
}
function renderObjective(){
  const s=settings(),current=latestMetric("weight",s.currentWeight);
  const total=s.currentWeight-s.targetWeight,done=s.currentWeight-current;
  const pct=Math.max(0,Math.min(100,total?done/total*100:0));
  document.getElementById("objectiveProgress").style.width=pct+"%";
  document.getElementById("objectiveCurrent").textContent=current.toFixed(1).replace(".0","")+" kg";
  document.getElementById("objectiveRemaining").textContent=Math.max(0,current-s.targetWeight).toFixed(1).replace(".0","")+" kg à perdre";
}
function renderGoals(){
  const p=dayProgram(selectedDate);
  document.getElementById("dailyGoals").innerHTML=`
    <div class="goal-card"><span>👣</span><strong>${p.stepsMin.toLocaleString("fr-FR")}</strong><small>${p.stepsIdeal.toLocaleString("fr-FR")} idéal</small></div>
    <div class="goal-card"><span>💧</span><strong>2,5–3 L</strong><small>eau</small></div>
    <div class="goal-card"><span>🥩</span><strong>180–200 g</strong><small>protéines</small></div>
    <div class="goal-card"><span>😴</span><strong>7 h 30–8 h</strong><small>sommeil</small></div>`;
}
function renderToday(){
  renderWeek();renderObjective();renderGoals();
  const idx=cycleIndex(selectedDate),data=getDay(),names=["Petit-déjeuner","Déjeuner","Collation","Dîner"],icons=["☀","🍗","🥛","🐟"];
  document.getElementById("cycleLabel").textContent=`J${idx+1}/28`;
  document.getElementById("dayScore").textContent=completion(selectedDate)+"%";
  const program=dayProgram(selectedDate);
  document.getElementById("sportTitle").textContent=program.title;
  document.getElementById("sportDuration").textContent=program.duration;
  const meals=document.getElementById("mealList");meals.innerHTML="";
  MEAL_PLAN[idx].forEach((m,i)=>{
    const row=document.createElement("div");row.className="meal-card";
    row.innerHTML=`<div class="icon-box">${icons[i]}</div><div><h3>${names[i]}</h3><p>${m}</p></div><button class="check-btn ${data.meals[i]?"done":""}">${data.meals[i]?"✓":""}</button>`;
    row.querySelector("button").addEventListener("click",()=>{const d=getDay();d.meals[i]=!d.meals[i];setDay(d);renderToday()});meals.appendChild(row);
  });
  renderExercises(program,data);
}
function renderExercises(program,data){
  const root=document.getElementById("sportList");root.innerHTML="";
  program.exercises.forEach((ex,i)=>{
    const card=document.createElement("article");card.className="exercise-card";
    const stored=(data.series&&data.series[i])||{};
    let seriesHTML="";
    const count=Math.min(Number(ex.sets)||1,5);
    for(let s=1;s<=count;s++){
      const val=stored["s"+s]??"";
      seriesHTML+=`<div class="series-cell ${val!==""?"done":""}"><label>Série ${s}</label><input type="number" inputmode="numeric" data-ex="${i}" data-series="${s}" placeholder="${String(ex.reps).replace(/[^\d]/g,"").slice(0,2)||"✓"}" value="${val}"></div>`;
    }
    card.innerHTML=`
      <div class="exercise-head"><div><h3>${ex.name}</h3><div class="exercise-advice">${ex.advice}</div></div><button class="check-btn ${data.sports[i]?"done":""}">${data.sports[i]?"✓":""}</button></div>
      <div class="exercise-specs">
        <div class="spec"><span>SÉRIES</span><strong>${ex.sets}</strong></div>
        <div class="spec"><span>RÉPÉTITIONS</span><strong>${ex.reps}</strong></div>
        <div class="spec"><span>POIDS CONSEILLÉ</span><strong>${ex.weight}</strong></div>
        <div class="spec"><span>REPOS</span><strong>${ex.rest}</strong></div>
      </div>
      <div class="series-grid">${seriesHTML}</div>`;
    card.querySelector(".check-btn").addEventListener("click",()=>{const d=getDay();d.sports[i]=!d.sports[i];setDay(d);savePerformance(ex,i,d);renderToday()});
    card.querySelectorAll(".series-cell input").forEach(input=>input.addEventListener("change",e=>{
      const d=getDay();d.series=d.series||{};d.series[i]=d.series[i]||{};d.series[i]["s"+e.target.dataset.series]=e.target.value;setDay(d);savePerformance(ex,i,d);renderToday();
    }));
    root.appendChild(card);
  })
}
function savePerformance(ex,index,dayData){
  const s=load();s.performances=s.performances||{};
  s.performances[ex.name]={date:keyFor(selectedDate),weight:ex.weight,reps:dayData.series?.[index]||{},completed:!!dayData.sports[index]};
  save(s);
}
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.getElementById(id).classList.add("active");
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.nav===id));
  const pageLabel={todayPage:"Aujourd’hui",calendarPage:"Calendrier",evolutionPage:"Évolution",shoppingPage:"Courses",settingsPage:"Paramètres"}[id]||"Objectif 85";
  document.getElementById("pageTitle").textContent=pageLabel;
  document.title=`${pageLabel} — Objectif 85`;
  if(id==="calendarPage")renderCalendar();if(id==="evolutionPage"){renderTracking();renderPhotos();}if(id==="shoppingPage")renderShopping();if(id==="settingsPage")renderSettings();
  scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.nav)));
document.getElementById("todayBtn").addEventListener("click",()=>{selectedDate=new Date();showPage("todayPage");renderToday()});

const trackFields=[["weight","Poids (kg)","0.1"],["waist","Tour de taille (cm)","0.1"],["steps","Pas","1"],["water","Eau (L)","0.1"],["protein","Protéines (g)","1"],["sleep","Sommeil (h)","0.25"]];
function renderTracking(){
  const d=getDay(),f=document.getElementById("trackingForm");f.innerHTML="";
  trackFields.forEach(([k,l,s])=>{const x=document.createElement("div");x.className="field";x.innerHTML=`<label>${l}</label><input type="number" step="${s}" data-key="${k}" value="${d[k]||""}">`;f.appendChild(x)});
  updateSummary();renderPerformances();
}
document.getElementById("saveTracking").addEventListener("click",()=>{
  const d=getDay();document.querySelectorAll("#trackingForm input").forEach(i=>d[i.dataset.key]=i.value);setDay(d);updateSummary();renderObjective();alert("Suivi enregistré.");
});
function history(){return Object.entries(load().days||{}).map(([date,d])=>({date,...d})).sort((a,b)=>a.date.localeCompare(b.date))}
function drawChart(id,vals,color){
  const svg=document.getElementById(id);svg.innerHTML="";const w=360,h=170,p=24,v=vals.length?vals:[0],min=Math.min(...v),max=Math.max(...v),r=max-min||1;
  for(let i=0;i<4;i++){const y=p+i*((h-p*2)/3);svg.insertAdjacentHTML("beforeend",`<line x1="${p}" y1="${y}" x2="${w-p}" y2="${y}" stroke="#27313b"/>`)}
  const pts=v.map((n,i)=>[v.length===1?w/2:p+i*((w-p*2)/(v.length-1)),h-p-((n-min)/r)*(h-p*2)]);
  if(pts.length>1)svg.insertAdjacentHTML("beforeend",`<polyline fill="none" stroke="${color}" stroke-width="4" points="${pts.map(x=>x.join(",")).join(" ")}"/>`);
  pts.forEach(([x,y])=>svg.insertAdjacentHTML("beforeend",`<circle cx="${x}" cy="${y}" r="5" fill="#0e1319" stroke="${color}" stroke-width="3"/>`));
}
function updateSummary(){
  const h=history(),s=settings(),weights=h.filter(x=>x.weight).map(x=>Number(x.weight)),waists=h.filter(x=>x.waist).map(x=>Number(x.waist));
  document.getElementById("currentWeight").textContent=(weights.at(-1)||s.currentWeight)+" kg";document.getElementById("currentWaist").textContent=(waists.at(-1)||s.currentWaist)+" cm";
  document.getElementById("successDays").textContent=Object.keys(load().days||{}).filter(k=>completion(new Date(k+"T12:00:00"))===100).length;
  document.getElementById("weightTrend").textContent=weights.length>1?`${(weights.at(-1)-weights[0]).toFixed(1)} kg`:"0 kg";
  document.getElementById("waistTrend").textContent=waists.length>1?`${(waists.at(-1)-waists[0]).toFixed(1)} cm`:"0 cm";
  drawChart("weightChart",weights,"#e8b85e");drawChart("waistChart",waists,"#ff7028");
}
function renderPerformances(){
  const root=document.getElementById("performanceHistory"),items=Object.entries(load().performances||{}).sort((a,b)=>b[1].date.localeCompare(a[1].date)).slice(0,12);
  root.innerHTML=items.length?items.map(([name,p])=>`<div class="performance-item"><strong>${name}</strong><span>${p.date} · ${p.weight} · ${Object.values(p.reps||{}).filter(Boolean).join(" / ")||"aucune série saisie"}</span></div>`).join(""):'<p class="muted">Aucune performance enregistrée.</p>';
}
function renderShopping(){
  const state=load(),checked=state.shopping||{},cats=document.getElementById("shoppingCategories"),bought=document.getElementById("boughtList");cats.innerHTML="";bought.innerHTML="";let total=0,done=0;
  Object.entries(SHOPPING_LIST).forEach(([cat,items])=>{const box=document.createElement("section");box.className="shopping-category";box.innerHTML=`<h3>${cat}</h3><div class="shopping-list"></div>`;const list=box.querySelector(".shopping-list");
    items.forEach(item=>{total++;const id=cat+"::"+item,isDone=!!checked[id];if(isDone)done++;const row=document.createElement("div");row.className="shopping-item"+(isDone?" done":"");row.innerHTML=`<input type="checkbox" ${isDone?"checked":""}><label>${item}</label>`;row.querySelector("input").addEventListener("change",e=>{const s=load();s.shopping=s.shopping||{};s.shopping[id]=e.target.checked;save(s);renderShopping()});(isDone?bought:list).appendChild(row)});if(list.children.length)cats.appendChild(box)});
  if(!bought.children.length)bought.innerHTML='<p class="muted">Aucun article acheté pour le moment.</p>';const pct=total?Math.round(done/total*100):0;document.getElementById("shoppingScore").textContent=pct+"%";document.getElementById("shoppingProgress").style.width=pct+"%";
}
document.getElementById("resetShopping").addEventListener("click",()=>{if(confirm("Réinitialiser toute la liste de courses ?")){const s=load();s.shopping={};save(s);renderShopping()}});

const settingFields=[["age","Âge","number"],["height","Taille (cm)","number"],["currentWeight","Poids de départ (kg)","number"],["targetWeight","Poids cible (kg)","number"],["currentWaist","Tour de taille initial (cm)","number"],["targetWaist","Tour de taille cible (cm)","number"],["sessions","Séances par semaine","number"],["equipment","Matériel disponible","text"],["forbidden","Aliments interdits","text"],["budget","Budget mensuel (€)","number"]];
function renderSettings(){const s=settings(),r=document.getElementById("settingsForm");r.innerHTML="";settingFields.forEach(([k,l,t])=>{const f=document.createElement("div");f.className="field";f.innerHTML=`<label>${l}</label><input data-key="${k}" type="${t}" value="${s[k]||""}">`;r.appendChild(f)})}
document.getElementById("saveSettings").addEventListener("click",()=>{const s=load();s.settings=s.settings||{};document.querySelectorAll("#settingsForm input").forEach(i=>s.settings[i.dataset.key]=i.type==="number"?Number(i.value):i.value);save(s);renderObjective();alert("Paramètres enregistrés.")});

function renderCalendar(){
  const title=calendarCursor.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});document.getElementById("calendarMonthTitle").textContent=title.charAt(0).toUpperCase()+title.slice(1);
  const grid=document.getElementById("calendarGrid");grid.innerHTML="";const first=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),1),leading=(first.getDay()+6)%7;
  for(let i=0;i<leading;i++){const e=document.createElement("div");e.className="calendar-day empty";grid.appendChild(e)}
  const count=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,0).getDate();
  for(let n=1;n<=count;n++){const date=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),n),b=document.createElement("button");b.className="calendar-day";if(keyFor(date)===keyFor(new Date()))b.classList.add("today");if(keyFor(date)===keyFor(calendarSelectedDate))b.classList.add("selected");const sc=completion(date);b.innerHTML=`<strong>${n}</strong><small>J${cycleIndex(date)+1} · ${dayProgram(date).title}</small><i style="width:7px;height:7px;border-radius:50%;background:${sc===100?"#52b85a":sc>0?"#ff8a27":"#697482"}"></i>`;b.addEventListener("click",()=>{calendarSelectedDate=date;renderCalendar()});grid.appendChild(b)}
  renderCalendarDetail();
}
function renderCalendarDetail(){
  const idx=cycleIndex(calendarSelectedDate),label=calendarSelectedDate.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),program=dayProgram(calendarSelectedDate);
  document.getElementById("calendarCycleDay").textContent=`JOUR ${idx+1} / 28`;document.getElementById("calendarDetailTitle").textContent=label.charAt(0).toUpperCase()+label.slice(1);
  const names=["Petit-déjeuner","Déjeuner","Collation","Dîner"];document.getElementById("calendarMeals").innerHTML=MEAL_PLAN[idx].map((m,i)=>`<div class="calendar-preview-item"><strong>${names[i]}</strong><span>${m}</span></div>`).join("");
  document.getElementById("calendarWorkout").innerHTML=`<div class="calendar-preview-item"><strong>${program.title}</strong><span>${program.duration} · ${program.stepsMin.toLocaleString("fr-FR")} pas minimum</span></div>`+program.exercises.map(ex=>`<div class="calendar-preview-item"><strong>${ex.name}</strong><span>${ex.sets} série(s) · ${ex.reps} · ${ex.weight}</span></div>`).join("");
}
document.getElementById("calendarPrev").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar()});
document.getElementById("calendarNext").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar()});
document.getElementById("openSelectedDay").addEventListener("click",()=>{selectedDate=new Date(calendarSelectedDate);showPage("todayPage");renderToday()});


function photoStore(){
  const state=load();
  state.photos=state.photos||[];
  return state;
}
function formatPhotoDate(iso){
  return new Date(iso+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
}
function photoTypeLabel(type){return{face:"Face",profil:"Profil",dos:"Dos"}[type]||type}
function compressPhoto(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("Lecture impossible"));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("Image invalide"));
      img.onload=()=>{
        const max=900,ratio=Math.min(1,max/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(img.width*ratio));
        canvas.height=Math.max(1,Math.round(img.height*ratio));
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",0.72));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
async function addPhoto(type,file){
  const message=document.getElementById("photoMessage");
  message.textContent="Préparation de la photo…";
  try{
    const dataUrl=await compressPhoto(file),state=photoStore(),date=keyFor(selectedDate);
    state.photos.push({id:Date.now()+"-"+Math.random().toString(16).slice(2),date,type,dataUrl,createdAt:new Date().toISOString()});
    save(state);
    message.textContent=`Photo ${photoTypeLabel(type).toLowerCase()} enregistrée pour le ${formatPhotoDate(date)}.`;
    renderPhotos();
  }catch(e){message.textContent="La photo n’a pas pu être enregistrée."}
}
function removePhoto(id){
  if(!confirm("Supprimer cette photo ?"))return;
  const state=photoStore();state.photos=state.photos.filter(p=>p.id!==id);save(state);renderPhotos();
}
function renderPhotos(){
  const timeline=document.getElementById("photoTimeline");
  if(!timeline)return;
  const photos=[...photoStore().photos].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
  timeline.innerHTML=photos.length?photos.map(p=>`
    <article class="photo-entry">
      <img src="${p.dataUrl}" alt="Photo ${photoTypeLabel(p.type)} du ${formatPhotoDate(p.date)}">
      <strong>${photoTypeLabel(p.type)}</strong><small>${formatPhotoDate(p.date)}</small>
      <button type="button" data-delete-photo="${p.id}">Supprimer</button>
    </article>`).join(""):'<div class="empty-timeline">Aucune photo enregistrée. Commence par une photo de face, de profil et de dos.</div>';
  timeline.querySelectorAll("[data-delete-photo]").forEach(b=>b.addEventListener("click",()=>removePhoto(b.dataset.deletePhoto)));
  renderCompareOptions();
}
function renderCompareOptions(){
  const type=document.getElementById("compareType")?.value||"face";
  const photos=photoStore().photos.filter(p=>p.type===type).sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt));
  const before=document.getElementById("compareBefore"),after=document.getElementById("compareAfter");
  if(!before||!after)return;
  const oldBefore=before.value,oldAfter=after.value;
  const options=photos.map(p=>`<option value="${p.id}">${formatPhotoDate(p.date)}</option>`).join("");
  before.innerHTML=options||'<option value="">Aucune photo</option>';
  after.innerHTML=options||'<option value="">Aucune photo</option>';
  if(photos.length){
    before.value=photos.some(p=>p.id===oldBefore)?oldBefore:photos[0].id;
    after.value=photos.some(p=>p.id===oldAfter)?oldAfter:photos.at(-1).id;
  }
  renderComparison();
}
function renderComparison(){
  const photos=photoStore().photos;
  setComparePhoto("before",photos.find(p=>p.id===document.getElementById("compareBefore")?.value));
  setComparePhoto("after",photos.find(p=>p.id===document.getElementById("compareAfter")?.value));
}
function setComparePhoto(prefix,photo){
  const img=document.getElementById(prefix+"Image"),placeholder=document.getElementById(prefix+"Placeholder"),caption=document.getElementById(prefix+"Caption");
  if(!img||!placeholder||!caption)return;
  if(photo){
    img.src=photo.dataUrl;img.style.display="block";placeholder.style.display="none";
    caption.textContent=`${prefix==="before"?"Avant":"Après"} · ${formatPhotoDate(photo.date)}`;
  }else{
    img.removeAttribute("src");img.style.display="none";placeholder.style.display="flex";
    caption.textContent=prefix==="before"?"Avant":"Après";
  }
}
document.querySelectorAll("[data-photo-type]").forEach(input=>input.addEventListener("change",event=>{
  const file=event.target.files?.[0];
  if(file)addPhoto(event.target.dataset.photoType,file);
  event.target.value="";
}));
document.getElementById("compareType")?.addEventListener("change",renderCompareOptions);
document.getElementById("compareBefore")?.addEventListener("change",renderComparison);
document.getElementById("compareAfter")?.addEventListener("change",renderComparison);

// Empêche le zoom par pincement et le zoom par double toucher sur iOS.
["gesturestart","gesturechange","gestureend"].forEach(type=>{
  document.addEventListener(type,event=>event.preventDefault(),{passive:false});
});
let lastTouchEnd=0;
document.addEventListener("touchend",event=>{
  const now=Date.now();
  if(now-lastTouchEnd<=300)event.preventDefault();
  lastTouchEnd=now;
},{passive:false});
document.getElementById("pageTitle").textContent="Aujourd’hui";
document.title="Aujourd’hui — Objectif 85";

if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
renderToday();
