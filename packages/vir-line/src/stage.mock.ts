import {VirLineStage} from './stage';

export const debugMockStage: VirLineStage = {
    executor() {
        console.info('updating');
    },
    stageId: {
        name: 'log debugging',
    },
};
