// utils/dateUtils.js
const parseDateParam = (param) => {
  if (!param) return new Date();

  // Try ISO date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const date = new Date(param);
    if (!isNaN(date)) return date;
  }

  // Try month format (YYYY-MM)
  if (/^\d{4}-\d{2}$/.test(param)) {
    const date = new Date(param + "-01");
    if (!isNaN(date)) return date;
  }

  throw new Error("Invalid date format. Use YYYY-MM-DD or YYYY-MM");
};

const getDateRange = (period, dateParam) => {
  const date = parseDateParam(dateParam);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  let start, end;

  switch (period.toLowerCase()) {
    case "today":
      start = new Date(Date.UTC(year, month, day, 0, 0, 0));
      end = new Date(Date.UTC(year, month, day + 1, 0, 0, 0));
      break;

    case "week":
      const dayOfWeek = date.getUTCDay(); // Sunday=0, Monday=1, ..., Saturday=6

      // Correct calculation for days to subtract to get to Monday
      const daysToSubtract = (dayOfWeek + 6) % 7;

      start = new Date(Date.UTC(year, month, day - daysToSubtract, 0, 0, 0));

      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      break;

    case "month":
      start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
      break;

    case "last-week":
      const lastWeekDayOfWeek = date.getUTCDay();
      const lastWeekDaysToSubtract = (lastWeekDayOfWeek + 6) % 7;
      start = new Date(
        Date.UTC(year, month, day - lastWeekDaysToSubtract - 7, 0, 0, 0)
      );
      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      break;

    case "last-month":
      const prevMonthYear = month === 0 ? year - 1 : year;
      const prevMonth = month === 0 ? 11 : month - 1;

      start = new Date(Date.UTC(prevMonthYear, prevMonth, 1, 0, 0, 0));
      end = new Date(
        Date.UTC(prevMonthYear, prevMonth + 1, 0, 23, 59, 59, 999)
      );
      break;

    case "yesterday":
      const yesterday = new Date(date);
      yesterday.setDate(date.getDate() - 1);

      start = new Date(yesterday);
      start.setHours(0, 0, 0, 0);

      end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      break;

    default:
      throw new Error(`Invalid period specified: ${period}`);
  }

  return { start, end };
};

module.exports = { getDateRange, parseDateParam };
