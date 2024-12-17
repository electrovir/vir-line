import {defineConfig} from '@virmator/frontend/configs/vite.config.base.ts';
import {join, resolve} from 'node:path';

export default defineConfig(
    {
        forGitHubPages: true,
        packageDirPath: resolve(import.meta.dirname, '..'),
    },
    (baseConfig, basePaths) => {
        return {
            ...baseConfig,
            build: {
                outDir: join(basePaths.cwd, 'dist-pages'),
            },
            resolve: {
                ...baseConfig.resolve,
                alias: {
                    'vir-line': resolve('../vir-line/src/index.ts'),
                },
            },
        };
    },
);
