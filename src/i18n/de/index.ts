import type { Translation } from "../i18n-types.js";

const de = {
	WELCOME: "Willkommen bei PostApp",
	HOME: "Startseite",
	LOGIN: "Anmelden",
	REGISTER: "Registrieren",
	CREATE_POST: "Beitrag erstellen",
	LOGOUT: "Abmelden",
	PUBLISH: "Beitrag veröffentlichen",
	CONTENT: "Inhalt",
	TITLE: "Titel",
	LOAD_MORE: "Weitere Beiträge laden",
	NO_POSTS: "Noch keine Beiträge vorhanden. Sei der Erste!",
	LOGIN_WELCOME: "Willkommen zurück",
	JOIN_US: "Mach mit",
	NEW_POST: "Neuer Beitrag",
	ENTER_TITLE: "Gib einen packenden Titel ein...",
	STORY_PLACEHOLDER: "Teile deine Geschichte...",
	PUBLISHED_ON: "Veröffentlicht am {date}",
	NEED_ACCOUNT: "Noch kein Konto? Registrieren",
	ALREADY_HAVE_ACCOUNT: "Bereits ein Konto? Anmelden",
	VALIDATION_TITLE_REQUIRED: "Titel ist erforderlich",
	VALIDATION_TITLE_TOO_LONG: "Titel ist zu lang (max. 100 Zeichen)",
	VALIDATION_CONTENT_REQUIRED: "Inhalt ist erforderlich",
	ERROR_POST_NOT_FOUND: "Beitrag nicht gefunden",
	ERROR_UNAUTHORIZED: "Nicht autorisiert",
} satisfies Translation;

export default de;
