/* Three-way merge: preserve unrelated bank/device changes; reject competing edits. */
(function(root){
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  function merge(base,local,remote,path='data'){
    if(equal(local,base))return remote;
    if(equal(remote,base)||equal(local,remote))return local;
    if(Array.isArray(local)&&Array.isArray(remote)&&Array.isArray(base)&&[...base,...local,...remote].every(x=>object(x)&&x.id!=null)){
      const index=a=>new Map(a.map(x=>[String(x.id),x]));
      const b=index(base),l=index(local),r=index(remote);
      if(b.size!==base.length||l.size!==local.length||r.size!==remote.length)throw Error('Duplicate record IDs.');
      return [...new Set([...r.keys(),...l.keys(),...b.keys()])].map(id=>merge(b.get(id),l.get(id),r.get(id),path+'.'+id)).filter(x=>x!==undefined);
    }
    if(object(local)&&object(remote)&&(base===undefined||object(base))){
      const result={};
      for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
        const value=merge(base?.[key],local[key],remote[key],path+'.'+key);
        if(value!==undefined)result[key]=value;
      }
      return result;
    }
    throw Error('The same record changed on another device. Export a backup, reload, then retry this upload.');
  }
  root.StateMerge={merge};
})(globalThis);
