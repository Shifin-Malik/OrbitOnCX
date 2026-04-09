export const getUTCDateKey = (date = new Date()) => {
  return new Date(date).toISOString().slice(0, 10);
};

export const getUTCYesterdayKey = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

