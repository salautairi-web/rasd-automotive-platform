export type AlertSeverity = "info" | "low" | "medium" | "high" | "critical";
export function evaluateThreshold(actual:number, operator:"gt"|"gte"|"lt"|"lte"|"eq"|"neq", threshold:number){switch(operator){case"gt":return actual>threshold;case"gte":return actual>=threshold;case"lt":return actual<threshold;case"lte":return actual<=threshold;case"eq":return actual===threshold;case"neq":return actual!==threshold;}}
export function alertDedupeKey(entityId:number, ruleId:number, sourceType:string, sourceId:string, correlationKey:string){return `${entityId}:${ruleId}:${sourceType}:${sourceId}:${correlationKey}`;}
export function shouldEscalate(status:string, dueAt:Date, now:Date, severity:AlertSeverity){return !["resolved","verified","closed","suppressed"].includes(status)&&dueAt.getTime()<=now.getTime()&&(severity==="high"||severity==="critical");}
export function requiresHumanApproval(severity:AlertSeverity, action:"notify"|"create_task"|"start_workflow"|"financial"|"legal"){return (severity==="critical"||severity==="high")&&(action==="financial"||action==="legal");}
export function canCloseAlert(severity:AlertSeverity, hasEvidence:boolean){return severity!=="critical"||hasEvidence;}
