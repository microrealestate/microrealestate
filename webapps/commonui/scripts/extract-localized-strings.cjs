const fs = require('node:fs');
const path = require('node:path');
const { Project, Node } = require('ts-morph');

// Shared i18n string harvester for the Next.js webapps (landlord, tenant, ...).
// Each app exposes a thin wrapper that calls `generateLocaleStrings({ appDir })`.
// It scans the app source *and* the shared `commonui` package (whose components
// render inside every app on the same `common` namespace), resolves dynamic
// `t()` keys across files via ts-morph, and rewrites `locales/<lang>/common.json`.

// const TRANSLATION_SERVICE_ENDPOINT = 'https://translate.astian.org/translate';
const DEFAULT_LANGUAGES = ['en', 'fr-FR', 'pt-BR', 'de-DE', 'es-CO'];
const DEFAULT_AUTOMATIC_TRANSLATION_FOR = ['fr-FR'];

// Names a translator can be bound to (next-intl). All call sites use `t`, but we
// also detect the binding so `t.rich`/`t.markup`/`t.raw` and any alias are covered.
const TRANSLATOR_FACTORIES = new Set([
  'useTranslations',
  'getTranslations',
  'createTranslator'
]);
const TRANSLATOR_MEMBERS = new Set(['rich', 'markup', 'raw']);
// Array methods whose callback parameter iterates the receiver array.
const ITERATION_METHODS = new Set([
  'map',
  'flatMap',
  'filter',
  'forEach',
  'find',
  'some',
  'every',
  'reduce'
]);
// Array methods that return the same element values as their receiver, so the
// receiver array can be resolved through them (e.g. `ARR.filter(...).map(...)`).
const ARRAY_PASSTHROUGH_METHODS = new Set([
  'filter',
  'slice',
  'sort',
  'reverse',
  'flat',
  'concat'
]);
// Methods that transform each element via a callback; resolved values are the
// callback's returned expression.
const ARRAY_TRANSFORM_METHODS = new Set(['map', 'flatMap']);
const MAX_RESOLVE_DEPTH = 8;

// -- Dynamic key resolution -------------------------------------------------
// Given the (non-literal) first argument of a t() call, statically resolve the
// set of string keys it can take by following symbols across files: label maps,
// arrays of consts, `.map()` callbacks, object indexing, ternaries, `??` etc.

const unwrap = (node) => {
  let current = node;
  while (
    current &&
    (Node.isParenthesizedExpression(current) ||
      Node.isAsExpression(current) ||
      Node.isSatisfiesExpression(current) ||
      Node.isNonNullExpression(current) ||
      Node.isAwaitExpression(current))
  ) {
    current = current.getExpression();
  }
  return current;
};

// If `identifier` is the parameter of an array-iteration callback
// (e.g. `role` in `ROLES.map((role) => ...)`), return the receiver array node.
const getIterationSourceArray = (declaration) => {
  const fn = declaration.getParent(); // arrow / function expression
  if (!fn || !(Node.isArrowFunction(fn) || Node.isFunctionExpression(fn))) {
    return undefined;
  }
  const call = fn.getParent();
  if (!Node.isCallExpression(call)) {
    return undefined;
  }
  const callee = unwrap(call.getExpression());
  if (
    !Node.isPropertyAccessExpression(callee) ||
    !ITERATION_METHODS.has(callee.getName())
  ) {
    return undefined;
  }
  return callee.getExpression();
};

// Resolve an identifier to the node(s) that carry its value, following imports.
// Each target: { node, mode, injectProp? }. `injectProp`, when set, is the
// property to drill on the resolved node (for destructuring bindings).
//   - mode 'value'        : node holds the value directly.
//   - mode 'arrayElement' : node is an array; each element is a candidate value.
const resolveIdentifierTargets = (identifier) => {
  const targets = [];
  const defs = identifier.getDefinitionNodes();
  for (const def of defs) {
    if (Node.isVariableDeclaration(def)) {
      const init = def.getInitializer();
      if (init) {
        targets.push({ node: init, mode: 'value' });
      }
    } else if (Node.isParameterDeclaration(def)) {
      const source = getIterationSourceArray(def);
      if (source) {
        targets.push({ node: source, mode: 'arrayElement' });
      }
    } else if (Node.isBindingElement(def)) {
      // Object destructuring, e.g. `const { titleKey } = CONFIG[x] ?? DEFAULT`
      // or an iteration param `.filter(({ _id }) => ...)`.
      const propName = (
        def.getPropertyNameNode() ?? def.getNameNode()
      ).getText();
      const paramDecl = def.getFirstAncestor(Node.isParameterDeclaration);
      if (paramDecl) {
        const source = getIterationSourceArray(paramDecl);
        if (source) {
          targets.push({
            node: source,
            mode: 'arrayElement',
            injectProp: propName
          });
        }
      } else {
        const varDecl = def.getFirstAncestor(Node.isVariableDeclaration);
        const init = varDecl?.getInitializer();
        if (init) {
          targets.push({ node: init, mode: 'value', injectProp: propName });
        }
      }
    }
  }
  return targets;
};

// `prop`: property name we are drilling for (undefined = the value itself).
// `viaIndex`: true when reached through `obj[k]` — treat objects as maps whose
// every value is a candidate.
const collectKeys = (node, prop, viaIndex, keys, depth, visited) => {
  if (!node || depth > MAX_RESOLVE_DEPTH) {
    return;
  }
  const target = unwrap(node);
  if (!target || visited.has(target)) {
    return;
  }
  visited.add(target);

  if (
    Node.isStringLiteral(target) ||
    Node.isNoSubstitutionTemplateLiteral(target)
  ) {
    if (!prop) {
      keys.add(target.getLiteralValue());
    }
    return;
  }

  if (Node.isIdentifier(target)) {
    for (const { mode, node: resolved, injectProp } of resolveIdentifierTargets(
      target
    )) {
      const effProp = injectProp !== undefined ? injectProp : prop;
      if (mode === 'value') {
        collectKeys(resolved, effProp, viaIndex, keys, depth + 1, visited);
      } else if (mode === 'arrayElement') {
        // resolved is an array; each element carries the value
        collectKeys(resolved, effProp, false, keys, depth + 1, visited);
      }
    }
    return;
  }

  if (Node.isPropertyAccessExpression(target)) {
    collectKeys(
      target.getExpression(),
      target.getName(),
      false,
      keys,
      depth + 1,
      visited
    );
    return;
  }

  if (Node.isElementAccessExpression(target)) {
    // obj[k] — unknown key, so every entry of obj is a candidate.
    collectKeys(target.getExpression(), prop, true, keys, depth + 1, visited);
    return;
  }

  if (Node.isConditionalExpression(target)) {
    collectKeys(target.getWhenTrue(), prop, viaIndex, keys, depth + 1, visited);
    collectKeys(
      target.getWhenFalse(),
      prop,
      viaIndex,
      keys,
      depth + 1,
      visited
    );
    return;
  }

  if (Node.isBinaryExpression(target)) {
    // `a ?? b` / `a || b`
    collectKeys(target.getLeft(), prop, viaIndex, keys, depth + 1, visited);
    collectKeys(target.getRight(), prop, viaIndex, keys, depth + 1, visited);
    return;
  }

  if (Node.isArrayLiteralExpression(target)) {
    for (const el of target.getElements()) {
      collectKeys(el, prop, false, keys, depth + 1, visited);
    }
    return;
  }

  if (Node.isObjectLiteralExpression(target)) {
    if (viaIndex) {
      // Map with unknown key: drill every value, then apply prop to each.
      for (const p of target.getProperties()) {
        if (Node.isPropertyAssignment(p)) {
          collectKeys(
            p.getInitializer(),
            prop,
            false,
            keys,
            depth + 1,
            visited
          );
        }
      }
    } else if (prop) {
      const p = target.getProperty(prop);
      if (p && Node.isPropertyAssignment(p)) {
        collectKeys(
          p.getInitializer(),
          undefined,
          false,
          keys,
          depth + 1,
          visited
        );
      }
    }
    return;
  }

  if (Node.isCallExpression(target)) {
    const callee = unwrap(target.getExpression());
    if (Node.isPropertyAccessExpression(callee)) {
      const method = callee.getName();
      if (ARRAY_TRANSFORM_METHODS.has(method)) {
        // `X.map((el) => <expr>)` — resolved values are the callback's return.
        const cb = target.getArguments()[0];
        if (cb && (Node.isArrowFunction(cb) || Node.isFunctionExpression(cb))) {
          const body = cb.getBody?.();
          if (body && !Node.isBlock(body)) {
            collectKeys(body, prop, viaIndex, keys, depth + 1, visited);
          }
        }
      } else if (ARRAY_PASSTHROUGH_METHODS.has(method)) {
        // `X.filter(...)` etc. keep the same elements — resolve the receiver.
        collectKeys(
          callee.getExpression(),
          prop,
          viaIndex,
          keys,
          depth + 1,
          visited
        );
      }
    }
    return;
  }
};

const resolveDynamicKeys = (argNode) => {
  const keys = new Set();
  collectKeys(argNode, undefined, false, keys, 0, new Set());
  return keys;
};

// -- Harvesting -------------------------------------------------------------

const harvestKeysFromSourceFiles = ({
  tsConfigFilePath,
  appSrcGlob,
  sharedSrcRoot,
  reportRoot
}) => {
  // Load the app tsconfig so path aliases (`@/*` -> `./src/*`) resolve when
  // following imports across files; add our own file set rather than the tsconfig's.
  const project = new Project({
    tsConfigFilePath,
    compilerOptions: { allowJs: true, jsx: 1 /* preserve */ },
    skipAddingFilesFromTsConfig: true
  });
  // Seed with the app's own sources, then let the resolver pull in what they
  // import. `commonui` is shared but each app renders only a subset of it, so
  // harvesting the whole package would add keys the app can never display.
  project.addSourceFilesAtPaths(appSrcGlob);
  const appFilePaths = new Set(
    project.getSourceFiles().map((file) => file.getFilePath())
  );
  project.resolveSourceFileDependencies();

  const inScope = (filePath) =>
    appFilePaths.has(filePath) || filePath.startsWith(sharedSrcRoot);
  const scopedSourceFiles = project
    .getSourceFiles()
    .filter((file) => inScope(file.getFilePath()));
  const sharedCount = scopedSourceFiles.length - appFilePaths.size;
  if (sharedCount === 0) {
    throw new Error(
      `no files resolved from ${sharedSrcRoot} — module resolution is broken, ` +
        'so every shared key would be pruned. Run `yarn install` and retry.'
    );
  }
  console.log(
    `scanning ${appFilePaths.size} app files and ${sharedCount} shared files they reach`
  );

  const relative = (sourceFile) =>
    path.relative(reportRoot, sourceFile.getFilePath());

  const keys = {};
  const unresolved = [];
  let resolvedCount = 0;

  const addKey = (value) => {
    keys[value] = value;
  };

  for (const sourceFile of scopedSourceFiles) {
    // Collect the local identifiers bound to a translator factory in this file.
    const translatorNames = new Set(['t']);
    sourceFile.forEachDescendant((node) => {
      if (!Node.isVariableDeclaration(node)) {
        return;
      }
      // `const t = useTranslations(...)` or `const t = await getTranslations(...)`
      const init = unwrap(node.getInitializer());
      if (!init || !Node.isCallExpression(init)) {
        return;
      }
      const callee = unwrap(init.getExpression());
      if (
        Node.isIdentifier(callee) &&
        TRANSLATOR_FACTORIES.has(callee.getText())
      ) {
        const name = node.getNameNode();
        if (Node.isIdentifier(name)) {
          translatorNames.add(name.getText());
        }
      }
    });

    const isTranslationCallee = (callee) => {
      if (Node.isIdentifier(callee)) {
        return translatorNames.has(callee.getText());
      }
      if (Node.isPropertyAccessExpression(callee)) {
        const obj = callee.getExpression();
        return (
          Node.isIdentifier(obj) &&
          translatorNames.has(obj.getText()) &&
          TRANSLATOR_MEMBERS.has(callee.getName())
        );
      }
      return false;
    };

    sourceFile.forEachDescendant((node) => {
      if (!Node.isCallExpression(node)) {
        return;
      }
      const callee = unwrap(node.getExpression());
      if (!isTranslationCallee(callee)) {
        return;
      }
      const arg = node.getArguments()[0];
      if (!arg) {
        return;
      }
      const unwrapped = unwrap(arg);
      if (
        Node.isStringLiteral(unwrapped) ||
        Node.isNoSubstitutionTemplateLiteral(unwrapped)
      ) {
        addKey(unwrapped.getLiteralValue());
        return;
      }
      // Dynamic argument — try to resolve statically.
      const resolved = resolveDynamicKeys(arg);
      if (resolved.size) {
        resolvedCount += resolved.size;
        resolved.forEach(addKey);
      } else {
        unresolved.push(
          `${relative(sourceFile)}:${arg.getStartLineNumber()}  t(${arg
            .getText()
            .replace(/\s+/g, ' ')
            .slice(0, 60)})`
        );
      }
    });
  }

  return { keys, unresolved, resolvedCount };
};

const loadKeysFromLocaleFile = (localesDir, language) => {
  let keys;
  try {
    keys = require(path.join(localesDir, language, 'common.json'));
  } catch (_error) {
    keys = {};
  }
  return keys;
};

const loadKeysToKeep = (keptKeysPath) => {
  // read keys to keep even if not found in source code
  let keptKeys;
  try {
    keptKeys = require(keptKeysPath).reduce((acc, key) => {
      acc[key] = true; // init to "true" meaning key found after files crawl
      return acc;
    }, {});
  } catch (_error) {
    keptKeys = {};
  }
  return keptKeys;
};

const mergeKeys = (keptKeys, newKeys, oldKeys) => {
  // Keys that must exist in every locale: harvested from source + explicitly
  // kept (dynamic/external keys not discoverable by scanning). Kept keys are
  // injected even when absent from the current locale file — the file only
  // supplies existing translations.
  const requiredKeys = { ...newKeys };
  Object.keys(keptKeys).forEach((key) => {
    if (!(key in requiredKeys)) {
      requiredKeys[key] = key;
    }
  });

  const mergedKeys = { ...requiredKeys, ...oldKeys };
  const keysToRemove = Object.keys(mergedKeys).filter(
    (key) => !(key in requiredKeys)
  );
  keysToRemove.forEach((key) => {
    delete mergedKeys[key];
  });

  return { mergedKeys, keysToRemove };
};

const logKeysToRemove = (keysToRemove) => {
  if (keysToRemove.length) {
    console.log('Keys removed since last run:');
    console.log(keysToRemove);
  }
};

const translateText = async (text, _sourceLanguage, _targetLanguage) => {
  // try {
  //   const response = await axios.post(TRANSLATION_SERVICE_ENDPOINT, {
  //     q: text,
  //     source: sourceLanguage,
  //     target: targetLanguage,
  //     format: 'text'
  //   });

  //   let translatedText = response.data.translatedText;
  //   if (translatedText.endsWith('.') && !text.endsWith('.')) {
  //     translatedText = translatedText.slice(0, translatedText.length - 1);
  //   }
  //   return _.unescape(translatedText);
  // } catch (error) {
  //   console.error(`\t${error.message}`);
  //   console.error(`\t cannot translate: ${text}`);
  //   return text;
  // }
  return text;
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

const writeLocaleFile = (localesDir, language, keys) => {
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
    path.join(localesDir, language, 'common.json'),
    json.join('\n'),
    { encoding: 'utf8' }
  );
};

const logHarvestReport = (keys, unresolved, resolvedCount) => {
  console.log(
    `harvested ${Object.keys(keys).length} keys (${resolvedCount} from resolved dynamic calls)`
  );
  if (unresolved.length) {
    console.log(
      `\n${unresolved.length} dynamic t() call(s) could not be resolved statically.`
    );
    console.log(
      'Their keys must be listed in scripts/.keptkeys.json (or they will be pruned):'
    );
    for (const line of unresolved.sort()) {
      console.log(`  ${line}`);
    }
    console.log();
  }
};

// Regenerate every `locales/<lang>/common.json` for the app rooted at `appDir`.
const generateLocaleStrings = async ({
  appDir,
  languages = DEFAULT_LANGUAGES,
  automaticTranslationFor = DEFAULT_AUTOMATIC_TRANSLATION_FOR
}) => {
  const localesDir = path.join(appDir, 'locales');
  const keptKeysPath = path.join(appDir, 'scripts', '.keptkeys.json');
  const appSrcGlob = path.join(appDir, 'src/**/*.{js,jsx,ts,tsx}');
  // shared UI package rendered inside every app on the same `common` namespace
  const sharedSrcRoot = path.join(appDir, '..', 'commonui', 'src') + path.sep;

  const {
    keys: newKeys,
    unresolved,
    resolvedCount
  } = harvestKeysFromSourceFiles({
    tsConfigFilePath: path.join(appDir, 'tsconfig.json'),
    appSrcGlob,
    sharedSrcRoot,
    // report paths relative to webapps/ (e.g. `landlord/src/...`, `tenant/src/...`)
    reportRoot: path.join(appDir, '..')
  });
  logHarvestReport(newKeys, unresolved, resolvedCount);
  const keptKeys = loadKeysToKeep(keptKeysPath);

  for (let i = 0; i < languages.length; i++) {
    const language = languages[i];
    console.log(`creating ${language} file...`);
    const oldKeys = loadKeysFromLocaleFile(localesDir, language);
    const { mergedKeys, keysToRemove } = mergeKeys(keptKeys, newKeys, oldKeys);
    if (automaticTranslationFor.includes(language)) {
      await translateKeys(mergedKeys, language);
    }
    logKeysToRemove(keysToRemove);
    // TODO: Ask confirmation to overwrite the locale file
    writeLocaleFile(localesDir, language, mergedKeys);
    console.log('done');
    console.log();
  }
};

module.exports = { generateLocaleStrings };
