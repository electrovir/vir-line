# vir-line

An assembly line or pipeline that automatically aggregates each of its stages into a final state object type and supports scoped state listeners.

[Demo](http://electrovir.github.io/vir-line)

## Usage

Here's a simple example that defines a stage, constructs and then starts a `VirLine` instance. See the TypeScript types for further options.

Each stage is intended to directly mutate the state object that it is given.

<!-- example-link: src/readme-examples/simple-construction.example.ts -->

```TypeScript
import {VirLine, VirLineStage} from 'vir-line';

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
```
