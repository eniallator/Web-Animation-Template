export const formatIsoDate = (date: Date) =>
  date.toISOString().replace(/z.*$/i, "");

export const formatDate = (date: Date) =>
  date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>[:\d]+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );
