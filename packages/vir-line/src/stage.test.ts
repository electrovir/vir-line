import {describe, itCases} from '@augment-vir/test';
import {stageIdToString} from './stage.js';

describe(stageIdToString.name, () => {
    itCases(stageIdToString, [
        {
            it: 'works with a name and version',
            input: {
                name: 'hi',
                version: 'bye',
            },
            expect: 'hi@bye',
        },
        {
            it: 'works without a version',
            input: {
                name: 'hi',
            },
            expect: 'hi',
        },
    ]);
});
