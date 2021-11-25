import i18next from 'i18next';

(async () => {
  await i18next.init({
    resources: {
      en: {
        translation: require('../../../../frontend/locales/en/common.json'),
      },
      'fr-FR': {
        translation: require('../../../../frontend/locales/fr-FR/common.json'),
      },
      'pt-BR': {
        translation: require('../../../../frontend/locales/pt-BR/common.json'),
      },
    },
  });
})();

export default i18next;
