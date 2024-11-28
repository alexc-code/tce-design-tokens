import { register, expandTypesMap } from "@tokens-studio/sd-transforms";
import { promises } from "fs";
import StyleDictionary from "style-dictionary";
import { outputReferencesFilter } from "style-dictionary/utils";

register(StyleDictionary);

async function run() {
  const tokensDir = "tokens";
  const themesFile = `./${tokensDir}/$themes.json`;
  const $themes = JSON.parse(await promises.readFile(themesFile, "utf-8"));

  const configs = $themes.map((theme) => {
    const sets = theme.selectedTokenSets;
    const source = Object.entries(sets)
      .filter(([, val]) => val !== "disabled")
      .map(([tokenset]) => `./${tokensDir}/${tokenset}.json`);

    return {
      log: { verbosity: "verbose" },
      source,
      preprocessors: ["tokens-studio"],
      expand: {
        typesMap: expandTypesMap,
      },
      platforms: {
        css: {
          // transformGroup: 'tokens-studio',
          basePxFontSize: 10,
          transforms: [
            "attribute/cti",
            "name/kebab",
            "border/css/shorthand",
            "fontFamily/css",
            "typography/css/shorthand",
            "ts/color/css/hexrgba",
            "ts/color/modifiers",
            "ts/descriptionToComment",
            "ts/opacity",
            "ts/resolveMath",
            "ts/size/css/letterspacing",
            "ts/shadow/innerShadow",
            "ts/typography/fontWeight",
          ],
          buildPath: "src/styles/themes/",
          files: [
            {
              filter: (token) => {
                const isSource = token.filePath.match(/global/);

                return !isSource;
              },
              options: {
                outputReferences: outputReferencesFilter,
              },
              destination: `_${theme.name}.css`,
              format: "css/variables",
            },
          ],
        },
      },
    };
  });

  async function cleanAndBuild(cfg) {
    const sd = new StyleDictionary(cfg);

    await sd.cleanAllPlatforms();
    await sd.buildAllPlatforms();
  }

  await Promise.all(configs.map(cleanAndBuild));
}

run();
