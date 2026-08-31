export function straightLineDepreciation(cost:number,residual:number,lifeMonths:number,months=1){if(cost<0||residual<0||residual>cost||lifeMonths<=0||months<=0)throw new Error("invalid_depreciation_basis");return Math.min(cost-residual,Math.round(((cost-residual)/lifeMonths)*months))}
export function disposalGainLoss(proceeds:number,bookValue:number){if(proceeds<0||bookValue<0)throw new Error("invalid_disposal");return proceeds-bookValue}
export function canCapitalize(status:string,documentKey?:string){return status==="received"&&Boolean(documentKey)}
export function canPostDepreciation(assetStatus:string,entryStatus:string){return ["active","capitalized","under_maintenance"].includes(assetStatus)&&entryStatus==="approved"}
