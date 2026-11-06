import http from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {seed,validate} from './lib.js';
const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
let collection,client;
if(process.env.MONGODB_URI){const {MongoClient}=await import('mongodb');client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});await client.connect();collection=client.db(process.env.MONGODB_DB||'campus360').collection('workspaces');console.log('MongoDB Atlas connected');}
else await mkdir('data',{recursive:true});
const sessions=new Map();let queue=Promise.resolve();
async function load(id){if(collection){const d=await collection.findOne({_id:id});return d?.state||seed();}try{return JSON.parse(await readFile(`data/${id}.json`,'utf8'));}catch(e){if(e.code==='ENOENT')return seed();throw e;}}
async function save(id,state){if(collection)await collection.updateOne({_id:id},{$set:{state}},{upsert:true});else{await writeFile(`data/${id}.tmp`,JSON.stringify(state));await rename(`data/${id}.tmp`,`data/${id}.json`);}}
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let b='';for await(const chunk of req){b+=chunk;if(Buffer.byteLength(b)>1_000_000)throw Object.assign(new Error('Request exceeds 1 MB.'),{status:413});}try{return JSON.parse(b||'{}');}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400});}}
const server=http.createServer(async(req,res)=>{try{
res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
const path=new URL(req.url,'http://localhost').pathname;
if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return send(res,403,{error:'Cross-origin request rejected.'});
if(path==='/api/health')return send(res,200,{ok:true,storage:collection?'MongoDB Atlas':'Local demo',auth:'mock'});
if(path==='/api/auth/mock'&&req.method==='POST'){const b=await body(req);if(typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email)||b.email.length>200)return send(res,400,{error:'Enter a valid demo email.'});const email=b.email.toLowerCase().trim();const token=randomBytes(32).toString('hex');const user={id:createHash('sha256').update(email).digest('hex'),name:String(b.name||email.split('@')[0]).slice(0,80),email};sessions.set(token,{user,expires:Date.now()+86400000});res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);return send(res,200,user);}
if(path.startsWith('/api/')){const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('session='))?.slice(8);const session=sessions.get(token);if(!session||session.expires<Date.now())return send(res,401,{error:'Please sign in to your demo workspace.'});const {user}=session;
if(path==='/api/auth/me')return send(res,200,user);
if(path==='/api/auth/logout'&&req.method==='POST'){sessions.delete(token);res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(res,200,{ok:true});}
if(path==='/api/state'&&req.method==='GET'){const task=queue.then(async()=>{const s=await load(user.id);await save(user.id,s);send(res,200,s);});queue=task.catch(()=>{});await task;return;}
if(path==='/api/state'&&req.method==='PUT'){const s=validate(await body(req));const task=queue.then(async()=>{const old=await load(user.id);if((s.revision||0)!==(old.revision||0))return send(res,409,{error:'Another tab changed your data. Reload before editing again.'});s.revision=(old.revision||0)+1;await save(user.id,s);send(res,200,s);});queue=task.catch(()=>{});await task;return;}
return send(res,404,{error:'Endpoint not found.'});}
if(req.method!=='GET')return send(res,405,{error:'Method not allowed.'});
const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};if(!files[path])return send(res,404,{error:'Not found.'});const file=files[path];res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});res.end(await readFile(new URL(`public/${file}`,import.meta.url)));
}catch(e){console.error(e.message);if(!res.headersSent)send(res,e.status||500,{error:e.status?e.message:'Unable to complete request. Check server connection.'});else res.end();}});
server.listen(port,host,()=>console.log(`Campus360: http://${host}:${port}`));
setInterval(()=>{for(const [k,v]of sessions)if(v.expires<Date.now())sessions.delete(k);},3600000).unref();
