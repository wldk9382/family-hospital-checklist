import {redis} from '../storage.js';
const valid=/^[A-Za-z0-9_-]{24}$/;
function parse(raw){const d=Object.fromEntries(raw||[]);return {checked:Array.from({length:12},(_,i)=>d[i]==='1'),expires:Number(d.expires),revision:Number(d.revision||0)}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const id=String(req.query.id||'');if(!valid.test(id))return res.status(404).json({error:'not_found'});
 const key=`family-room:${id}`;
 try{
  const raw=await redis('HGETALL',key);if(!raw||!raw.length)return res.status(404).json({error:'expired_or_missing'});
  const state=parse(raw);
  if(Date.now()>=state.expires)return res.status(404).json({error:'expired_or_missing'});
  if(req.method==='GET')return res.status(200).json(state);
  if(req.method!=='PATCH')return res.status(405).json({error:'method_not_allowed'});
  const {index,checked}=req.body||{};
  if(!Number.isInteger(index)||index<0||index>=12||typeof checked!=='boolean')return res.status(400).json({error:'invalid_data'});
  await redis('HSET',key,String(index),checked?'1':'0');
  await redis('HINCRBY',key,'revision','1');
  const next=await redis('HGETALL',key);
  return res.status(200).json(parse(next));
 }catch(e){console.error('room error',e);return res.status(503).json({error:'storage_unavailable'})}
}
