import { z } from "zod";

export enum SupportedLanguages {
	KAB_KAB = "kab_KAB",
	FR_FR = "fr_FR",
}

export const languageSchema = z.enum([
	SupportedLanguages.KAB_KAB,
	SupportedLanguages.FR_FR,
]);

export type Language = z.infer<typeof languageSchema>;
