export const COLUMNS = [
  {
    field: "id",
    label: "ID",
    width: 80,
    align: "right" as const,
    editable: false,
  },
  { field: "ticker", label: "Ticker", width: 120 },
  {
    field: "pnl",
    label: "P&L",
    width: 150,
    align: "right" as const,
    format: "currency",
  },
  { field: "region", label: "Region", width: 160 },
  { field: "desk", label: "Desk", width: 130 },
  { field: "trade_date", label: "Date", width: 150, format: "date" },
  {
    field: "volume",
    label: "Volume",
    width: 150,
    align: "right" as const,
    format: "compact",
  },
  {
    field: "notional",
    label: "Notional",
    width: 160,
    align: "right" as const,
    format: "currency",
  },
];
