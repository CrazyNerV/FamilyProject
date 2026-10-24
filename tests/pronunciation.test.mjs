import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { ipaToHangul } from '../dist/phonetic-hangul.mjs';
import { getPronunciation } from '../dist/pronunciation.mjs';
const source=gunzipSync(await readFile(new URL('../dist/vendor/english-engine.mjs.gz',import.meta.url))).toString();
const {EnglishG2P}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const engine=new EnglishG2P({dialect:'en-US'});
test('real dictionary pronunciations map to useful Hangul',()=>{
 for(const [word,expected] of [['apple','애플'],['take','테이크'],['it','잇'],['easy','이지'],['bloom','블룸'],['difference','디퍼런스'],['resilience','리질리언스'],['book','북']])assert.equal(ipaToHangul(engine.predict(word,'en-US')),expected,word);
});
test('unknown spellings use G2P without claiming validity',()=>{assert.match(ipaToHangul(engine.predict('zorpify','en-US')),/^[가-힣]+$/)});
test('unsupported IPA is explicit, not silently omitted',()=>assert.equal(ipaToHangul('xyz☃'),null));
test('end-to-end generation preserves idiom word boundaries and punctuation',async()=>{
 const original=globalThis.fetch,create=URL.createObjectURL,revoke=URL.revokeObjectURL;let calls=0;
 // Node has no blob: module loader; adapt that browser-only transport for this test.
 URL.createObjectURL=()=> 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');URL.revokeObjectURL=()=>{};
 globalThis.fetch=async(url)=>{calls++;assert.match(String(url),/vendor\/english-engine\.mjs\.gz$/);return new Response(await readFile(new URL('../dist/vendor/english-engine.mjs.gz',import.meta.url)))};
 try{
  const value=await getPronunciation('take it easy');assert.equal(value.hangul,'테이크 잇 이지');
  assert.equal((await getPronunciation('take it easy')).hangul,value.hangul);assert.equal(calls,1);
  assert.equal((await getPronunciation('apple!')).hangul,'애플!');
  assert.equal(await getPronunciation('한글'),null);
  assert.equal(await getPronunciation('<script>alert(1)</script>'),null);
 }finally{globalThis.fetch=original;URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
});
