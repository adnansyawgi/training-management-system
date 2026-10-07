(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.businessTime = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function scheduledStart(day, time, timezone) {
    if (typeof timezone !== 'string' || !timezone) throw new Error('Business timezone required.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) throw new Error('Invalid schedule.');
    const desired = Date.parse(day + 'T' + time + 'Z');
    if (!Number.isFinite(desired) || new Date(desired).toISOString().slice(0, 19) !== day + 'T' + time) throw new Error('Invalid schedule.');
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    const local = value => {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
      return Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    };
    let instant = desired;
    for (let index = 0; index < 4; index++) instant += desired - local(instant);
    if (local(instant) !== desired) throw new Error('Schedule is not a valid local time.');
    // Choose the earlier occurrence of an ambiguous local time, conservatively.
    const matches = [instant];
    for (const minutes of [-120, -90, -60, -30, 30, 60, 90, 120]) {
      const candidate = instant + minutes * 60000;
      if (local(candidate) === desired) matches.push(candidate);
    }
    return new Date(Math.min(...matches));
  }
  function beforeProgramStart(day, time, now, timezone) {
    return now.getTime() < scheduledStart(day, time, timezone).getTime();
  }
  function localDateTime(value, timezone) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error('Invalid timestamp.');
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' })
      .formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  }
  return { scheduledStart, beforeProgramStart, localDateTime };
});
