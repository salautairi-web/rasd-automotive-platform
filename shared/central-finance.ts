export function canApprovePayment(status:string,makerId:number,checkerId:number,limitMinor:number,amountMinor:number){return status==="pending_approval"&&makerId!==checkerId&&amountMinor<=limitMinor}
export function reconciliationDifference(book:number,counterparty:number){return book-counterparty}
export function investmentRoiBps(invested:number,distributions:number,profit:number){return invested<=0?0:Math.round((distributions+profit-invested)*10000/invested)}
