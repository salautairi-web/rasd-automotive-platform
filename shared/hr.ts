export function payrollLine(input:{basic:number;allowances:number;overtime:number;bonus:number;deductions:number}){const gross=input.basic+input.allowances+input.overtime+input.bonus;if(gross<0||input.deductions<0)throw new Error("invalid_payroll_components");return{gross,net:gross-input.deductions}}
export function leaveDecision(balance:number,pending:number,days:number,allowNegative:boolean){const available=balance-pending;return{allowed:days>0&&(allowNegative||days<=available),available}}
export function canApprovePayroll(maker:number,checker:number,status:string){return maker!==checker&&status==="pending_approval"}
export function canPostPayroll(status:string){return status==="approved"}
export function attendanceMinutes(clockIn:Date,clockOut:Date){const minutes=Math.round((clockOut.getTime()-clockIn.getTime())/60000);if(minutes<0)throw new Error("clock_out_before_in");return minutes}
