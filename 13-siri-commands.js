/* Shared bilingual navigation catalog. Reads app names; never writes records. */
(function(root){
'use strict';
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[.,!?;:।]/g,' ').replace(/బి\s*సి(?:లు)?|బీసీలు|బీసి|బిసి/g,'బీసీ').replace(/బాంక్|బేంక్/g,'బ్యాంక్').replace(/టాబ్|ట్యాబు/g,'ట్యాబ్').replace(/చెయ్యి|చేయండి|చెయ్యండి|చెయ్/g,'చేయి').replace(/\s+/g,' ').trim();
const banks={Canara:['canara','canera','కెనరా','కెనారా','కనరా','కనారా','కెనర','కెన రా'],BOI:['bank of india','బ్యాంక్ ఆఫ్ ఇండియా బ్యాంక్','bank of ఇండియా','బ్యాంక్ ఆఫ్ ఇండియా','బ్యాంక్ అఫ్ ఇండియా','బ్యాంకు ఆఫ్ ఇండియా','బ్యాంక్ ఆఫ్ ఇండియాకు','boi','b o i','బిఓఐ','బీఓఐ','బి ఓ ఐ'],BOB:['bank of baroda','baroda','బరోడా','bob','b o b','బాబ్'],UBI:['union bank','యూనియన్','ubi','u b i','యూబీఐ'],IB:['indian bank','ఇండియన్ బ్యాంక్','i b'],UCO:['uco','యూకో','యుకో']};
const pages=[['feed','Daily Feed',/daily feed|డైలీ ఫీడ్|అప్‌లోడ్ పేజీ|upload page/],['leads','New BCs',/new bcs?\b|కొత్త బీసీ|న్యూ బీసీ/],['rank5','Canara Rank 5',/rank\s*(?:5|five)|ర్యాంక్\s*(?:5|ఫైవ్)/],['dayperf','Day Performance',/\bdaily\b|day performance|డైలీ|డెయిలీ|రోజువారీ|రోజు పనితీరు|డే పర్ఫా/],['schemes','Schemes',/schemes?|స్కీమ్|స్కీముల|స్కీమ్స్/],['bcs','BCs',/\bbcs?\b|bc list|బి సీలు|బీసీలు|బీసీ|బి సి/],['visits','Field Visits',/\bfield\b|\bvisits?\b|ఫీల్డ్|విజిట్/],['targets','Targets',/targets?|టార్గెట్|లక్ష్య/],['reports','Reports',/reports?|రిపోర్ట్|నివేదిక/],['dashboard','Dashboard',/dashboard|\bhome\b|డాష్|హోమ్|ముఖ్య పేజీ/],['areas','Area Analysis',/area analysis|\bareas?\b|ఏరియా|ప్రాంత విశ్లేషణ/],['priority','Priority',/priority|ప్రయారిటీ|ప్రాధాన్య/],['bank','Bank',/^(?:open |show )?bank$|^(?:ఓపెన్ )?బ్యాంక్$|bank\s*(?:tab|page|data|details|summary|performance)|బ్యాంక్\s*(?:ట్యాబ్|పేజీ|డేటా|వివరా|పనితీరు)|బ్యాంకు\s*(?:పేజీ|డేటా)|(?:^|\s)(?:bank|బ్యాంక్|బ్యాంకు)(?=\s|$)/]];
function bankMatches(q,bcs){const codes=[...new Set([...Object.keys(banks),...bcs.map(b=>b.bank).filter(Boolean)])];return codes.filter(code=>[normalize(code),...(banks[code]||[])].some(a=>new RegExp('(?:^|[\\s])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[\\s]|కి|కు|లో|ను|తో)').test(q)));}
// Remove navigation vocabulary before looking for a person; never treat a tab as a BC name.
function bcQuery(text){return normalize(text).replace(/^(?:siri|సిరి)\s*/,'').replace(/\b(?:open|show|please|details|profile|information|of|the|bc|bcs|list|tab|page)\b/g,' ').replace(/ఓపెన్|తెరవండి|తెరువు|తెరవు|తెరుచు|చేయి|చూపించు|చూపించండి|ప్లీజ్|దయచేసి|ప్రొఫైల్|వివరాలు|లిస్ట్|జాబితా|డేటా|బీసీ|ట్యాబ్|పేజీ/g,' ').replace(/(?:^|\s)(?:ని|ను|లో|లోకి)(?=\s|$)/g,' ').replace(/\s+/g,' ').trim();}
function isNavigation(q){return /(?:^|\s)(?:open|show|ఓపెన్|తెరవండి|తెరువు|తెరవు|తెరుచు|చూపించు|చూపించండి)(?=\s|$)/.test(q);}
// Conservative cross-script comparison: preserve every consonant and word boundary.
// Vowels vary in English spellings; collisions stay ambiguous in the caller.
function nameKey(text){
 const consonants={'క':'k','ఖ':'kh','గ':'g','ఘ':'gh','ఙ':'ng','చ':'ch','ఛ':'chh','జ':'j','ఝ':'jh','ఞ':'ny','ట':'t','ఠ':'th','డ':'d','ఢ':'dh','ణ':'n','త':'t','థ':'th','ద':'d','ధ':'dh','న':'n','ప':'p','ఫ':'ph','బ':'b','భ':'bh','మ':'m','య':'y','ర':'r','ఱ':'r','ల':'l','ళ':'l','వ':'v','శ':'sh','ష':'sh','స':'s','హ':'h'};
 const vowels={'అ':'a','ఆ':'aa','ఇ':'i','ఈ':'ii','ఉ':'u','ఊ':'uu','ఋ':'ri','ఎ':'e','ఏ':'e','ఐ':'ai','ఒ':'o','ఓ':'oo','ఔ':'au'};
 const marks={'ా':'aa','ి':'i','ీ':'ii','ు':'u','ూ':'uu','ృ':'ri','ె':'e','ే':'e','ై':'ai','ొ':'o','ో':'oo','ౌ':'au','్':''};
 const chars=Array.from(normalize(text));let out='';
 for(let i=0;i<chars.length;i++){
  const ch=chars[i];
  if(consonants[ch]){out+=consonants[ch];if(Object.hasOwn(marks,chars[i+1]))out+=marks[chars[++i]];else out+='a';}
  else out+=vowels[ch]??({'ం':'m','ః':'h','‌':'','‍':''}[ch]??ch);
 }
 return out.replace(/([aeiou])y(?=[aeiou])/g,'$1').replace(/aa/g,'a').replace(/ii/g,'i').replace(/ee/g,'i').replace(/oo|uu/g,'u').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
function bcMatches(q,bcs){
 const name=bcQuery(q);if(!name)return [];
 const matches=(value,query)=>value===query||(value.length>=4&&(' '+query+' ').includes(' '+value+' '));
 const aliases=b=>[b.name,b.displayId,b.bankBcId,b.id,...(Array.isArray(b.voiceAliases)?b.voiceAliases:[])].filter(Boolean);
 const exact=bcs.filter(b=>aliases(b).some(n=>matches(normalize(n),name)));
 if(exact.length)return exact;
 // Cross-script fallback applies only to names/explicit aliases, never record IDs.
 if(!/[\u0c00-\u0c7f]/.test(name)&&!bcs.some(b=>/[\u0c00-\u0c7f]/.test(b.name||'')))return [];
 const key=nameKey(name);
 return bcs.filter(b=>[b.name,...(Array.isArray(b.voiceAliases)?b.voiceAliases:[])].filter(Boolean).some(n=>matches(nameKey(n),key)));
}
// Recognition alternatives are considered only when the first transcript is unrecognized.
function choose(text,alternatives,bcs){
 const choices=[text,...(Array.isArray(alternatives)?alternatives:[])].map(normalize).filter(Boolean);
 const known=q=>!!pages.find(([, ,re])=>re.test(q))||bankMatches(q,bcs).length>0||bcMatches(q,bcs).length>0||/top|టాప్/.test(q);
 return choices.find(known)||choices[0]||'';
}
root.SiriCommands={normalize,banks,pages,bankMatches,bcQuery,bcMatches,choose,isNavigation};
})(typeof window==='undefined'?globalThis:window);
