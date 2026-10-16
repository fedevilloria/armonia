// Comparar fecha y hora civiles del centro, sin depender de la zona del proceso.
const centerFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
export function isFutureStart(
  date: string,
  startTime: string,
  now: Date,
): boolean {
  const parts = Object.fromEntries(
    centerFormatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const current =
    parts.year +
    '-' +
    parts.month +
    '-' +
    parts.day +
    'T' +
    parts.hour +
    ':' +
    parts.minute +
    ':' +
    parts.second;
  return date + 'T' + startTime + ':00' > current;
}
