import i18next from 'i18next';

(async () => {
  await i18next.init({
    resources: {
      en: {
        translation: require('../../../webapps/landlord/locales/en/common.json'),
      },
      'fr-FR': {
        translation: require('../../../webapps/landlord/locales/fr-FR/common.json'),
      },
      'pt-BR': {
        translation: require('../../../webapps/landlord/locales/pt-BR/common.json'),
      },
      'de-DE': {
        translation: require('../../../webapps/landlord/locales/de-DE/common.json'),
      },
    },
  });
})();

export default i18next;
