import { randomBytes } from 'node:crypto';
import { redis } from '../storage.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 try{
  const id=randomBytes(18).toString('base64url');
  const expires=Date.now()+86400000;
  await redis('HSET',`family-room:${id}`,'expires',String(expires),'revision','0',...Array.from({length:12},(_,i)=>[String(i),'0']).flat());
  await redis('EXPIRE',`family-room:${id}`,'86400');
  return res.status(201).json({id,expires,revision:0,checked:Array(12).fill(false)});
 }catch(e){console.error('room create error',e);return res.status(503).json({error:'storage_unavailable'})}
}
