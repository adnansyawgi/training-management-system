const {scheduledStart,beforeProgramStart}=require('../../../src/public/js/business-time');
test('Malaysia schedule converts to UTC independently of host timezone',()=>{
  expect(scheduledStart('2026-12-01','09:00:00','Asia/Kuala_Lumpur').toISOString()).toBe('2026-12-01T01:00:00.000Z');
});
test('before start is strict, including exact boundary',()=>{
  expect(beforeProgramStart('2026-12-01','09:00:00',new Date('2026-12-01T00:59:59.999Z'),'Asia/Kuala_Lumpur')).toBe(true);
  expect(beforeProgramStart('2026-12-01','09:00:00',new Date('2026-12-01T01:00:00Z'),'Asia/Kuala_Lumpur')).toBe(false);
});
test.each([['2026-02-30','09:00:00','Asia/Kuala_Lumpur'],['2026-12-01','25:00:00','Asia/Kuala_Lumpur'],['2026-12-01','09:00:00','Invalid/Timezone'],['2026-03-08','02:30:00','America/New_York']])('invalid schedule %s %s %s fails closed',(date,time,zone)=>{expect(()=>scheduledStart(date,time,zone)).toThrow();});
test('ambiguous DST schedule uses earlier occurrence conservatively',()=>{
  expect(scheduledStart('2026-11-01','01:30:00','America/New_York').toISOString()).toBe('2026-11-01T05:30:00.000Z');
});
