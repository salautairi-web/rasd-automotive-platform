export const canSendPurpose=(purpose:"marketing"|"transactional"|"service"|"internal",decision:"granted"|"withdrawn"|"opted_out"|undefined)=>purpose!=="marketing"||decision==="granted";
export const retryDelaySeconds=(attempt:number,base=30,max=3600)=>Math.min(max,base*Math.pow(2,Math.max(0,attempt-1)));
export const shouldDeadLetter=(attempt:number,maxAttempts=5)=>attempt>=maxAttempts;
export const isRetryableProviderCode=(code:number|undefined)=>code===408||code===425||code===429||Boolean(code&&code>=500);
export const normalizeChannel=(channel:string)=>channel.trim().toLowerCase();
export const deliveryRate=(delivered:number,total:number)=>total<=0?0:Math.round((delivered/total)*10000)/100;
