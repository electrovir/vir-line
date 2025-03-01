const {baseConfig} = require('@virmator/spellcheck/configs/cspell.config.base.cjs');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
    ],
    words: [
        ...baseConfig.words,
        'arrayiterator',
        'Evgeny',
        'mapiterator',
        'Poberezkin',
        'Schlinkert',
        'setiterator',
        'stringiterator',
    ],
};
