import { createContext } from "react";
import type { TableConnection } from "@unify/table-core";

export const DemoContext = createContext<{ db: TableConnection; dark: boolean }>(
  null!,
);
