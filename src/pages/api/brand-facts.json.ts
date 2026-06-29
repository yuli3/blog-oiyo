import type { APIRoute } from "astro";
import { brandFacts, jsonResponse } from "../../data/brand-facts";

export const GET: APIRoute = async () => {
  return jsonResponse(brandFacts);
};
