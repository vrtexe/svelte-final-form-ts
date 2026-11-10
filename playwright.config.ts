import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

export default defineConfig({
	webServer: { command: `npm run build && npm run preview -- --port ${port}`, port },
	testMatch: '**/*.e2e.{ts,js}'
});
