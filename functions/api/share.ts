// POST /api/share — create an anonymous tier-list share snapshot.
// Requires a KV namespace bound as SHARE_KV on the blog.oiyo.net Pages project;
// without the binding every request fails closed with 503.
import { handleCreateRequest, type ShareKv } from "../../src/lib/cloud-state/share-endpoint.ts";

type PagesContext = {
  request: Request;
  env: { SHARE_KV?: ShareKv };
};

export async function onRequestPost(context: PagesContext): Promise<Response> {
  return handleCreateRequest(context.env.SHARE_KV, "tier-list.v1", context.request);
}
