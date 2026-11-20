(function(root){
const C=()=>root.PerformanceCore;
const validCount=v=>v!=null&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0;
function records(bc,mk){return [...(bc.snapshots||[]),...(bc.history||[])].filter(h=>C().date(h.date)&&(!mk||h.date.slice(0,7)===mk));}
function cutoff(bc,mk){return records(bc,mk).filter(h=>validCount(h.txnCount)).map(h=>h.date).sort().at(-1)||null;}
function metricAvailable(bc,mk,key){return bc.schemeOverrides?.[mk]?.[key]!=null||records(bc,mk).some(h=>validCount(h[key]));}
function activity(bc,mk){const end=cutoff(bc,mk);if(!end)return{state:'missing',label:'Data missing',active:false,cutoff:null};const count=C().monthMetric(bc,mk,'txnCount');if(count>0)return{state:'active',label:'Transaction-active',active:true,count,cutoff:end,statusConflict:bc.status==='Inactive'};
 const snap=(bc.snapshots||[]).some(s=>s.date===end&&s.start===mk+'-01');
 const days=new Set((bc.history||[]).filter(h=>h.date>=mk+'-01'&&h.date<=end&&validCount(h.txnCount)).map(h=>h.date));
 const complete=snap||days.size===Number(end.slice(-2));return{state:complete?'zero':'missing',label:complete?'Zero activity':'Incomplete data',active:false,count:0,cutoff:end};}
function workingDates(mk,calendar={}){const dim=new Date(mk+'-01T12:00:00Z');dim.setUTCMonth(dim.getUTCMonth()+1);dim.setUTCDate(0);const days=[];const closed=new Set(calendar.closedDates||[]);for(let i=1;i<=dim.getUTCDate();i++){const d=mk+'-'+String(i).padStart(2,'0');if(!closed.has(d))days.push(d);}return days;}
function todayIndia(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=type=>parts.find(p=>p.type===type).value;return get('year')+'-'+get('month')+'-'+get('day');}
function pace(bc,mk,rows,calendar={}){const end=cutoff(bc,mk);const today=todayIndia();const days=workingDates(mk,calendar);const elapsed=end?days.filter(d=>d<=end).length:0;const remaining=days.filter(d=>d>today).length;const fraction=days.length?elapsed/days.length:0;const out=rows.map(r=>({...r,gap:r.target>0&&r.achieved!=null?Math.max(0,r.target-r.achieved):null,expected:r.target>0?Math.ceil(r.target*fraction):null,requiredPerDay:remaining>0&&r.target>0&&r.achieved!=null?Math.ceil(Math.max(0,r.target-r.achieved)/remaining):null}));const withTarget=out.filter(r=>r.target>0);const known=withTarget.filter(r=>r.achieved!=null);const behind=known.filter(r=>r.achieved<r.expected);const allDone=withTarget.length>0&&known.length===withTarget.length&&known.every(r=>r.gap===0);return{cutoff:end,today,remaining,elapsed,totalDays:days.length,calendarLabel:(calendar.closedDates||[]).length?'Configured working days':'All days (no closures configured)',rows:out,behind,allDone,status:!end?'Data missing':!withTarget.length?'Targets not set':known.length<withTarget.length?'Incomplete metrics':allDone?'All targets achieved':behind.length?'Behind expected pace':'On expected pace'};}
function trend(bc,mk){const act=activity(bc,mk),end=act.cutoff;const hist=C().dailyEntries(bc).filter(h=>h.date.slice(0,7)===mk&&(!end||h.date<=end)&&validCount(h.txnCount));const by=new Map(hist.map(h=>[h.date,h]));const last14=[];if(end)for(let i=13;i>=0;i--){const d=new Date(end+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-i);const h=by.get(d.toISOString().slice(0,10));if(h)last14.push(h);}
 const base={hist,today:hist.at(-1),yesterday:hist.length>1&&daysBetween(hist.at(-2).date,hist.at(-1).date)===1?hist.at(-2):null,pctChange:null,consecutiveDecline:0,eligible:act.active};
 if(!act.active)return{...base,level:'EXCLUDED',reasons:[act.label+' — excluded from performance analysis']};
 if(last14.length!==14)return{...base,level:'WATCH',reasons:['Trend unavailable: need 14 consecutive daily records ending on '+end],insufficient:true};
 const old=last14.slice(0,7).reduce((s,h)=>s+Number(h.txnCount),0),recent=last14.slice(7).reduce((s,h)=>s+Number(h.txnCount),0);const pct=old>0?(recent-old)/old*100:null;let decline=0,zero=0;for(let i=last14.length-1;i>0&&Number(last14[i].txnCount)<Number(last14[i-1].txnCount);i--)decline++;for(let i=13;i>=0&&Number(last14[i].txnCount)===0;i--)zero++;
 let level=zero>=3||decline>=5||pct<=-40&&pct!=null?'CRITICAL':decline>=3||pct<=-20&&pct!=null?'NEEDS ATTENTION':decline>=1||pct<=-8&&pct!=null?'WATCH':'GOOD';const reasons=[];if(zero>=3)reasons.push(zero+' consecutive reported days without transactions');if(decline)reasons.push(decline+' consecutive days of decline');if(pct!=null)reasons.push('Last 7 days '+(pct>=0?'up ':'down ')+Math.abs(pct).toFixed(0)+'% vs previous 7 days');else reasons.push('Previous 7 days were zero; percentage growth is not defined');return{...base,level,reasons,pctChange:pct,consecutiveDecline:decline,zeroStreak:zero};}
function daysBetween(a,b){return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);}
// Feedback-only validation: never turn an absent/invalid monthly metric into zero.
function feedbackMetric(bc,mk,key,end){
 const override=bc.schemeOverrides?.[mk]?.[key];
 if(override!=null)return validCount(override)?Number(override):null;
 const snaps=(bc.snapshots||[]).filter(h=>C().date(h.date)&&h.date.slice(0,7)===mk&&h.date<=end).sort((a,b)=>a.date.localeCompare(b.date));
 const snap=snaps.at(-1);
 const by=new Map((bc.history||[]).filter(h=>C().date(h.date)&&h.date.slice(0,7)===mk&&h.date<=end&&(!snap||h.date>snap.date)).map(h=>[h.date,h]));
 if(snap&&!validCount(snap[key]))return null;
 const begin=snap?Number(snap.date.slice(-2))+1:1;
 for(let d=begin;d<=Number(end.slice(-2));d++)if(!validCount(by.get(mk+'-'+String(d).padStart(2,'0'))?.[key]))return null;
 return (snap?Number(snap[key]):0)+[...by.values()].reduce((sum,h)=>sum+Number(h[key]),0);
}
function feedback(bc,mk,perf,calendar={}){
 const act=activity(bc,mk);if(!act.active)return null;
 const today=todayIndia(),end=act.cutoff;
 const remaining=workingDates(mk,calendar).filter(d=>d>today).length;
 const future=end>today;
 const labels={txn:'లావాదేవీలు',newAccounts:'కొత్త ఖాతాలు',pmsby:'PMSBY',pmjjby:'PMJJBY',apy:'APY',rank5:'Rank 5',recoveryCount:'రికవరీల సంఖ్య',loginDays:'లాగిన్ పని రోజులు',recovery:'బకాయిల వసూళ్లు',loanLeads:'రుణ దరఖాస్తు సూచనలు'};
 const unique=new Map();
 for(const r of perf.rows||[]){if(r.key==='rank5'&&String(bc.bank||'').trim().toLowerCase()!=='canara')continue;if(!unique.has(r.key))unique.set(r.key,r);}
 for(const key of ['pmsby','pmjjby','apy'])if(!unique.has(key))unique.set(key,{key,target:null,achieved:null});
 const rows=[...unique.values()].map(r=>{
  const target=validCount(r.target)?Number(r.target):null;
  // Use the existing target and Rank 5 rules, but validate source completeness for schemes.
  const achieved=['newAccounts','pmsby','pmjjby','apy'].includes(r.key)?feedbackMetric(bc,mk,r.key,end):validCount(r.achieved)?Number(r.achieved):null;
  return {...r,label:labels[r.key]||r.label,target,achieved,gap:target!=null&&achieved!=null?Math.max(0,target-achieved):null};
 });
 const amount=feedbackMetric(bc,mk,'txnAmount',end);
 const lines=[`${bc.name} గారు,`, `బ్యాంక్: ${bc.bank}`, `నివేదిక నెల: ${mk}`, `డేటా అందిన తేదీ: ${end}`, `ఫీడ్‌బ్యాక్ తేదీ: ${today}`, '', '*లావాదేవీల పనితీరు*',`మొత్తం లావాదేవీల విలువ: ${amount==null?'సరైన పూర్తి డేటా అందలేదు':'₹'+amount.toLocaleString('en-IN')}`];
 if(end<today)lines.push('క్రింది లెక్కలు నివేదిక తేదీ వరకే; తర్వాతి రోజుల పనితీరు ఇందులో లేదు.');
 if(future)lines.push('డేటా తేదీ ఫీడ్‌బ్యాక్ తేదీ కంటే ముందుంది; నివేదిక తేదీని సరిచూడండి. రోజువారీ అవసరాన్ని లెక్కించలేదు.');
 const exceededLabels=[],missing=[];
 let transactionEnd=null;
 for(const r of rows){
  const isTxn=r.key==='txn';
  if(!isTxn)lines.push('',`*${r.label} పనితీరు*`);
  lines.push(`నెల లక్ష్యం: ${r.target==null?'సరైన లక్ష్యం అందలేదు':r.target}`,`పూర్తిచేసినవి: ${r.achieved==null?'సరైన పూర్తి డేటా అందలేదు':r.achieved}`,`మిగిలినవి: ${r.gap==null?'లెక్కించలేము':r.gap}`);
  if(isTxn||r.key==='rank5'||r.key==='newAccounts')lines.push(`లక్ష్య సాధన శాతం: ${r.target>0&&r.achieved!=null?(r.achieved/r.target*100).toFixed(2)+'%':r.target===0?'వర్తించదు (లక్ష్యం 0)':'లెక్కించలేము'}`);
  if(isTxn){
   const daily=r.gap===0?0:!future&&remaining>0&&r.gap!=null?Math.ceil(r.gap/remaining):null;
   lines.push(`అవసరమైన రోజువారీ లావాదేవీలు: ${daily==null?'లెక్కించలేము':daily}`);
   lines.push(`ఫీడ్‌బ్యాక్ తేదీని మినహాయించి నెలాఖరు వరకు మిగిలిన పని రోజులు: ${remaining}`);
   if(remaining===0&&r.gap>0)lines.push('మిగిలిన పని రోజులు లేవు; పెండింగ్ లక్ష్యంపై మేనేజర్‌తో తదుపరి చర్య నిర్ణయించండి.');
  }
  if(r.target==null||r.achieved==null)missing.push(r.label);
  if(r.target>0&&r.achieved!=null){
   if(r.achieved>r.target){exceededLabels.push(r.label);lines.push('లక్ష్యాన్ని మించి సాధించారు—అభినందనలు.');}
   else if(r.gap===0){lines.push('లక్ష్యాన్ని పూర్తిచేశారు—అభినందనలు.');}
  }
  if(isTxn)transactionEnd=lines.length;
 }
 const comparisonStart=lines.length;
 lines.push('','*రోజువారీ పోలిక*');
 const days=C().dailyEntries(bc).filter(h=>h.date.slice(0,7)===mk&&h.date<=end);
 const last=days.find(h=>h.date===end),prev=days.find(h=>daysBetween(h.date,end)===1);
 const known=h=>h&&validCount(h.txnCount);
 lines.push(`ముందు రోజు లావాదేవీలు${prev?' ('+prev.date+')':''}: ${known(prev)?Number(prev.txnCount):'డేటా అందలేదు'}`);
 let change=null;
 if(known(last)&&known(prev)){
  const before=Number(prev.txnCount),now=Number(last.txnCount);change=now-before;
  lines.push(`మార్పు: ${change>0?change+' పెరిగాయి':change<0?Math.abs(change)+' తగ్గాయి':'సంఖ్య మారలేదు'}`);
  lines.push(`శాతం మార్పు: ${before===0?'ముందు రోజు 0 కావడంతో శాతం లెక్కించలేము':(change>0?'+':'')+(change/before*100).toFixed(2)+'%'}`);
 }
 const comparisonLines=lines.splice(comparisonStart);
 lines.splice(transactionEnd??lines.length,0,...comparisonLines);
 const targetRows=rows.filter(r=>r.target>0);
 const allDone=targetRows.length>0&&targetRows.every(r=>r.gap===0)&&!missing.length;
 const pending=targetRows.filter(r=>r.gap>0).sort((a,b)=>(a.achieved/a.target)-(b.achieved/b.target));
 const motivation=[];
 if(allDone)motivation.push(exceededLabels.length?'నిర్దేశిత లక్ష్యాలన్నీ సాధించి, కొన్ని లక్ష్యాలను అధిగమించారు. ఇదే సేవా నాణ్యతను కొనసాగించండి.':'నిర్దేశిత లక్ష్యాలన్నీ పూర్తిచేశారు. ఇదే క్రమశిక్షణతో సేవలు కొనసాగించండి.');
 else if(change>0)motivation.push('గత రోజుతో పోలిస్తే మీ పనితీరు మెరుగైంది—అభినందనలు. ఈ పురోగతిని కొనసాగించండి.');
 else if(change<0)motivation.push('తాజా రోజున లావాదేవీలు తగ్గాయి. పెండింగ్ కస్టమర్లను సంప్రదించి, సేవల లభ్యతను సరిచూసి పనితీరును మెరుగుపరచండి.');
 else if(change===0)motivation.push('రెండు రోజులూ స్థిరమైన పనితీరు చూపించారు. క్రమమైన కస్టమర్ ఫాలోఅప్‌తో మరింత ముందుకు సాగండి.');
 if(!allDone){
  for(const r of pending){
   if(r.key==='txn'){
    if(future)motivation.push(`లావాదేవీలలో ${r.gap} మిగిలాయి. డేటా తేదీని ధృవీకరించిన తర్వాత రోజువారీ ప్రణాళిక రూపొందించండి.`);
    else if(remaining>0)motivation.push(`మిగిలిన ${r.gap} లావాదేవీలను పూర్తి చేసేందుకు రోజుకు కనీసం ${Math.ceil(r.gap/remaining)} లావాదేవీలు చేయండి.`);
    else motivation.push(`లావాదేవీలలో ${r.gap} మిగిలాయి. మిగిలిన పని రోజులు లేనందున మేనేజర్‌తో తదుపరి చర్య నిర్ణయించండి.`);
   }else if(['pmsby','pmjjby','apy'].includes(r.key)){
    const start=r.achieved===0?'నమోదు ఇంకా ప్రారంభించలేదు. ':'';
    motivation.push(`${r.label}లో ${start}మిగిలిన ${r.gap} నమోదుల కోసం అర్హులైన కస్టమర్లను సంప్రదించి, వారి సమ్మతితో నమోదు పూర్తి చేయండి.`);
   }else if(r.key==='newAccounts')motivation.push(`కొత్త ఖాతాల లక్ష్యంలో ${r.gap} మిగిలాయి. అవసరమైన పత్రాలతో అర్హులైన కస్టమర్ల ఖాతాలు తెరవండి.`);
   else if(r.key==='rank5')motivation.push(`Rank 5లో మిగిలిన ${r.gap} పూర్తి చేయండి.`);
   else motivation.push(`${r.label}లో మిగిలిన లక్ష్యం ${r.gap}. పూర్తి చేసేందుకు తదుపరి చర్య తీసుకోండి.`);
  }
 }
 if(missing.length)motivation.push(`${missing.join(', ')} వివరాలను ధృవీకరించండి; పూర్తి డేటాతోనే సరైన సమీక్ష సాధ్యం.`);
 if(!motivation.length)motivation.push('మీ సేవలను క్రమంగా కొనసాగించండి; నెల లక్ష్యాలను ధృవీకరించి పురోగతిని సమీక్షించండి.');
 lines.push('','*సూచనలు/సలహాలు*',...motivation,'కొత్త ఖాతాలను తెరిపించి, బ్యాంకు వ్యాపార వృద్ధికి మీ వంతు కృషి చేయండి.');
 return lines.join('\n');
}
function health(bcs,mk){return [...new Set(bcs.map(b=>b.bank))].map(bank=>{const bs=bcs.filter(b=>b.bank===bank),a=bs.map(b=>activity(b,mk));const latest=a.map(x=>x.cutoff).filter(Boolean).sort().at(-1)||null;return{bank,total:bs.length,active:a.filter(x=>x.active).length,zero:a.filter(x=>x.state==='zero').length,missing:a.filter(x=>x.state==='missing').length,stale:a.filter(x=>x.cutoff&&x.cutoff!==latest).length,latest,conflicts:a.filter(x=>x.statusConflict).length};});}
root.ManagerInsights={records,cutoff,metricAvailable,activity,pace,trend,feedback,health,workingDates};
})(typeof window==='undefined'?globalThis:window);
