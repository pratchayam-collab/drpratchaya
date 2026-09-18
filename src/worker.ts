/// <reference path="../worker-configuration.d.ts" />
/**
 * Worker entry: Astro fetch + queue consumer + scheduled cron.
 * Wrangler `main` must point here so the Cloudflare Vite plugin bundles
 * queue/scheduled alongside Astro during `astro build` (adapter 14 custom entry).
 */
import { handle } from '@astrojs/cloudflare/handler';
import { handleScheduled } from '~/lib/cron';
import { handleNotifyBatch } from '~/lib/notify-consumer';
import type { NotifyJob } from '~/lib/notify-messages';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handle(request, env, ctx);
  },

  // Both handlers return their promise rather than deferring with waitUntil.
  // A queue handler that returns before its work settles is acked immediately,
  // so a later rejection can never trigger the `max_retries` and `notify-dlq`
  // configured in wrangler.jsonc, and failed notifications vanish silently.
  async scheduled(event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
    await handleScheduled(event);
  },
  async queue(batch: MessageBatch<NotifyJob>, _env: Env, _ctx: ExecutionContext) {
    await handleNotifyBatch(batch);
  },
};
