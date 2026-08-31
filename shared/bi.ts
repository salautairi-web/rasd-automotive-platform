export function portfolioTotal(values:{value:number;isInterEntity?:boolean;eliminated?:boolean}[]){return values.reduce((s,x)=>s+(x.isInterEntity&&!x.eliminated?0:x.value),0)}
export function varianceBps(actual:number,budget:number){return budget===0?0:Math.round((actual-budget)*10000/Math.abs(budget))}
export function dataQualityScore(totalFacts:number,critical:number,warning:number){if(!totalFacts)return critical||warning?0:100;return Math.max(0,Math.round(100-(critical*10+warning*2)/totalFacts*100))}
