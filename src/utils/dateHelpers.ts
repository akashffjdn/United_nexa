// --- Date Helper Functions ---
const getFormattedDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getTodayDate = (): string => {
  return getFormattedDate(new Date());
};

export const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getFormattedDate(yesterday);
};

export const isDateInLast7Days = (dateStr: string): boolean => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Set time to 0 to compare dates only
  today.setHours(0, 0, 0, 0);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  // Adjust date parsing to be timezone-safe
  const [year, month, day] = dateStr.split('-').map(Number);
  const checkDate = new Date(year, month - 1, day);

  return checkDate >= sevenDaysAgo && checkDate <= today;
};
// --- End Date Helper Functions ---