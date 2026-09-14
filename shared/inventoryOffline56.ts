export type OfflineState="queued"|"syncing"|"synced"|"retryable"|"permanent_failure"|"conflict";
export const nextOfflineState=(state:OfflineState,success:boolean,permanent=false):OfflineState=>success?"synced":permanent?"permanent_failure":state==="queued"||state==="retryable"?"retryable":"conflict";
export const retryDelayMs=(attempt:number)=>Math.min(300000,Math.max(1000,2**attempt*1000));
export const normalizeScan=(raw:string)=>raw.trim().toUpperCase();
export const isTraceComplete=(tracking:"none"|"batch"|"serial",batchNo?:string,serialNo?:string)=>tracking==="none"||(tracking==="batch"?Boolean(batchNo):Boolean(serialNo));
export const countVariance=(systemQty:number,countedQty:number,unitCostMinor:number)=>({varianceQty:countedQty-systemQty,varianceValueMinor:Math.round((countedQty-systemQty)*unitCostMinor)});
export const labelPayload=(entityId:number,productId:number,encodedValue:string,batchNo?:string,serialNo?:string)=>JSON.stringify({entityId,productId,encodedValue,batchNo:batchNo??null,serialNo:serialNo??null});
