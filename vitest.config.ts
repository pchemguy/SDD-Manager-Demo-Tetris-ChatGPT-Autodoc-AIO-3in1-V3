/** Deterministic component and composed-adapter checks; real origins use Playwright. */
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts','tests/integration/**/*.test.ts'] } });
