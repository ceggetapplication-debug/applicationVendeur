import { DarkTheme, DefaultTheme } from "@react-navigation/native";

export const lightTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: "#eec676",
		backgroundOpacity: "#eec67650",
		background: "#ffffff",

		surface: "#231f20", // for modals

		// Texts
		captionOnSurface: "#808080",
		textOnSurface: "#ffffff",
		typography: "#000000",

		ripple: "#eec67650",
		borderInactive: "#49454f",
	},
} as const;

export const darkTheme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: "#eec676",

		backgroundOpacity: "#eec67650",
		background: "#000000",

		surface: "#231f20", // for modals

		// Texts
		typography: "#ffffff",
		captionOnSurface: "#808080",
		textOnSurface: "#ffffff",

		ripple: "#eec67650",
		borderInactive: "#49454f",
	},
} as const;

export const galaxiesTheme = {
	colors: {
		background: "#190c6bff",
		primary: "#eec676",
		backgroundOpacity: "#eec67650",

		surface: "#231f20", // for modals

		// Texts
		typography: "#e4e4e4",
		captionOnSurface: "#808080",
		textOnSurface: "#ffffff",

		ripple: "#eec67650",
		borderInactive: "#49454f",
	},
} as const;
