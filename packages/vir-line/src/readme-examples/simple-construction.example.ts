import {VirLine, VirLineStage} from '../index';

const countStage: VirLineStage<{count: number}> = {
    executor({state}) {
        state.count++;
    },
    stageId: {
        name: 'counter',
    },
};

const virLine = new VirLine(
    [
        countStage,
    ],
    {
        count: 0,
    },
);

virLine.startUpdateLoop();
