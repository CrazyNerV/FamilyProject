# Offline English pronunciation engine

`english-engine.mjs.gz` bundles the EnglishG2P export of [phonemize 2.0.1](https://github.com/hans00/phonemize) with its pronunciation data and spelling-to-sound rules. License: MIT; see phonemize-LICENSE.txt. No remote dictionary API is used.

Built with esbuild 0.25.12. JSON namespace imports are changed to default imports before bundling to reduce duplicate export code. Rebuild from the repository root with `npm install` then `npm run build:pronunciation`.

The app fetches this asset from its own GitHub Pages origin, decompresses it, and uses a local module to predict English phonemes. Original input is not sent to an API. Existing browser TTS remains separate and may use device- or browser-provided online voices.
