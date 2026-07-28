// GET /api/share/:snapshotId — read an anonymous tier-list share snapshot.
import { handleGetRequest, type ShareKv } from "../../../src/lib/cloud-state/share-endpoint.ts";

type PagesContext = {
  request: Request;
  env: { SHARE_KV?: ShareKv };
  params: { snapshotId?: string | string[] };
};

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const snapshotId = typeof context.params.snapshotId === "string" ? context.params.snapshotId : "";
  return handleGetRequest(context.env.SHARE_KV, "tier-list.v1", snapshotId);
}
