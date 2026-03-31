import { darkTheme, lightTheme } from "@unify/table-react";
import { useTheme } from "../providers/ThemeProvider";

/** Reactively follow the docs site's dark/light mode. */
export function useDocTheme() {
	const { dark } = useTheme();
	return dark ? darkTheme : lightTheme;
}
