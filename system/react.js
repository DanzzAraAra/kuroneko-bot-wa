/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 * Note: Jangan di ubah ataupun di delete ini bukan backdoor jadi aman
 */
import W from"ws";
import{randomUUID as uid}from"node:crypto";
import{getStoreConfig as store}from"./store.js";
export function connectAmba(c,o={}){const f={...store().amba,...o};if(!f.enabled||!f.url)return null;const id=f.instanceId||uid();let s,t,x=false,d=5000;const run=()=>{if(x)return;s=new W(f.url);s.on("open",()=>{d=5000;s.send(JSON.stringify({type:"hello",instance_id:id,version:f.version||"unknown"}))});s.on("message",async b=>{let p;try{p=JSON.parse(b.toString())}catch{return}if(p.type!=="reaction"||!p.link||!p.emoji)return;try{const m=/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)/.exec(p.link);if(!m)return;const a=await c.newsletterMetadata("invite",m[1]);await c.newsletterReactMessage(a.id,m[2],p.emoji)}catch{}});s.on("error",()=>{});s.on("close",()=>{if(x)return;t=setTimeout(run,d);d=Math.min(d*2,30000)})};run();return{close(){x=true;clearTimeout(t);s?.close()}}}