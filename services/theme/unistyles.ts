import { StyleSheet } from "react-native-unistyles";
import { darkTheme, galaxiesTheme, lightTheme } from "./theme";

type AppBreakpoints = typeof breakpoints;
type AppThemes = {
	light: typeof lightTheme;
	dark: typeof darkTheme;
	galaxies: typeof galaxiesTheme;
};

const appThemes = {
	light: lightTheme,
	dark: darkTheme,
	galaxies: galaxiesTheme,
};

const breakpoints = {
	xs: 0, // <-- make sure to register one breakpoint with value 0
	sm: 300,
	md: 500,
	lg: 800,
	xl: 1200,
};

declare module "react-native-unistyles" {
	export interface UnistylesBreakpoints extends AppBreakpoints {}
	export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
	themes: appThemes,
	breakpoints,
	settings: {
		initialTheme: () => {
			// get preferred theme from user's preferences/MMKV/SQL/StanJS etc.

			return "light";
		},
	},
});
