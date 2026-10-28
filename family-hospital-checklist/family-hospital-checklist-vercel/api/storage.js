export async function redis(...command){
 const url=process.env.UPSTASH_REDIS_REST_URL;
 const token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token)throw Error('Missing Upstash Redis environment variables');
 const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),cache:'no-store'});
 if(!r.ok)throw Error(`Redis HTTP ${r.status}`);
 const j=await r.json();if(j.error)throw Error(j.error);return j.result;
}
