export type WorkflowStatus = "running" | "waiting_approval" | "waiting_task" | "escalated" | "completed" | "failed" | "cancelled";
export const allowedTransition = (from:string,to:string) => ({running:["waiting_approval","waiting_task","completed","failed","cancelled"],waiting_approval:["running","escalated","completed","failed"],waiting_task:["running","escalated","completed","failed"],escalated:["waiting_approval","waiting_task","failed"],completed:[],failed:[],cancelled:[]} as Record<string,string[]>)[from]?.includes(to) ?? false;
export const canApprove = (makerUserId:number|null|undefined, approverUserId:number, stepUpRequired:boolean, stepUpVerified:boolean) => makerUserId !== approverUserId && (!stepUpRequired || stepUpVerified);
export const quorumReached = (approved:number, required:number) => approved >= Math.max(1, required);
export const delegationActive = (status:string, startsAt:Date, endsAt:Date, now:Date) => status === "active" && now >= startsAt && now < endsAt;
export const idempotencyMatches = (existingKey:string|undefined, requestedKey:string) => Boolean(existingKey && existingKey === requestedKey);
export const shouldEscalate = (dueAt:Date|null|undefined, now:Date) => Boolean(dueAt && now.getTime() >= dueAt.getTime());
export const workflowProgress = (status:string) => ({running:35,waiting_approval:55,waiting_task:60,escalated:75,completed:100,failed:100,cancelled:100} as Record<string,number>)[status] ?? 0;
