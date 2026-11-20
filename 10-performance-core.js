(function(root){
const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const num=v=>{if(v==null||v==='')return null; const n=Number(String(v).replace(/[,₹\s]/g,''));if(!Number.isFinite(n)||n<0)throw Error('Invalid numeric value: '+v);return n;};
const date=v=>{let s;if(v instanceof Date){if(!Number.isFinite(v.getTime()))return null;s=v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');}else{s=String(v??'').trim();const m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);if(m)s=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');}if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:null;};
const aliases={bank:['bank','bankname'],id:['bcid','agentcode','agentid','id'],name:['bcname','agentname','name'],village:['village'],mandal:['mandal','branch'],district:['district'],contact:['contact','mobile','phone','agentmobileno','contactnumber'],ce:['ce','cename','clusterexecutive'],status:['agentstatus','status'],date:['date','activitydate','reportdate'],joiningDate:['agentactivationdate','joiningdate'],txnCount:['transactioncount','txncount','transactions','txncnt'],txnAmount:['transactionamount','txnamount','amount','volume','txnvol'],activeCustomers:['activecustomercount','activecustomers','customers'],pmsby:['pmsby','sby'],pmjjby:['pmjjby','jjby'],apy:['apy'],newAccounts:['newaccounts','newaccount','accountsopened','accountopened','newaccountsopened','pmjdy'],rank5:['rank5'],loanLeads:['loanleads'],recovery:['recovery'],recoveryCount:['recoverycount']};
// Use the reader shipped with the app for CSV and Excel clipboard data.
// raw:true preserves IDs, phone numbers and date strings before validation.
function parseText(text,reader){
 if(!reader)throw Error('The file reader is unavailable. Reload and retry.');
 const wb=reader.read(String(text).replace(/^\uFEFF/,''),{type:'string',raw:true});
 const sheet=wb.Sheets[wb.SheetNames[0]];
 return reader.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,blankrows:false});
}
function parseMatrix(matrix,filename='',forcedDate=null){
 // Newer Canara reports insert 'Branch Code' and 'Mobile' columns. Drop them so the fixed column layout below still applies.
 {const hr=matrix.find(r=>r.some(v=>aliases.id.includes(norm(v)))&&r.some(v=>norm(v)==='mdmstatus'));
 if(hr){const drop=new Set();hr.forEach((v,i)=>{if(['branchcode','mobile'].includes(norm(v)))drop.add(i);});
 if(drop.size)matrix=matrix.map(r=>r.filter((_,i)=>!drop.has(i)));}}
 const hi=matrix.findIndex(r=>r.some(v=>aliases.id.includes(norm(v))));if(hi<0)throw Error('Agent ID header not found.');
 const h=matrix[hi].map(norm), col=k=>h.findIndex(v=>(aliases[k]||[]).includes(v));
 const end=(filename.match(/to[ _-]*(\d{4}-\d{2}-\d{2})/i)||[])[1]||forcedDate;
 const start=(filename.match(/from[ _-]*(\d{4}-\d{2}-\d{2})/i)||[])[1]||(end?end.slice(0,7)+'-01':null);
 const multi=h.includes('total')&&(h.includes('yesterday'));
 const canara=multi&&h.includes('mdmstatus');
 const bob=multi&&!canara&&h.includes('grade')&&norm(matrix[hi+1]?.[15])==='transactions'&&norm(matrix[hi+1]?.[26])==='nparecovery';
 const boi=multi&&!canara&&!bob&&h.includes('grade')&&norm(matrix[hi+1]?.[21])==='txns';
 if(multi&&!canara&&!boi&&!bob)throw Error('Unrecognized bank report layout. Use a daily CSV with Transaction Count and Transaction Amount headers.');
 let count=col('txnCount'),amount=col('txnAmount');
 if(multi){ count=canara?16:bob?15:21;amount=canara?17:bob?16:22;
 if(canara&&(norm(matrix[hi+1]?.[14])!=='accts'||norm(matrix[hi+1]?.[34])!=='accts'))throw Error('Canara account columns changed. Upload cancelled to protect counts.');
 if(norm(matrix[hi+2]?.[count])!==(canara?'txncnt':'count')||norm(matrix[hi+2]?.[amount])!==(canara?'txnvol':'volume'))throw Error('Bank report columns changed. Upload cancelled to protect totals.');
 }else if(count<0||amount<0)throw Error('Transaction Count and Transaction Amount columns are required.');
 const keys=['txnCount','txnAmount','activeCustomers','pmsby','pmjjby','apy','newAccounts','rank5','loanLeads','recovery','recoveryCount'];
 const totalMap=canara?{txnCount:16,txnAmount:17,activeCustomers:14,newAccounts:14,pmsby:22,pmjjby:23,apy:24,rank5:30}:bob?{txnCount:15,txnAmount:16,pmsby:17,pmjjby:18,apy:19,loanLeads:22,recovery:27,recoveryCount:26}:boi?{txnCount:21,txnAmount:22,activeCustomers:12,newAccounts:11,pmsby:23,pmjjby:24,apy:25,loanLeads:27,recovery:30,recoveryCount:29}:Object.fromEntries(keys.map(k=>[k,k==='txnCount'?count:k==='txnAmount'?amount:col(k)]));
 if(multi&&col('newAccounts')>=0)totalMap.newAccounts=col('newAccounts');
 const dayMap=canara?{txnCount:35,txnAmount:36,activeCustomers:34,newAccounts:34,pmsby:41,pmjjby:42,apy:43}:bob?{txnCount:32,txnAmount:33,pmsby:34,pmjjby:35,apy:36,loanLeads:39,recovery:44,recoveryCount:43}:{txnCount:42,txnAmount:43,activeCustomers:34,newAccounts:33,pmsby:44,pmjjby:45,apy:46,loanLeads:48,recovery:51,recoveryCount:50};
 const out=[];
 for(const r of matrix.slice(hi+1)){
 const rawId=r[col('id')];const id=String(rawId??'').trim();if(!id||!/^[a-z0-9_-]+$/i.test(id)||id==='0'){if(!multi&&r.some(v=>String(v??'').trim()))throw Error('Missing or invalid BC ID in upload row. Correct the row and retry.');continue;}
 if(multi&&!r[col('ce')])continue;
 const obj={};for(const k of Object.keys(aliases)){let i=col(k);if(i>=0)obj[k]=r[i];}
 obj.id=id;obj.date=multi?date(end):date(obj.date)||date(end);obj.joiningDate=date(obj.joiningDate);obj._cumulative=multi;obj._start=start;obj._bank=canara?'Canara':boi?'BOI':bob?'BOB':null;
 for(const [k,i]of Object.entries(totalMap))if(i>=0){let n=num(r[i]);if(n!==null)obj[k]=n;}
 if(bob){const a=num(r[12]),b=num(r[13]);if(a!==null&&b!==null)obj.newAccounts=a+b;}
 if(obj.txnCount==null||obj.txnAmount==null){if(!multi)throw Error('Transaction count or amount missing for BC ID '+id);continue;}
 if(multi){obj._daily={};for(const[k,i]of Object.entries(dayMap)){const n=num(r[i]);if(n!==null)obj._daily[k]=n;}if(bob){const a=num(r[30]),b=num(r[31]);if(a!==null&&b!==null)obj._daily.newAccounts=a+b;}obj.workDays=num(r[canara?32:bob?28:31]);obj.lastMonthTxn=num(r[canara?15:bob?14:20]);obj.lastLogin=date(r[canara?33:bob?29:32]);}
 out.push(obj);
 }
 if(!out.length)throw Error('No valid agent rows found.');return out;
}
function latestSnapshot(bc,mk){return(bc.snapshots||[]).filter(s=>s.date.slice(0,7)===mk).sort((a,b)=>b.date.localeCompare(a.date))[0];}
function monthMetric(bc,mk,key){if(bc.schemeOverrides?.[mk]?.[key]!=null)return Number(bc.schemeOverrides[mk][key]);const snap=latestSnapshot(bc,mk);let total=snap?Number(snap[key])||0:0;return total+(bc.history||[]).filter(h=>h.date.slice(0,7)===mk&&(!snap||h.date>snap.date)).reduce((s,h)=>s+(Number(h[key])||0),0);}
const dayGap=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
function dailyEntries(bc){
 // Saved days survive replacement/removal of the source report history.
 const entries=new Map((bc.dayPerformance?.days||[]).filter(h=>date(h.date)).map(h=>[h.date,{...h}]));
 const snaps=(bc.snapshots||[]).filter(s=>date(s.date)&&s.txnCount!=null).slice().sort((a,b)=>a.date.localeCompare(b.date));
 for(let i=0;i<snaps.length;i++){
  const cur=snaps[i],saved=entries.get(cur.date);
  const prev=snaps[i-1]|| (saved?.baselineDate?{date:saved.baselineDate,start:saved.baselineStart,txnCount:saved.baselineCount}:null);
  let entry={date:cur.date,txnCount:null,reason:'No earlier cumulative report'};
  if(cur.date.endsWith('-01')&&(!cur.start||cur.start===cur.date))entry={date:cur.date,txnCount:Number(cur.txnCount),source:'calculated'};
  else if(prev&&cur.date.slice(0,7)===prev.date.slice(0,7)&&(!prev.start||!cur.start||prev.start===cur.start)){
   const delta=Number(cur.txnCount)-Number(prev.txnCount),gap=dayGap(prev.date,cur.date);
   entry=gap===1&&delta>=0?{date:cur.date,txnCount:delta,source:'calculated',baselineDate:prev.date,baselineCount:Number(prev.txnCount),baselineStart:prev.start}:{date:cur.date,txnCount:null,reason:delta<0?'Cumulative total decreased: check report':'Report gap: '+prev.date+' to '+cur.date,intervalCount:delta>=0?delta:null};
  }
  // A retained calculated day can outlive its earlier cumulative baseline.
  // Recalculate whenever that baseline is available; otherwise keep the saved result.
  if(saved&&saved.txnCount!=null&&saved.source!=='calculated')continue;
  entries.set(cur.date,entry);
 }
 // Explicit daily figures always take precedence over calculated totals.
 for(const h of bc.history||[])if(date(h.date)&&h.txnCount!=null&&h.txnCount!==''&&Number.isFinite(Number(h.txnCount)))entries.set(h.date,{...h,txnCount:Number(h.txnCount),source:h.source||'reported'});
 return [...entries.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
function refreshDayPerformance(bc){
 const entries=dailyEntries(bc);bc.dayPerformance={version:2,days:entries.slice(-2)};return bc;
}
function dayComparison(bc){
 const days=bc.dayPerformance?.version===2?bc.dayPerformance.days:dailyEntries(bc).slice(-2),latest=days.at(-1)||null;
 const previous=latest?days.find(h=>dayGap(h.date,latest.date)===1)||null:null;
 const valid=h=>h&&h.txnCount!=null&&Number.isFinite(Number(h.txnCount));
 const change=valid(latest)&&valid(previous)?latest.txnCount-previous.txnCount:null;
 return {latest,previous,change};
}
function applyRows(bcs,rows,bank,ce,endDate){
 const seen=new Set();
 const by=Object.fromEntries(bcs.map(b=>[b.id,JSON.parse(JSON.stringify(b))]));let created=0,updated=0,duplicate=0,skippedCe=0;const touched=[];
 for(const r of rows){if(r.ce&&norm(r.ce)!==norm(ce)){skippedCe++;continue;}if(r._bank&&r._bank!==bank)throw Error('This report is for '+r._bank+'. Select that bank first.');const d=date(r.date)||endDate;if(!d)throw Error('Choose the report date.');if(!date(d))throw Error('Invalid report date.');if(r._cumulative&&r._start&&r._start!==d.slice(0,7)+'-01')throw Error('Cumulative reports must start on the first day of the month.');
 const externalId=String(r.id??'').trim();if(!externalId||!/^[a-z0-9_-]+$/i.test(externalId))throw Error('Missing or invalid BC ID.');
 if(r.bank&&norm(r.bank)!==norm(bank))throw Error('Bank mismatch for BC ID '+externalId);
 const key=externalId+'|'+d;if(seen.has(key))throw Error('Duplicate BC ID and date in upload: '+externalId);seen.add(key);
 const matches=Object.values(by).filter(b=>b.bank===bank&&(String(b.bankBcId||b.displayId||'')===externalId||b.id===bank+'-'+externalId||b.id===externalId));
 if(matches.length>1)throw Error('Duplicate BC ID in saved roster: '+externalId);
 const id=matches[0]?.id||bank+'-'+externalId;let bc=by[id];if(!bc&&!String(r.name||'').trim())throw Error('BC name required for new ID '+externalId);if(!bc){created++;bc=by[id]={id,displayId:r.id,bank,name:r.name||r.id,joiningDate:r.joiningDate||'',status:'Unknown',history:[],snapshots:[],followups:[],notes:'',actionPlan:'',schemes:{}};}else updated++;
 bc.bankBcId=externalId;bc.displayId=externalId;bc.history=bc.history||[];bc.snapshots=bc.snapshots||[];
 for(const k of ['name','village','mandal','district','contact','ce','joiningDate','workDays','lastLogin'])if(r[k]!=null&&r[k]!==''&&!(k==='contact'&&bc.contactImportSource&&bc.contact))bc[k]=r[k];
 if(r.status){bc.sourceStatus=String(r.status);bc.status=norm(r.status)==='active'?'Active':/block|delet|inactiv|kycpend/i.test(r.status)?'Inactive':'Unknown';}
 const metrics={};for(const k of ['txnCount','txnAmount','activeCustomers','pmsby','pmjjby','apy','newAccounts','rank5','loanLeads','recovery','recoveryCount'])if(r[k]!=null)metrics[k]=num(r[k]);
 if(r._cumulative){let snap={date:d,start:r._start||d.slice(0,7)+'-01',...metrics};let i=bc.snapshots.findIndex(s=>s.date===d);if(i>=0){bc.snapshots[i]=snap;duplicate++;}else bc.snapshots.push(snap);
 if(r.lastMonthTxn!=null){const p=new Date(d.slice(0,7)+'-01T12:00:00Z');p.setUTCDate(0);let pd=p.toISOString().slice(0,10);if(!bc.snapshots.some(s=>s.date===pd))bc.snapshots.push({date:pd,txnCount:r.lastMonthTxn});}
 // Re-uploading a cumulative report must not leave its old Yesterday values behind.
 bc.history=bc.history.filter(h=>!(h.date===d&&h.source==='report'));
 if(bc.dayPerformance?.days)bc.dayPerformance.days=bc.dayPerformance.days.filter(h=>!(h.date===d&&h.source==='report'));
 if(r._daily&&r._daily.txnCount!=null){const daily={};for(const[k,v]of Object.entries(r._daily))daily[k]=num(v);bc.history=bc.history.filter(h=>h.date!==d);bc.history.push({date:d,...daily,source:'report'});}
 }else{let i=bc.history.findIndex(h=>h.date===d);let h={date:d,...metrics};if(i>=0){bc.history[i]=h;duplicate++;}else bc.history.push(h);}
 if(bc.schemeOverrides?.[d.slice(0,7)]){for(const k of Object.keys(metrics))delete bc.schemeOverrides[d.slice(0,7)][k];}
 if(r.workDays!=null)bc.workDaysMonth=d.slice(0,7);
 bc.history.sort((a,b)=>a.date.localeCompare(b.date));bc.snapshots.sort((a,b)=>a.date.localeCompare(b.date));
 const latest=[...bc.snapshots,...bc.history].map(x=>x.date).sort().pop();const mk=latest.slice(0,7);bc.schemes=Object.fromEntries(['pmsby','pmjjby','apy','newAccounts','rank5','loanLeads','recovery','recoveryCount'].map(k=>[k,monthMetric(bc,mk,k)]));refreshDayPerformance(bc);touched.push(id);
 }
 if(!touched.length)throw Error('No rows match CE '+ce+'.');return{bcs:Object.values(by),touched,summary:{records:rows.length,created,updated,duplicate,skippedCe,errors:0,dateFallback:0,bank}};
}
root.PerformanceCore={norm,num,date,parseText,parseMatrix,monthMetric,applyRows,dailyEntries,refreshDayPerformance,dayComparison};
})(typeof window==='undefined'?globalThis:window);
