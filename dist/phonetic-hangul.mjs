// English IPA -> approximate Korean reading aid, not a phonetic transcription standard.
const INITIAL = {p:17,b:7,t:16,d:3,k:15,g:0,f:17,v:7,s:9,z:12,'ʃ':9,'ʒ':12,'tʃ':14,'dʒ':12,'θ':9,'ð':3,h:18,m:6,n:2,'ŋ':11,l:5,r:5,'ɾ':5};
const MEDIAL = {'ɑ':0,'ɒ':0,'æ':1,'ʌ':4,'ə':4,'ɛ':5,'e':5,'ɜ':4,'ɝ':4,'ɚ':4,'ɔ':8,'o':8,'u':13,'ʊ':13,'ɯ':18,'i':20,'ɪ':20,'ɨ':18};
const Y = {0:2,1:3,4:6,5:7,8:12,13:17,18:20,20:20};
const W = {0:9,1:10,4:14,5:15,8:8,13:13,20:16};
const CODA = {m:16,n:4,'ŋ':21,l:8,r:8};
const DIPHTHONG = {'eɪ':['e','i'],'aɪ':['ɑ','i'],'ɔɪ':['ɔ','i'],'aʊ':['ɑ','u'],'oʊ':['o','u'],'əʊ':['o','u']};
const syllable = (initial, medial, final=0) => String.fromCharCode(0xac00 + ((initial * 21 + medial) * 28) + final);
const standalone = c => syllable(INITIAL[c] ?? 11, c==='ʃ'||c==='ʒ'||c==='tʃ'||c==='dʒ'?20:18);

export function ipaToHangul(ipa) {
  const clean=String(ipa).normalize('NFD').replace(/[ˈˌːˑ\u0300-\u036f\u0361]/g,'').replace(/[ɹɻ]/g,'r').replace(/ɫ/g,'l').replace(/ɡ/g,'g').replace(/ɐ/g,'ə').replace(/ɹ/g,'r');
  const units=clean.match(/tʃ|dʒ|eɪ|aɪ|ɔɪ|aʊ|oʊ|əʊ|./gu)||[];
  const vowel=c=>Object.hasOwn(MEDIAL,c)||Object.hasOwn(DIPHTHONG,c);
  if(units.some(c=>!vowel(c)&&!Object.hasOwn(INITIAL,c)&&c!=='j'&&c!=='w'))return null;
  let result='',i=0;
  while(i<units.length){
    const onset=[];
    while(i<units.length&&!vowel(units[i]))onset.push(units[i++]);
    if(i===units.length){result+=onset.map(standalone).join('');break;}
    const v=units[i++], dip=DIPHTHONG[v], base=dip?dip[0]:v;
    let glide='';if(onset.at(-1)==='j'||onset.at(-1)==='w')glide=onset.pop();
    const consonant=onset.pop();result+=onset.map(standalone).join('');
    if(consonant==='l'&&result){const last=result.charCodeAt(result.length-1)-0xac00;if(last>=0&&last<11172&&last%28===0)result=result.slice(0,-1)+String.fromCharCode(0xac00+last+8);}
    let medial=MEDIAL[base];if(glide==='j')medial=Y[medial]??medial;else if(glide==='w')medial=W[medial]??medial;
    if((consonant==='ʃ'||consonant==='ʒ')&&glide!=='w')medial=Y[medial]??medial;
    let next=i;while(next<units.length&&!vowel(units[next]))next++;
    let final=0;
    // Keep a consonant for the following vowel; close a syllable at sonorants in a cluster.
    if(i<next&&Object.hasOwn(CODA,units[i])&&(next===units.length||next-i>1)){
      final=CODA[units[i++]];
      if(v==='ə'&&final===8)medial=18; // syllabic -le, as in apple
    } else if(next===units.length&&next-i===1&&!dip&&(units[i]==='p'||['ɪ','ɛ','æ','ʊ','ɑ','ɒ'].includes(v))&&['p','t','k'].includes(units[i])){
      final={p:17,t:19,k:1}[units[i++]];
    }
    // Rhotic vowels already contain the r sound; don't invent an extra vowel.
    if(v==='ɝ'||v==='ɚ'){if(i<units.length&&vowel(units[i])){units.splice(i,0,'r');final=0;}else final=8;}
    const first=syllable(INITIAL[consonant]??11,medial,dip?0:final);
    result+=first;
    if(dip)result+=syllable(11,MEDIAL[dip[1]],final);
  }
  return result||null;
}
