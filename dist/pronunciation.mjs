import { ipaToHangul } from './phonetic-hangul.mjs?v=3';
let enginePromise;
const memo=new Map();
async function engine(){
  if(!enginePromise)enginePromise=(async()=>{
    const response=await fetch(new URL('./vendor/english-engine.mjs.gz',import.meta.url),{signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error('발음 데이터를 불러오지 못했습니다.');
    const bytes=new Uint8Array(await response.arrayBuffer());
    const source=bytes[0]===31&&bytes[1]===139
      ?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
      :new TextDecoder().decode(bytes);
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    try{const {EnglishG2P}=await import(url);return new EnglishG2P({dialect:'en-US'});}finally{URL.revokeObjectURL(url);}
  })().catch(error=>{enginePromise=null;throw error});
  return enginePromise;
}
export async function getPronunciation(input){
  const text=String(input).normalize('NFKC').replace(/[’‘]/g,"'").trim();
  if(!text||text.length>120||/[^a-zA-Z0-9\s'.,!?;:()\-$%/]/.test(text))return null;
  if(memo.has(text))return memo.get(text);
  const g2p=await engine(),expanded=g2p.preProcess(text);
  const tokens=expanded.match(/[a-zA-Z]+(?:'[a-zA-Z]+)*|[.,!?;:()\-/]/g)||[];
  if(!tokens.some(t=>/[a-z]/i.test(t)))return null;
  const result=[];const ipa=[];
  for(let i=0;i<tokens.length;i++){
    const word=tokens[i];if(!/[a-z]/i.test(word)){result.push(word);continue}
    const pos=g2p.tagWord(word,{prev:tokens[i-1],next:tokens[i+1]})?.pos;
    const phones=g2p.predict(word,'en-US',pos);
    if(!phones)return null;
    const hangul=ipaToHangul(phones);if(!hangul)return null;
    result.push(hangul);ipa.push(phones);
  }
  const value={hangul:result.join(' ').replace(/\s+([.,!?;:)])/g,'$1').replace(/\(\s+/g,'('),ipa:ipa.join(' ')};
  memo.set(text,value);if(memo.size>500)memo.delete(memo.keys().next().value);
  return value;
}
