export const MODEL_VERSION = '1.0.0';
export const defaults = Object.freeze({days:30,solar:80,wind:100,battery:400,batteryPower:100,fuel:16000,initialSoc:65,seed:61,scenario:'normal',risk:1});
export const scenarios = {normal:'Polar winter',blizzard:'Four-day blizzard',failure:'Generator failure',miss:'Forecast misses a lull'};
export const limits={days:[1,210],solar:[0,500],wind:[0,500],battery:[0,2000],batteryPower:[0,500],fuel:[0,100000],initialSoc:[15,95],seed:[1,999999],risk:[0,2]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function validateConfig(c){for(const [k,[a,b]] of Object.entries(limits))if(!Number.isFinite(c[k])||c[k]<a||c[k]>b)throw Error(`${k} must be between ${a} and ${b}.`);for(const k of ['days','seed'])if(!Number.isInteger(c[k]))throw Error(`${k} must be a whole number.`);if(!(c.scenario in scenarios))throw Error('Unknown scenario.');return {...c};}
function noise(seed,h,s=0){let x=(seed*374761393+h*668265263+s*1274126177)|0;x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)/4294967296;}
export function eventWindow(c){const start=Math.min(240,Math.floor(c.days*24/3));return {start,end:Math.min(c.days*24,start+(c.scenario==='blizzard'?96:48))};}
export function weather(c){const rows=[];const event=eventWindow(c);for(let h=0;h<c.days*24+36;h++){
 const day=h/24,local=h%24,temperature=-27+7*Math.sin(day/7)+3*(noise(c.seed,h,1)-.5);
 const daylight=Math.max(0,Math.sin((local-9)*Math.PI/6));
 const snow=.72,icing=.82;
 const pvBase=c.solar*daylight*(.35+.35*noise(c.seed,Math.floor(h/4),2))*snow;
 const windBase=c.wind*clamp(.33+.25*Math.sin(h/19)+.12*Math.sin(h/73)+.14*(noise(c.seed,h,3)-.5),0,.9)*icing;
 const load=66+Math.max(0,-temperature-15)*1.3+(local>=7&&local<=21?10:0)+6*(noise(c.seed,h,4)-.5);
 const disruption=h>=event.start&&h<event.end;
 const outage=c.scenario==='blizzard'&&disruption;
 const lull=c.scenario==='miss'&&disruption;
 rows.push({hour:h,temperature,load,pv:outage?0:pvBase,wind:outage?0:windBase*(lull?.03:1),pvBase,windBase,largeAvailable:!(c.scenario==='failure'&&disruption),disruption:disruption&&c.scenario!=='normal'});
 }return rows;}
export function forecast(c,actual,issue,currentAvailability){const lead=actual.hour-issue;const spread=.10+.20*Math.min(lead/36,1);const error=(noise(c.seed,actual.hour+issue,8)-.5)*spread;
 const renewable=c.scenario==='miss'?actual.pvBase+actual.windBase:actual.pv+actual.wind;
 const expected=Math.max(0,renewable*(1+error));
 return {...actual,load:actual.load*(1+.04*(noise(c.seed,actual.hour+issue,9)-.5)),pv:expected*(1-c.risk*spread*.35),wind:0,largeAvailable:currentAvailability,forecastExpected:expected,forecastLow:expected*(1-spread),forecastHigh:expected*(1+spread)};}
export const generatorActions=[{unit:0,power:0},{unit:60,power:18},{unit:60,power:36},{unit:60,power:60},{unit:125,power:37.5},{unit:125,power:75},{unit:125,power:125}];
export function dispatch(c,w,state,action){let unit=action.unit,p=action.power;if(unit===125&&!w.largeAvailable){unit=0;p=0;}
 const idle=unit===60?2.1:3.5,slope=unit===60?.24:.25;
 if(unit){p=Math.min(unit,Math.max(.3*unit,p),(state.fuel-idle)/slope);if(p<.3*unit-1e-9){unit=0;p=0;}}
 const fuelUsed=unit?idle+slope*p:0;
 const minE=c.battery*.15,maxE=c.battery*.95,eta=.95;
 const net=w.pv+w.wind+p-w.load;
 const charge=Math.max(0,Math.min(net,c.batteryPower,(maxE-state.energy)/eta));
 const discharge=Math.max(0,Math.min(-net,c.batteryPower,(state.energy-minE)*eta));
 const energy=clamp(state.energy+charge*eta-discharge/eta,minE,maxE);
 const unserved=Math.max(0,-net-discharge),curtailed=Math.max(0,net-charge);
 const domesticUnserved=Math.min(unserved,w.load*.2),essentialUnserved=Math.min(Math.max(0,unserved-domesticUnserved),w.load*.3),criticalUnserved=Math.max(0,unserved-domesticUnserved-essentialUnserved);
 return {hour:w.hour,load:w.load,pv:w.pv,wind:w.wind,temperature:w.temperature,generator:unit,generatorPower:p,batteryPower:discharge-charge,energy,soc:c.battery?energy/c.battery*100:0,fuelUsed,fuelRemaining:Math.max(0,state.fuel-fuelUsed),unserved,domesticUnserved,essentialUnserved,criticalUnserved,curtailed,losses:charge*(1-eta)+discharge*(1/eta-1),disruption:w.disruption,largeAvailable:w.largeAvailable};}
function nextState(r){return {energy:r.energy,fuel:r.fuelRemaining,unit:r.generator};}
function rule(c,w,state){const net=w.load-w.pv-w.wind;const soc=c.battery?state.energy/c.battery:0;
 const keep=state.unit&&soc<.8;
 if(!keep&&soc>.35&&net<=c.batteryPower&&(state.energy-c.battery*.15)*.95>=net)return generatorActions[0];
 if(net<=0&&soc>.35)return generatorActions[0];
 const target=Math.max(0,net)+(soc<.65?Math.min(c.batteryPower,40):0);
 const unit=target<=60||!w.largeAvailable?60:125;
 return {unit,power:clamp(target,.3*unit,unit)};}
function plan(c,ws,h,state){let beam=[{...state,cost:0,path:[]}];const horizon=Math.min(36,c.days*24-h),width=14;
 const initialE=state.energy;const allowance=state.fuel/Math.max(1,c.days-h/24)/24;
 for(let t=0;t<horizon;t++){
  const f=forecast(c,ws[h+t],h,ws[h].largeAvailable),expanded=[];
  for(const b of beam)for(let ai=0;ai<generatorActions.length;ai++){
   const a=generatorActions[ai];if(a.unit===125&&!f.largeAvailable)continue;
   const r=dispatch(c,f,b,a);
   const scarcity=1+Math.min(8,20/Math.max(1,allowance));
   const reserve=c.battery*(.25+.1*c.risk);
   const cost=b.cost+r.criticalUnserved*1e7+r.essentialUnserved*1e5+r.domesticUnserved*1e4+r.fuelUsed*scarcity+(r.generator&&r.generator!==b.unit?2:0)+Math.max(0,reserve-r.energy)*.03;
   expanded.push({...nextState(r),cost,path:[...b.path,ai],rank:cost+Math.max(0,initialE-r.energy)*.30*scarcity});
  }
  expanded.sort((a,b)=>a.rank-b.rank);const buckets=new Set();beam=[];
  for(const b of expanded){const key=`${Math.round(b.energy/Math.max(1,c.battery/32))}:${b.unit}:${Math.round(b.fuel/8)}`;if(!buckets.has(key)){buckets.add(key);beam.push(b);}if(beam.length===width)break;}
 }
 return beam[0].path.slice(0,6);
}
export function summarize(rows,c){const sum=k=>rows.reduce((a,r)=>a+r[k],0);const last=rows.at(-1);const fuelUsed=sum('fuelUsed');return {fuelUsed,fuelRemaining:last.fuelRemaining,unserved:sum('unserved'),criticalUnserved:sum('criticalUnserved'),essentialUnserved:sum('essentialUnserved'),domesticUnserved:sum('domesticUnserved'),endEnergy:last.energy,endSoc:last.soc,load:sum('load'),renewable:sum('pv')+sum('wind'),curtailed:sum('curtailed'),losses:sum('losses'),criticalHours:rows.filter(r=>r.criticalUnserved>1e-6).length,generatorHours:rows.filter(r=>r.generatorPower>0).length,firstCriticalHour:rows.find(r=>r.criticalUnserved>1e-6)?.hour??null,firstFuelEmptyHour:rows.find(r=>r.fuelRemaining<1e-6)?.hour??null,daysAtAverageBurn:fuelUsed>0?last.fuelRemaining/(fuelUsed/c.days):null};}
export function simulate(config,progress=()=>{}){const c=validateConfig(config),ws=weather(c),runs=[];
 for(const controller of ['Tuned rules','Forecast planner']){let state={energy:c.battery*c.initialSoc/100,fuel:c.fuel,unit:0},queue=[],lastAvailability=true;const rows=[];
 for(let h=0;h<c.days*24;h++){
  let replanned=false,action;
  if(controller==='Forecast planner'){if(h%6===0||!queue.length||ws[h].largeAvailable!==lastAvailability){queue=plan(c,ws,h,state);replanned=true;}action=generatorActions[queue.shift()];}else action=rule(c,ws[h],state);
  const before=state;const r=dispatch(c,ws[h],state,action);state=nextState(r);lastAvailability=ws[h].largeAvailable;
  const f=forecast(c,ws[h],Math.floor(h/6)*6,ws[h].largeAvailable);
  rows.push({...r,controller,replanned,forecastExpected:f.forecastExpected,forecastLow:f.forecastLow,forecastHigh:f.forecastHigh,reserveEnergy:c.battery*(.25+.1*c.risk),budgetRemaining:c.fuel*(h+1)/(c.days*24)-(c.fuel-r.fuelRemaining),dailyAllowance:before.fuel/Math.max(1,(c.days*24-h)/24),reason:r.unserved>1e-6?'Available generation and battery cannot meet all demand. Shed domestic, then essential, then critical.':r.generatorPower>0?(r.batteryPower<0?'Generator serves demand and stores excess in the battery.':'Generator and renewables support demand; the battery covers any residual.'):(r.batteryPower>0?'Renewables and battery serve demand. Diesel remains off.':'Renewables cover demand; surplus charges the battery or is curtailed.')});
  if(h%24===0)progress({controller,hour:h,total:c.days*24});
 }runs.push({controller,rows,summary:summarize(rows,c)});}
 return {modelVersion:MODEL_VERSION,createdAt:new Date().toISOString(),source:'Seeded synthetic simulation',config:c,event:eventWindow(c),runs};}
export function csvFor(run){const keys=Object.keys(run.runs[0].rows[0]);const q=v=>`"${String(v??'').replaceAll('"','""')}"`;return [keys.map(q).join(','),...run.runs.flatMap(r=>r.rows.map(row=>keys.map(k=>q(row[k])).join(',')))].join('\n');}
