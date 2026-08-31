export function canApproveCommand(status:string,approvalRequired:boolean){return approvalRequired&&status==="pending_approval"}
export function canDispatchCommand(status:string,approvalRequired:boolean){return status==="approved"||(!approvalRequired&&status==="draft")}
export function canCompleteTask(status:string,dependenciesOpen:number,evidence?:string|null){return ["assigned","in_progress","waiting"].includes(status)&&dependenciesOpen===0&&Boolean(evidence?.trim())}
export function escalationLevel(dueAt:Date|null,now:Date,l1Minutes:number,l2Minutes:number){if(!dueAt||now<=dueAt)return 0;const late=(now.getTime()-dueAt.getTime())/60000;return late>=l2Minutes?2:late>=l1Minutes?1:0}
