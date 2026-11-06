import {randomUUID} from 'node:crypto';
export function seed(){return {version:1,settings:{threshold:75,margin:5,grades:{O:10,'A+':9,A:8,'B+':7,B:6,C:5,P:4,F:0}},subjects:[['Mathematics','MA201',28,32],['Data Structures','CS202',22,30],['Digital Electronics','EC203',26,30],['Design Thinking','HS204',18,20]].map(([name,code,attended,conducted])=>({id:randomUUID(),name,code,faculty:'',attended,conducted,updated:new Date().toISOString(),units:Array.from({length:5},(_,i)=>({name:`Unit ${i+1}`,total:8,completed:i<2?8:i===2?3:0}))})),courses:[{id:randomUUID(),name:'Mathematics',credits:4,grade:'A+'},{id:randomUUID(),name:'Data Structures',credits:4,grade:'A'},{id:randomUUID(),name:'Digital Electronics',credits:3,grade:'O'}],semesters:[{id:randomUUID(),name:'Semester 1',credits:22,sgpa:8.6},{id:randomUUID(),name:'Semester 2',credits:24,sgpa:8.9}]};}
const fail=m=>{throw Object.assign(new Error(m),{status:400});};
export function validate(s){
 if(!s||s.version!==1||!s.settings||!Array.isArray(s.subjects)||!Array.isArray(s.courses)||!Array.isArray(s.semesters))fail('Invalid backup structure or version.');
 const {threshold:t,margin:w,grades:g}=s.settings;
 if(!Number.isFinite(t)||t<=0||t>=100||!Number.isFinite(w)||w<0||w>t)fail('Threshold must be between 0 and 100; margin must be between 0 and threshold.');
 if(!g||typeof g!=='object'||Array.isArray(g)||!Object.keys(g).length||Object.entries(g).some(([k,v])=>!k.trim()||!Number.isFinite(v)||v<0||v>100))fail('Invalid grading scale.');
 const text=v=>typeof v==='string'&&v.trim().length>0&&v.length<=200;
 const ids=new Set();
 for(const a of [...s.subjects,...s.courses,...s.semesters]){if(!text(a.id)||ids.has(a.id)||!text(a.name))fail('Records need unique IDs and names.');ids.add(a.id);}
 for(const a of s.subjects){if(typeof a.code!=='string'||!Number.isSafeInteger(a.attended)||!Number.isSafeInteger(a.conducted)||a.attended<0||a.conducted<a.attended||!Array.isArray(a.units)||a.units.some(u=>!text(u.name)||!Number.isSafeInteger(u.total)||!Number.isSafeInteger(u.completed)||u.completed<0||u.total<u.completed))fail('Invalid attendance or topic counts.');}
 for(const c of s.courses)if(!Number.isFinite(c.credits)||c.credits<=0||!Object.hasOwn(g,c.grade))fail('Every course needs positive credits and a configured grade.');
 for(const a of s.semesters)if(!Number.isFinite(a.credits)||a.credits<=0||!Number.isFinite(a.sgpa)||a.sgpa<0||a.sgpa>Math.max(...Object.values(g)))fail('Invalid semester credits or SGPA.');
 return s;
}
export function advice(a,t=75,w=5){if(!a.conducted)return {percent:null,status:'No classes',needed:0,bunks:0};const percent=100*a.attended/a.conducted;return {percent,status:percent>=t?'Safe':percent>=t-w?'Near margin':'Shortage',needed:Math.max(0,Math.ceil((t*a.conducted-100*a.attended)/(100-t))),bunks:Math.max(0,Math.floor((100*a.attended-t*a.conducted)/t))};}
export function weighted(rows,points){const credits=rows.reduce((a,r)=>a+r.credits,0);return credits?rows.reduce((a,r)=>a+r.credits*points(r),0)/credits:null;}
