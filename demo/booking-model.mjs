/**
 * Synthetic sales-demo booking only. Does not hold live inventory, charge money
 * or communicate with the Jnapanam/PlayNexa booking API. Real booking follows
 * existing backend hold -> payment -> confirmation state machines.
 */
export const DEMO_SLOT_TIMES = Object.freeze(["07:00","09:00","16:00","18:00"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UPPER_CODE = /^[A-Z][A-Z0-9_]{1,30}$/;

export function addDemoBooking({arenaId,sportCode,date,startTime,customerName},bookings=[],today) {
  if(typeof arenaId!=="string"||!/^arena-[a-z0-9-]{3,60}$/.test(arenaId))
    throw new Error("Choose a demo arena");
  if(typeof sportCode!=="string"||!UPPER_CODE.test(sportCode))
    throw new Error("Choose a sport");
  if(typeof date!=="string"||!ISO_DATE.test(date)||!Number.isFinite(Date.parse(date+"T00:00:00Z")))
    throw new Error("Enter a valid date");
  if(today&&date<today)throw new Error("Select today or a future date");
  if(!DEMO_SLOT_TIMES.includes(startTime))throw new Error("Select an available demonstration time");
  if(typeof customerName!=="string"||!customerName.trim()||customerName.trim().length>90)
    throw new Error("Enter a demo customer name");
  if(!Array.isArray(bookings))throw new Error("Invalid synthetic booking list");
  if(bookings.some(b=>b.arenaId===arenaId&&b.sportCode===sportCode&&b.date===date&&b.startTime===startTime))
    throw new Error("This sample slot was already reserved in this browser. Choose another slot");
  const record={
    id:"DEMO-"+String(bookings.length+1).padStart(4,"0"),
    arenaId,sportCode,date,startTime,customerName:customerName.trim(),
    status:"SAMPLE_ONLY_NO_PAYMENT"
  };
  return {bookings:[...bookings,record],booking:record};
}
