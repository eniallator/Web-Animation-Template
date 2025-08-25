export const formatDate = (date: Date) =>
  date
    .toLocaleString("en-GB")
    .replace(
      /^(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+), (?<t>[:\d]+)$/,
      "$<y>-$<m>-$<d>T$<t>"
    );
