import { addDays, setHours, setMinutes, addMonths, parse } from 'date-fns';

export function calculateNextDelivery(time: string, frequency: 'daily' | 'weekly' | 'weekdays' | 'monthly'): Date {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  let nextDate = setMinutes(setHours(now, hours), minutes);

  // If the time has already passed today, move to next occurrence
  if (nextDate < now) {
    nextDate = addDays(nextDate, 1);
  }

  // Handle weekly frequency
  if (frequency === 'weekly') {
    const daysUntilNextWeek = (7 - now.getDay() + 1) % 7;
    nextDate = addDays(nextDate, daysUntilNextWeek || 7);
  }
  // Handle weekdays frequency
  else if (frequency === 'weekdays') {
    const day = nextDate.getDay();
    if (day === 0) { // Sunday
      nextDate = addDays(nextDate, 1);
    } else if (day === 6) { // Saturday
      nextDate = addDays(nextDate, 2);
    }
  }
  // Handle monthly frequency
  else if (frequency === 'monthly') {
    if (nextDate < now) {
      nextDate = addMonths(nextDate, 1);
    }
  }

  return nextDate;
}
