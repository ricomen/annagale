import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";

window.CookieConsent = CookieConsent;

window.dataLayer = window.dataLayer || [];
window.gtag =
	window.gtag ||
	function gtag() {
		window.dataLayer.push(arguments);
	};

function syncAnalyticsConsent() {
	const granted = CookieConsent.acceptedCategory("analytics");

	window.gtag("consent", "update", {
		analytics_storage: granted ? "granted" : "denied",
		ad_storage: granted ? "granted" : "denied",
		ad_user_data: granted ? "granted" : "denied",
		ad_personalization: granted ? "granted" : "denied",
	});

	document.dispatchEvent(
		new CustomEvent("cookieconsent:update", {
			detail: { analytics: granted },
		})
	);
}

CookieConsent.run({
	cookie: {
		name: "cc_cookie",
		expiresAfterDays: 182,
	},
	guiOptions: {
		consentModal: {
			layout: "box inline",
			position: "bottom left",
			equalWeightButtons: false,
			flipButtons: false,
		},
		preferencesModal: {
			layout: "box",
			equalWeightButtons: false,
			flipButtons: false,
		},
	},
	categories: {
		necessary: {
			enabled: true,
			readOnly: true,
		},
		analytics: {
			autoClear: {
				cookies: [
					{ name: /^_ym_/ },
					{ name: /^_ga/ },
					{ name: "_gid" },
					{ name: /^_tmr/ },
					{ name: /^_gcl_/ },
				],
			},
			services: {
				metrika: {
					label: "Яндекс.Метрика",
				},
				gtm: {
					label: "Google Tag Manager",
				},
				mailru: {
					label: "Top.Mail.Ru",
				},
			},
		},
	},
	language: {
		default: "ru",
		translations: {
			ru: {
				consentModal: {
					// title: "Мы используем cookie",
					description:
						'Мы используем файлы cookie, чтобы сайт ANNA GALE работал корректно и становился удобнее для вас. Подробнее — в <a href="/privacy">Политике конфиденциальности</a>.',
					acceptAllBtn: "Принять все",
					acceptNecessaryBtn: "Только необходимые",
				},

			},
		},
	},
	onConsent: () => {
		syncAnalyticsConsent();
	},
	onChange: () => {
		syncAnalyticsConsent();
	},
});
