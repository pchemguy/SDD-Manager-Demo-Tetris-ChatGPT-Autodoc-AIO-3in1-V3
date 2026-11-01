/** Unit tests consume public component APIs without browser/platform state. */
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'] } });
