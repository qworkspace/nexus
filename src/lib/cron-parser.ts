// Simple cron expression parser for display purposes
// Format: minute hour dayOfMonth month dayOfWeek

interface CronSchedule {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

function parseField(field: string, min: number, max: number): number[] {
  if (field === "*") {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  const values: number[] = [];

  // Handle ranges with step (e.g., */15, 1-5/2)
  if (field.includes("/")) {
    const [range, stepStr] = field.split("/");
    const step = parseInt(stepStr);
    let start = min;
    let end = max;

    if (range !== "*") {
      if (range.includes("-")) {
        const [s, e] = range.split("-").map(Number);
        start = s;
        end = e;
      } else {
        start = parseInt(range);
      }
    }

    for (let i = start; i <= end; i += step) {
      values.push(i);
    }
    return values;
  }

  // Handle comma-separated values
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        values.push(i);
      }
    } else {
      values.push(parseInt(part));
    }
  }

  return values;
}

export function parseCronExpression(expression: string): CronSchedule | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  try {
    return {
      minute: parseField(parts[0], 0, 59),
      hour: parseField(parts[1], 0, 23),
      dayOfMonth: parseField(parts[2], 1, 31),
      month: parseField(parts[3], 1, 12),
      dayOfWeek: parseField(parts[4], 0, 6),
    };
  } catch {
    return null;
  }
}

export function getNextOccurrences(
  expression: string,
  from: Date,
  count: number = 10
): Date[] {
  const schedule = parseCronExpression(expression);
  if (!schedule) return [];

  const occurrences: Date[] = [];
  const current = new Date(from);
  current.setSeconds(0, 0);

  // Limit iterations to prevent infinite loops
  let iterations = 0;
  const maxIterations = 10000;

  while (occurrences.length < count && iterations < maxIterations) {
    iterations++;
    current.setMinutes(current.getMinutes() + 1);

    const minute = current.getMinutes();
    const hour = current.getHours();
    const dayOfMonth = current.getDate();
    const month = current.getMonth() + 1;
    const dayOfWeek = current.getDay();

    if (
      schedule.minute.includes(minute) &&
      schedule.hour.includes(hour) &&
      schedule.dayOfMonth.includes(dayOfMonth) &&
      schedule.month.includes(month) &&
      schedule.dayOfWeek.includes(dayOfWeek)
    ) {
      occurrences.push(new Date(current));
    }
  }

  return occurrences;
}

export function getOccurrencesInRange(
  expression: string,
  from: Date,
  to: Date
): Date[] {
  const schedule = parseCronExpression(expression);
  if (!schedule) return [];

  const occurrences: Date[] = [];
  const current = new Date(from);
  current.setSeconds(0, 0);

  // Start from beginning of the minute
  current.setMinutes(current.getMinutes() - 1);

  while (current < to) {
    current.setMinutes(current.getMinutes() + 1);
    if (current >= to) break;

    const minute = current.getMinutes();
    const hour = current.getHours();
    const dayOfMonth = current.getDate();
    const month = current.getMonth() + 1;
    const dayOfWeek = current.getDay();

    if (
      schedule.minute.includes(minute) &&
      schedule.hour.includes(hour) &&
      schedule.dayOfMonth.includes(dayOfMonth) &&
      schedule.month.includes(month) &&
      schedule.dayOfWeek.includes(dayOfWeek)
    ) {
      occurrences.push(new Date(current));
    }
  }

  return occurrences;
}

export function describeCronExpression(expression: string): string {
  const schedule = parseCronExpression(expression);
  if (!schedule) return "Invalid cron expression";

  const parts: string[] = [];

  // Time
  if (schedule.minute.length === 1 && schedule.hour.length === 1) {
    const hour = schedule.hour[0];
    const minute = schedule.minute[0];
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    parts.push(`at ${displayHour}:${minute.toString().padStart(2, "0")} ${period}`);
  } else if (schedule.minute.includes(0) && schedule.hour.length === 24) {
    parts.push("every hour");
  } else if (schedule.minute.length === 60 && schedule.hour.length === 24) {
    parts.push("every minute");
  }

  // Days
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (schedule.dayOfWeek.length < 7) {
    const days = schedule.dayOfWeek.map((d) => dayNames[d]).join(", ");
    parts.push(`on ${days}`);
  }

  return parts.join(" ") || expression;
}
