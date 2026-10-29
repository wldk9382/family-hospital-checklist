import { randomBytes } from 'node:crypto';
import { redis } from '../storage.js';
const valid=/^[A-Za-z0-9_-]{24}$/;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 const room=typeof req.body?.room==='string'?req.body.room:'';
 if(room && !valid.test(room))return res.status(400).json({error:'invalid_room'});
 try{
  const candidate=randomBytes(18).toString('base64url');
  let id=candidate;
  if(room){
   const link=`family-calendar-link:${room}`;
   const ok=await redis('SET',link,candidate,'NX');
   if(ok!=='OK')id=await redis('GET',link);
  }
  if(!valid.test(id))throw new Error('Invalid calendar id');
  await redis('HSETNX',`family-calendar:${id}`,'createdAt',String(Date.now()));
  return res.status(201).json({id});
 }catch(e){console.error('calendar create error',e);return res.status(503).json({error:'storage_unavailable'})}
}
