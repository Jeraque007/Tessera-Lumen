import { handleRequest } from './router';

/**
 * Entry point for the Cloudflare Worker
 */
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};
