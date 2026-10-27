// WHY 2026-10-27: civil UTC dates avoid DST drift and month-end rollover.
// This narrow model requires confirmed eligibility and actual three-month totals.
const date=(s:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?d:null;};
export function severanceBoundary(input:{start:string;exit:string;threeMonthWages:number;annualBonus:number;annualLeavePay:number;ordinaryDaily:number;confirmed:boolean}){
 if(!input.confirmed)return {ok:false as const,reason:'scope'};
 const start=date(input.start),end=date(input.exit);
 if(!start||!end||end<=start||![input.threeMonthWages,input.annualBonus,input.annualLeavePay,input.ordinaryDaily].every(v=>Number.isFinite(v)&&v>=0&&v<=1e12)||input.ordinaryDaily===0)return {ok:false as const,reason:'invalid'};
 // Feb-29 service anniversaries and excluded service/average periods need advice.
 if(input.start.slice(5)==='02-29')return {ok:false as const,reason:'unsupported'};
 const anniversary=date(`${start.getUTCFullYear()+1}-${input.start.slice(5)}`);
 if(!anniversary||end<anniversary)return {ok:false as const,reason:'short'};
 const month=end.getUTCMonth()-3,last=new Date(Date.UTC(end.getUTCFullYear(),month+1,0)).getUTCDate();
 const periodStart=new Date(Date.UTC(end.getUTCFullYear(),month,Math.min(end.getUTCDate(),last)));
 const periodDays=(end.getTime()-periodStart.getTime())/86400000,serviceDays=(end.getTime()-start.getTime())/86400000;
 const average=(input.threeMonthWages+input.annualBonus/4+input.annualLeavePay/4)/periodDays;
 const daily=Math.max(average,input.ordinaryDaily);
 return {ok:true as const,periodStart:periodStart.toISOString().slice(0,10),periodDays,serviceDays,average,daily,amount:daily*30*serviceDays/365};
}
