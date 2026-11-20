/* Read-only answers from the same saved performance records used by the app. */
(function(root){
  'use strict';
  const valid=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0;
  const schemeKeys=['pmsby','pmjjby','apy','newAccounts'];
  const format=v=>v==null?'డేటా లేదు':Number(v).toLocaleString('en-IN');
  function metric(q){
    for(const key of ['pmsby','pmjjby','apy'])if(q.includes(key))return key;
    if(/new accounts?|కొత్త ఖాతా/.test(q))return 'newAccounts';
    if(/scheme|స్కీమ్|స్కీముల/.test(q))return 'schemes';
    return /amount|value|volume|మొత్తం విలువ|అమౌంట్/.test(q)?'txnAmount':'txnCount';
  }
  function monthly(bc,mk,key){
    if(key==='schemes'){const values=schemeKeys.map(k=>monthly(bc,mk,k));return values.every(valid)?values.reduce((a,b)=>a+b,0):null;}
    const snap=(bc.snapshots||[]).filter(h=>h.date?.slice(0,7)===mk).slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    const override=bc.schemeOverrides?.[mk]?.[key];
    if(override!=null)return valid(override)?Number(override):null;
    const later=(bc.history||[]).filter(h=>h.date?.slice(0,7)===mk&&(!snap||h.date>snap.date));
    if(snap&&!valid(snap[key]))return null;
    if(!snap&&!later.length || later.some(h=>!valid(h[key])))return null;
    return root.PerformanceCore.monthMetric(bc,mk,key);
  }
  function day(bc,date,key){
    const row=root.PerformanceCore.dailyEntries(bc).find(h=>h.date===date);
    if(!row)return null;
    if(key==='schemes'){const values=schemeKeys.map(k=>row[k]);return values.every(valid)?values.reduce((a,b)=>a+Number(b),0):null;}
    return valid(row[key])?Number(row[key]):null;
  }
  function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  function answer(q,bcs,mk){
    if(!/top|best performer|టాప్|అత్యుత్తమ/.test(q))return null;
    const key=metric(q);
    const explicit=q.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    const isDay=!!explicit||/today|daily|of the day|ఈ రోజు|ఈరోజు|డైలీ|రోజు/.test(q);
    let date=explicit;
    if(date&&!root.PerformanceCore.date(date))return 'తేదీ సరిగా లేదు. YYYY-MM-DD రూపంలో చెప్పండి.';
    if(!date&&/today|ఈ రోజు|ఈరోజు/.test(q))date=today();
    if(isDay&&!date)date=bcs.flatMap(b=>root.PerformanceCore.dailyEntries(b).map(h=>h.date)).filter(d=>d.slice(0,7)===mk).sort().at(-1);
    const rows=bcs.map(bc=>({bc,value:isDay?(date?day(bc,date,key):null):monthly(bc,mk,key)})).filter(r=>valid(r.value));
    const period=isDay?(date||'ఎంచుకున్న రోజు'):mk;
    if(!rows.length)return period+' కోసం అడిగిన పనితీరు డేటా లేదు.';
    rows.sort((a,b)=>b.value-a.value||String(a.bc.name).localeCompare(String(b.bc.name)));
    const label=key==='txnCount'?'లావాదేవీల సంఖ్య':key==='txnAmount'?'లావాదేవీల విలువ':key==='schemes'?'PMSBY, PMJJBY, APY, కొత్త ఖాతాల మొత్తం':key;
    return period+' · '+label+' ఆధారంగా టాప్ '+Math.min(3,rows.length)+': '+rows.slice(0,3).map((r,i)=>(i+1)+'. '+r.bc.name+' '+format(r.value)).join('; ')+'.'+(rows.length<bcs.length?' డేటా అందుబాటులో ఉన్న '+rows.length+' మంది నుంచి లెక్కించాను.':'')+(rows.length>3&&rows[2].value===rows[3].value?' మూడో స్థానంలో సమాన ఫలితాలు ఉన్నాయి.':'');
  }
  function profile(q,bc,bcs,mk){
    const count=monthly(bc,mk,'txnCount');
    if(/why|ఎందుకు/.test(q)){
      const t=root.ManagerInsights.trend(bc,mk);
      return bc.name+' · '+mk+' లావాదేవీలు '+format(count)+'. '+(t.insufficient||!t.eligible?'తగ్గుదల పోలికకు పూర్తి రోజువారీ డేటా లేదు.':t.pctChange!=null?'గత ఏడు రోజుల మార్పు '+t.pctChange.toFixed(1)+' శాతం.':'పోలిక డేటా లేదు.')+' అసలు కారణం ఈ పనితీరు డేటాలో నమోదు కాలేదు.';
    }
    const values=bcs.map(b=>monthly(b,mk,'txnCount')).filter(valid);
    const rank=count==null?null:1+values.filter(n=>n>count).length;
    return bc.name+' · '+bc.bank+' · '+mk+'. లావాదేవీలు '+format(count)+', విలువ '+format(monthly(bc,mk,'txnAmount'))+' రూపాయలు. '+schemeKeys.map(k=>k+' '+format(monthly(bc,mk,k))).join(', ')+'. ఎంపిక చేసిన బ్యాంక్ పరిధిలో కౌంట్ ర్యాంక్ '+format(rank)+'.';
  }
  root.SiriData={answer,profile,monthly,day};
})(typeof window==='undefined'?globalThis:window);
