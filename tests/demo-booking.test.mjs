import test from "node:test";
import assert from "node:assert/strict";
import {DEMO_SLOT_TIMES,addDemoBooking} from "../demo/booking-model.mjs";
const value={arenaId:"arena-riverside",sportCode:"BADMINTON",date:"2027-01-02",startTime:"09:00",customerName:"Demo Player"};

test("demo booking is explicitly not live payment or confirmed inventory",()=>{
  const result=addDemoBooking(value,[],"2027-01-01");
  assert.equal(result.booking.status,"SAMPLE_ONLY_NO_PAYMENT");
  assert.equal(result.bookings.length,1);
  assert.equal(result.booking.customerName,"Demo Player");
});
test("one synthetic sport/date/time slot cannot be double booked",()=>{
  const {bookings}=addDemoBooking(value,[],"2027-01-01");
  assert.throws(()=>addDemoBooking(value,bookings,"2027-01-01"),/already reserved/);
});
test("other arenas and other sports can have the same demo slot",()=>{
  const {bookings}=addDemoBooking(value,[],"2027-01-01");
  assert.equal(addDemoBooking({...value,arenaId:"arena-urban"},bookings,"2027-01-01").bookings.length,2);
  assert.equal(addDemoBooking({...value,sportCode:"CRICKET"},bookings,"2027-01-01").bookings.length,2);
});
test("reject past dates and invalid times or identifiers",()=>{
  assert.throws(()=>addDemoBooking({...value,date:"2026-12-31"},[],"2027-01-01"),/future/);
  assert.throws(()=>addDemoBooking({...value,startTime:"02:45"},[]),/time/);
  assert.throws(()=>addDemoBooking({...value,arenaId:"../../evil"},[]),/arena/);
  assert.throws(()=>addDemoBooking({...value,customerName:""},[]),/name/);
  assert.ok(DEMO_SLOT_TIMES.includes("09:00"));
});
