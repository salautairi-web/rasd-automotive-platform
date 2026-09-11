export const canDispose=(hasActiveLegalHold:boolean,decision:"pending"|"archive"|"secure_dispose"|"retain")=>!hasActiveLegalHold&&decision==="secure_dispose";
export const signatureWebhookDecision=(status:string,expiresAt:Date|null,now=new Date())=>expiresAt&&expiresAt<now?"expired":status;
export const lowConfidenceNeedsReview=(confidenceBps:number)=>confidenceBps<8500;
export const nextLifecycleState=(current:string,event:"upload"|"review"|"approve"|"sign"|"archive"|"hold"|"release"|"dispose")=>{if(event==="hold")return"held";if(event==="dispose")return"disposed";if(event==="archive")return"archived";if(event==="approve")return"approved";if(event==="sign")return"signed";if(event==="review")return"review";return current;};
