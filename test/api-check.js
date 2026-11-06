import assert from 'node:assert/strict';
const root=process.env.TEST_URL||'http://127.0.0.1:3000';let cookie='';
async function request(path,method='GET',body){const r=await fetch(root+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});return {r,data:await r.json()};}
assert.equal((await request('/api/state')).r.status,401);
const login=await request('/api/auth/mock','POST',{name:'QA Student',email:'qa-check@example.test'});assert.equal(login.r.status,200);cookie=login.r.headers.get('set-cookie').split(';')[0];
let {data:s}=await request('/api/state');const revision=s.revision||0,count=s.subjects[0].conducted;s.subjects[0].conducted++;s.subjects[0].attended++;
const saved=await request('/api/state','PUT',s);assert.equal(saved.r.status,200);assert.equal(saved.data.revision,revision+1);assert.equal((await request('/api/state')).data.subjects[0].conducted,count+1);
assert.equal((await request('/api/state','PUT',s)).r.status,409);const invalid=structuredClone(saved.data);invalid.settings.threshold=100;assert.equal((await request('/api/state','PUT',invalid)).r.status,400);
assert.equal((await fetch(root+'/.env')).status,404);assert.equal((await fetch(root)).status,200);assert.equal((await request('/api/auth/logout','POST',{})).r.status,200);assert.equal((await request('/api/state')).r.status,401);
console.log('API checks passed: sessions, saved data, conflicts, validation, static serving, secret isolation, logout.');
