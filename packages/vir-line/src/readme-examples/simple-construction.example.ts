import {VirLine, VirLineStage} from '../index.js';

const countStage = new VirLineStage<{count: number}>(
    {
        name: 'counter',
    },
    ({state}) => {
        state.count++;
    },
);

const virLine = new VirLine(
    [
        countStage,
    ],
    {
        count: 0,
    },
);

virLine.startUpdateLoop();
