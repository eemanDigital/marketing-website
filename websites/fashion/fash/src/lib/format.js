export const naira = (value) =>
  `₦${Number(value).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
