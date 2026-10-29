import { randomBytes } from 'node:crypto';
import { redis } from '../storage.js';
const valid=/^[A-Za-z0-9_-]{24}$/;
function object(raw){if(Array.isArray(raw)){const out={};for(let i=0;i<raw.length;i+=2)out[raw[i]]=raw[i+1];return out}return raw&&typeof raw==='object'?raw:{}}
function event(raw){try{return JSON.parse(raw)}catch{return null}}
function safeText(s,max){return typeof s==='string'?s.trim().slice(0,max):''}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(`${s}T12:00:00Z`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s}
function validTime(s){return s===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(s)}
function normalize(body){const title=safeText(body?.title,80),date=safeText(body?.date,10),time=safeText(body?.time,5),location=safeText(body?.location,100),note=safeText(body?.note,300);if(!title||!validDate(date)||!validTime(time))return null;return {title,date,time,location,note}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const id=String(req.query.id||'');if(!valid.test(id))return res.status(404).json({error:'not_found'});
 const key=`family-calendar:${id}`;
 try{
  const exists=await redis('EXISTS',key);if(Number(exists)!==1)return res.status(404).json({error:'not_found'});
  if(req.method==='GET'){
   const data=object(await redis('HGETALL',key));
   const events=Object.entries(data).filter(([k])=>k.startsWith('event:')).map(([,v])=>event(v)).filter(Boolean).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
   return res.status(200).json({events,revision:Number(data.revision||0)});
  }
  if(req.method==='POST'){
   const e=normalize(req.body);if(!e)return res.status(400).json({error:'invalid_event'});
   const count=Number(await redis('HLEN',key));if(count>=202)return res.status(400).json({error:'calendar_full'});
   const eventId=randomBytes(12).toString('base64url');
   await redis('HSET',key,`event:${eventId}`,JSON.stringify({...e,id:eventId}));
   await redis('HINCRBY',key,'revision','1');return res.status(201).json({id:eventId});
  }
  if(req.method==='PATCH'||req.method==='DELETE'){
   const eventId=safeText(req.body?.eventId,24);if(!/^[A-Za-z0-9_-]{16}$/.test(eventId))return res.status(400).json({error:'invalid_id'});
   const field=`event:${eventId}`;const found=await redis('HEXISTS',key,field);if(Number(found)!==1)return res.status(404).json({error:'not_found'});
   if(req.method==='DELETE')await redis('HDEL',key,field);
   else{const e=normalize(req.body);if(!e)return res.status(400).json({error:'invalid_event'});await redis('HSET',key,field,JSON.stringify({...e,id:eventId}))}
   await redis('HINCRBY',key,'revision','1');return res.status(200).json({ok:true});
  }
  return res.status(405).json({error:'method_not_allowed'});
 }catch(e){console.error('calendar error',e);return res.status(503).json({error:'storage_unavailable'})}
}
