(function(root){
const records=[],pending=[],sourceId="master-contacts-c3a4f063c707";
function apply(bcs){
 const by=new Map(bcs.map(b=>[b.id,b]));let updated=0,created=0,matched=0;
 for(const record of records){const existing=by.get(record.id);if(existing){matched++;if(existing.contactImportSource===sourceId)continue;by.set(record.id,{...existing,contact:record.contact,contactImportSource:sourceId});updated++;}
 else{by.set(record.id,{...record,status:'Unknown',sourceStatus:'Master roster; performance status unavailable',history:[],snapshots:[],followups:[],notes:'',actionPlan:'',schemes:{},contactImportSource:sourceId});created++;}}
 return {bcs:Array.from(by.values()),changed:updated+created>0,summary:{mapped:records.length,pending:pending.length,matched,updated,created}};
}
root.MasterContacts={records,pending,sourceId,apply};
})(typeof window==='undefined'?globalThis:window);
