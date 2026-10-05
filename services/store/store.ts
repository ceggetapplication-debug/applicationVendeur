import { Databases, type Models } from "react-native-appwrite";
import { createStore } from "stan-js";
import { storage } from "stan-js/storage";

export const { useStoreEffect, useStore } = createStore({
	user: storage<Models.Session | undefined>(undefined, {
		storageKey: "user",
	}),
	selectedLanguage: storage<string | undefined>(undefined, {
		storageKey: "appLanguage",
	}),
});
