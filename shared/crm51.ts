export const sameEntity = (recordEntityId:number, requestedEntityId:number) => recordEntityId === requestedEntityId;
export const consentAllows = (granted:number, doNotContact:number, channel:string, requestedChannel:string) => Boolean(granted) && !Boolean(doNotContact) && (channel === "all" || channel === requestedChannel);
export const mergeRequiresApproval = (confidence:number, operationalAccounts:number) => confidence >= 80 && operationalAccounts > 0;
export const caseProgress = (status:string) => ({open:10,in_progress:45,waiting_customer:65,resolved:90,closed:100} as Record<string,number>)[status] ?? 0;
export const maskPII = (value:string|null|undefined) => value ? `${value.slice(0,2)}***${value.slice(-2)}` : "—";
