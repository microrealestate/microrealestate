const fs = require('fs');
const path = require('path');
const { fdir } = require('fdir');
const axios = require('axios');
const _ = require('lodash');

const TRANSLATION_SERVICE_ENDPOINT = 'https://translate.astian.org/translate';
const LANGUAGES = ['en', 'fr-FR', 'pt-BR', 'de-DE'];
const AUTOMATIC_TRANSLATION_FOR = ['fr-FR'];

const harvestKeysFromSourceFiles = () => {
  // parse source code to extract the i18n keys
  const files = new fdir()
    .withBasePath()
    .withDirs()
    .glob('./**/*.js')
    .crawl(path.resolve(__dirname, '../src'))
    .sync();

  const keys = files.reduce((acc, file) => {
    const content = fs.readFileSync(file, { encoding: 'utf8' });
    const keys = Array.from(
      content.matchAll(/[\s{(,}:]t\(\s*('(.+?)'|"(.+?)")/g)
    );

    if (keys.length) {
      keys.forEach(([, , key1, key2]) => {
        if (key1) {
          acc[key1] = key1;
        } else if (key2) {
          acc[key2] = key2;
        }
      });
    }

    return acc;
  }, {});

  return keys;
};

const loadKeysFromLocaleFile = (language) => {
  let keys;
  try {
    keys = require(
      path.resolve(__dirname, `../locales/${language}/common.json`)
    );
  } catch (error) {
    keys = {};
  }
  return keys;
};

const loadKeysToKeep = () => {
  // read keys to keep even if not found in source code
  let keptKeys;
  try {
    keptKeys = require(path.resolve(__dirname, '.keptkeys.json')).reduce(
      (acc, key) => {
        acc[key] = true; // init to "true" meaning key found after files crawl
        return acc;
      },
      {}
    );
  } catch (error) {
    keptKeys = {};
  }
  return keptKeys;
};

const computeKeyFoundStatus = (keptKeys, newKeys, oldKeys) => {
  const keysFoundStatus = Object.keys(oldKeys).reduce((acc, key) => {
    acc[key] = !!keptKeys[key]; // "true" if in keptKeys otherwise "false" (meaning key not found so far)
    return acc;
  }, {});
  Object.keys(newKeys).forEach((key) => {
    keysFoundStatus[key] = true; // key found from newKeys (harvested keys)
  });
  return keysFoundStatus;
};

const mergeKeys = (keptKeys, newKeys, oldKeys) => {
  const mergedKeys = Object.entries(oldKeys).reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {
      ...newKeys
    }
  );
  const keysFoundStatus = computeKeyFoundStatus(keptKeys, newKeys, oldKeys);
  Object.entries(keysFoundStatus)
    .filter(([, value]) => !value)
    .map(([key]) => key)
    .forEach((key) => {
      delete mergedKeys[key];
    });

  return {
    mergedKeys,
    keysToRemove: Object.entries(keysFoundStatus)
      .filter(([, value]) => !value)
      .map(([key]) => key)
  };
};

const logKeysToRemove = (keysToRemove) => {
  if (keysToRemove.length) {
    console.log('Keys removed since last run:');
    console.log(keysToRemove);
  }
};

const translateText = async (text, sourceLanguage, targetLanguage) => {
  try {
    const response = await axios.post(TRANSLATION_SERVICE_ENDPOINT, {
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: 'text'
    });

    let translatedText = response.data.translatedText;
    if (translatedText.endsWith('.') && !text.endsWith('.')) {
      translatedText = translatedText.slice(0, translatedText.length - 1);
    }
    return _.unescape(translatedText);
  } catch (error) {
    console.error(`\t${error.message}`);
    console.error(`\t cannot translate: ${text}`);
    return text;
  }
};

const translateKeys = async (keys, language) => {
  console.log(`please wait translating strings in ${language}...`);
  const keyEntries = Object.entries(keys);
  for (let i = 0; i < keyEntries.length; i++) {
    const [key, value] = keyEntries[i];
    if (key === value && value.indexOf('{{') === -1) {
      keys[key] = await translateText(value, 'en', language.split('-')[0]);
    }
  }
};

const writeLocaleFile = (language, keys) => {
  // create the updated json strings
  const json = [
    '{',
    Object.entries(keys)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([key, value]) =>
          `  "${key.replaceAll('"', '\\"')}": "${value.replaceAll('"', '\\"')}"`
      )
      .join(',\n'),
    '}'
  ];

  // replace existing local file with new content
  fs.writeFileSync(
    path.resolve(__dirname, `../locales/${language}/common.json`),
    json.join('\n'),
    { encoding: 'utf8' }
  );
};

const main = async () => {
  const newKeys = harvestKeysFromSourceFiles();
  const keptKeys = loadKeysToKeep();

  for (let i = 0; i < LANGUAGES.length; i++) {
    const language = LANGUAGES[i];
    console.log(`creating ${language} file...`);
    const oldKeys = loadKeysFromLocaleFile(language);
    const { mergedKeys, keysToRemove } = mergeKeys(keptKeys, newKeys, oldKeys);
    if (AUTOMATIC_TRANSLATION_FOR.includes(language)) {
      await translateKeys(mergedKeys, language);
    }
    logKeysToRemove(keysToRemove);
    // TODO: Ask confirmation to overwrite the locale file
    writeLocaleFile(language, mergedKeys);
    console.log('done');
    console.log();
  }
};

main();
