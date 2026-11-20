(function(root){
const month='2026-09',sourceId='suresh-sep2026-image-v1';
const columns=[['activeBc','Active BC'],['txn','Transactions'],['avgTxn','Average txn'],['highTxnBcs','BCs ≥500 txn'],['loginBcs','BCs with 24 login days'],['pmsby','PMSBY'],['pmjjby','PMJJBY'],['apy','APY'],['totalSss','Total SSS'],['avgSss','Average SSS'],['loanLeadBcs','Loan Lead BCs'],['loanLeads','Loan Leads count'],['recoveryBcs','Recovery BCs'],['recoveryCount','Recovery count']];
const raw=[['BOB',5,158,32,0,1,11,10,1,22,4.4,0,0,0,0],['BOI',12,789,66,6,2,39,30,15,84,7,4,46,1,1],['Canara',22,6278,285,7,11,27,22,2,51,2.3,0,0,0,0],['UBI',2,350,175,0,3,10,6,1,17,8.5,0,0,0,0],['IB',1,0,0,0,0,0,0,0,0,0,0,0,0,0],['UCO',1,100,100,0,0,3,0,0,3,3,0,0,0,0]];
const targets=Object.fromEntries(raw.map(r=>[r[0],{...Object.fromEntries(columns.map(([key],i)=>[key,r[i+1]])),sourceId,sourceMonth:month,recovery:0}]));
const C=()=>root.PerformanceCore;
const prev=mk=>{const d=new Date(mk+'-01T12:00:00Z');d.setUTCDate(0);return d.toISOString().slice(0,7);};
const fixedMonth='2026-11';
const fixedKeys=['newAccounts','pmsby','pmjjby','apy'];
// CE B Suresh only, supplied bank reports ending 2026-10-31. Values are October transactions, never November achievements.
const novemberBaseline={"BOB-15590034":36,"BOB-15590104":3,"BOB-15590388":15,"BOB-15590416":3,"Canara-11151550":0,"Canara-11153093":200,"Canara-11153203":1,"Canara-11153213":0,"Canara-11151671":0,"Canara-11152687":5,"Canara-11152800":0,"Canara-11151714":0,"Canara-11152059":0,"Canara-11152143":0,"Canara-11152718":0,"Canara-11153094":0,"Canara-11151552":0,"Canara-11152058":0,"Canara-11152282":0,"Canara-11152287":0,"Canara-11151297":0,"Canara-11151749":14,"Canara-11151229":0,"Canara-11151627":12,"Canara-11151303":20,"Canara-11151555":0,"Canara-11151580":180,"Canara-11151004":91,"Canara-11151015":43,"Canara-11151054":0,"Canara-11151055":108,"Canara-11151060":214,"Canara-11151007":521,"Canara-11151013":163,"Canara-11151017":1380,"Canara-11151031":578,"Canara-11151041":22,"Canara-11151059":0,"Canara-11151003":843,"Canara-11151025":362,"Canara-11151035":760,"Canara-11151056":0,"Canara-11152202":0,"Canara-11152337":0,"Canara-11152528":0,"Canara-11151008":78,"Canara-11151014":0,"Canara-11151033":497,"Canara-11151897":0,"Canara-11151376":0,"Canara-11152161":76,"Canara-11151908":36,"BOI-11550182":0,"BOI-11550255":0,"BOI-11550335":50,"BOI-11550508":0,"BOI-11550599":0,"BOI-11550713":0,"BOI-11550747":0,"BOI-11551003":0,"BOI-11551023":0,"BOI-11550540":11,"BOI-11550919":0,"BOI-11550979":0,"BOI-11551001":0,"BOI-11550515":51,"BOI-11550645":26,"BOI-11550654":0,"BOI-11550670":48,"BOI-11550674":91,"BOI-11550523":89,"BOI-11550552":0,"BOI-11550585":4,"BOI-11550632":0,"BOI-11550763":356,"BOI-11550980":0,"BOI-11551019":11,"BOI-11551242":23,"BOI-11551240":42};
const novemberApproved={"BOB-15590034":350,"BOB-15590388":300,"BOB-15590416":300,"BOB-15590104":300,"Canara-11151017":1400,"Canara-11151003":1250,"Canara-11151035":1150,"Canara-11151031":850,"Canara-11151007":800,"Canara-11151033":750,"Canara-11151025":550,"Canara-11151060":350,"Canara-11153093":300,"Canara-11151580":300,"Canara-11151013":300,"Canara-11151055":300,"Canara-11151004":300,"Canara-11151008":300,"Canara-11152161":300,"Canara-11151015":300,"Canara-11151908":300,"Canara-11151041":300,"Canara-11151303":300,"Canara-11151749":300,"Canara-11151627":300,"Canara-11152687":300,"Canara-11153203":300,"BOI-11550763":550,"BOI-11550674":300,"BOI-11550523":300,"BOI-11550515":300,"BOI-11550335":300,"BOI-11550670":300,"BOI-11551240":300,"BOI-11550645":300,"BOI-11551242":300,"BOI-11550540":300,"BOI-11551019":300,"BOI-11550585":300};
const eligible=(bc,mk)=>mk===fixedMonth?Object.hasOwn(novemberApproved,bc.id):C().monthMetric(bc,mk,'txnCount')>0;
function effective(bc,mk,base={}){if(mk!==fixedMonth)return base;if(!eligible(bc,mk))return {};return {...base,txn:base.targetPlanVersion===3?Math.max(300,Number(base.txn)||novemberApproved[bc.id]):novemberApproved[bc.id],targetPlanVersion:3,...Object.fromEntries(fixedKeys.map(k=>[k,5])),minimumTxn:300,allocationBasis:'2026-10-31 CE B Suresh reports; October transactions >= 1',allocationSource:'November 2026 fixed BC targets',...(bc.bank==='Canara'?{rank5:25}:{})};}
function novemberAllocation(bcs){const bs=bcs.filter(b=>eligible(b,fixedMonth));const out=Object.fromEntries(bs.map(b=>[b.id,effective(b,fixedMonth,b.monthlyTargets?.[fixedMonth]||{})]));
 const loanWeights={'KANITHI SURESH':7,'MADDI VARALAKSHMI':12,'PODINANU LOKESWARI':10,'KOTA SIMHACHALAM':17};
 const boi=bs.filter(b=>b.bank==='BOI');const selected=boi.filter(b=>loanWeights[String(b.name).trim().toUpperCase()]);
 if(!selected.length)selected.push(...boi.slice().sort((a,b)=>(novemberBaseline[b.id]||0)-(novemberBaseline[a.id]||0)).slice(0,4));
 boi.forEach(b=>Object.assign(out[b.id],{loanLeads:0,recovery:0,recoveryCount:0}));
 const amounts=split(46,selected.map(b=>loanWeights[String(b.name).trim().toUpperCase()]||1));selected.forEach((b,i)=>out[b.id].loanLeads=amounts[i]);
 return out;
}
function split(total,weights){if(!weights.length)return [];total=Math.max(0,Math.round(Number(total)||0));const sum=weights.reduce((s,w)=>s+w,0);const raw=weights.map(w=>sum?total*w/sum:total/weights.length);const out=raw.map(Math.floor);const order=raw.map((v,i)=>({i,f:v-out[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);let left=total-out.reduce((s,v)=>s+v,0);for(let i=0;i<left;i++)out[order[i%order.length].i]++;return out;}
function allocate(bcs,target,mk){if(!bcs.length)return{};if(mk===fixedMonth)return novemberAllocation(bcs);
 const pm=prev(mk);let weights=bcs.map(b=>C().monthMetric(b,pm,'txnCount'));let basis=pm;
 if(!weights.some(w=>w>0)){weights=bcs.map(b=>C().monthMetric(b,mk,'txnCount'));basis=mk;}
 if(!weights.some(w=>w>0)){weights=bcs.map(()=>1);basis='Equal split';}
 const order=weights.map((w,i)=>({w,i,id:bcs[i].id})).sort((a,b)=>b.w-a.w||a.id.localeCompare(b.id));
 const out=Object.fromEntries(bcs.map(b=>[b.id,{allocationBasis:basis,allocationSource:'Bank monthly target',txn:0,pmsby:0,pmjjby:0,apy:0,loanLeads:0,recovery:0,recoveryCount:0,loginDays:0,minimumTxn:0}]));
 const n=bcs.length;const high=Math.min(n,Math.max(0,Math.round(target.highTxnBcs||0)));const total=Math.max(0,Math.round(target.txn||0));
 const minimum=Array(n).fill(total>=n?1:0);
 if(high*500+(n-high)<=total){order.slice(0,high).forEach(({i})=>minimum[i]=500);}
 const remaining=total-minimum.reduce((s,v)=>s+v,0);const transaction=split(Math.max(0,remaining),weights);
 bcs.forEach((b,i)=>{out[b.id].txn=minimum[i]+transaction[i];out[b.id].minimumTxn=minimum[i]===500?500:0;});
 for(const key of ['pmsby','pmjjby','apy','recovery']){const vals=split(target[key],Array(n).fill(1));bcs.forEach((b,i)=>out[b.id][key]=vals[i]);}
 for(const[key,slots]of [['loanLeads',target.loanLeadBcs],['recoveryCount',target.recoveryBcs]]){const selected=order.slice(0,Math.min(n,Math.max(1,Math.round(slots||n))));const vals=split(target[key],selected.map(()=>1));selected.forEach(({i},j)=>out[bcs[i].id][key]=vals[j]);}
 order.slice(0,Math.max(0,Math.round(target.loginBcs||0))).forEach(({i})=>out[bcs[i].id].loginDays=24);
 bcs.forEach(b=>{if(b.bank==='Canara')out[b.id].rank5=25;});return out;
}
function warnings(target,count){const out=[];if(target.highTxnBcs*500>target.txn)out.push(`The ≥500 txn goal needs at least ${target.highTxnBcs*500} transactions, above the bank total ${target.txn}. No conflicting 500-txn targets were assigned.`);if(target.loginBcs>target.activeBc)out.push(`24-day login BC goal (${target.loginBcs}) exceeds the Active BC target (${target.activeBc}).`);if(count!==target.activeBc)out.push(`Image Active BC target: ${target.activeBc}. Eligible BCs on file: ${count}. Allocation uses available BCs.`);if(!count)out.push('BC data is missing. Bank target saved; BC allocation pending.');return out;}
function migrate(bcs,settings){let s={...settings};let next=bcs;let changedSettings=false,changedBcs=false;
 if(s.importedTargetSource!==sourceId){s={...s,targetsByMonth:{...s.targetsByMonth,[month]:{...(s.targetsByMonth?.[month]||{}),...targets}},importedTargetSource:sourceId,targetDisplayMonth:month};changedSettings=true;}
 const done={...(s.importedTargetAllocations||{})};
 for(const [bank,target]of Object.entries(s.targetsByMonth?.[month]||{})){if(target.sourceId!==sourceId||done[bank])continue;const bs=next.filter(b=>b.bank===bank&&eligible(b,month));if(!bs.length)continue;const allocation=allocate(bs,target,month);next=next.map(b=>allocation[b.id]?{...b,monthlyTargets:{...b.monthlyTargets,[month]:allocation[b.id]}}:b);done[bank]=true;changedBcs=true;changedSettings=true;}
 if(changedSettings)s.importedTargetAllocations=done;
 const allocation=novemberAllocation(next);
 next=next.map(b=>{const old=b.monthlyTargets?.[fixedMonth];const t=allocation[b.id];if(!t){if(old&&(Object.hasOwn(novemberBaseline,b.id)&&novemberBaseline[b.id]===0||old.allocationSource==='November 2026 fixed BC targets')){const monthlyTargets={...b.monthlyTargets};delete monthlyTargets[fixedMonth];changedBcs=true;return {...b,monthlyTargets};}return b;}if(JSON.stringify(old)===JSON.stringify(t))return b;changedBcs=true;return {...b,monthlyTargets:{...b.monthlyTargets,[fixedMonth]:t}};});
 const bankTotals={};for(const bank of ['Canara','BOI','BOB']){const bs=next.filter(b=>b.bank===bank&&allocation[b.id]);const totals={activeBc:bs.length,txn:0,newAccounts:0,pmsby:0,pmjjby:0,apy:0,loanLeads:0,recovery:0,recoveryCount:0,sourceId:'suresh-nov2026-approved-v3',eligibilitySource:'CE B Suresh reports through 2026-10-31; October transactions >= 1'};for(const b of bs)for(const k of ['txn','newAccounts','pmsby','pmjjby','apy','loanLeads','recovery','recoveryCount'])totals[k]+=Number(allocation[b.id][k])||0;bankTotals[bank]=totals;}
 const novemberSettings={...(s.targetsByMonth?.[fixedMonth]||{}),...bankTotals};
 if(JSON.stringify(s.targetsByMonth?.[fixedMonth])!==JSON.stringify(novemberSettings)||s.novemberFixedTargetsVersion!==3){s={...s,novemberFixedTargetsVersion:3,targetDisplayMonth:fixedMonth,targetsByMonth:{...s.targetsByMonth,[fixedMonth]:novemberSettings}};changedSettings=true;}
 return{settings:s,bcs:next,changedSettings,changedBcs};
}
root.TargetPlan={month,sourceId,columns,targets,eligible,allocate,warnings,migrate,effective,fixedMonth,novemberBaseline,novemberApproved};
})(typeof window==='undefined'?globalThis:window);
