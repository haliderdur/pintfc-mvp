import { describe, expect, it } from "vitest";
import { createAnonClient, serviceClient } from "./helpers";

describe("AC-2.2.2 an unpublished result is excluded from record and latest-results reads", () => {
  it("public_match_results omits the one seeded unpublished result", async () => {
    const { data: allResults, error } = await serviceClient.from("match_results").select("match_id, is_published");
    if (error) throw error;
    const publishedCount = allResults!.filter((r) => r.is_published).length;
    const unpublishedCount = allResults!.filter((r) => !r.is_published).length;
    expect(unpublishedCount).toBe(1);

    const client = createAnonClient();
    const { data: publicResults, error: viewError } = await client.from("public_match_results").select("match_id");
    expect(viewError).toBeNull();
    expect(publicResults).toHaveLength(publishedCount);

    const unpublishedMatchId = allResults!.find((r) => !r.is_published)!.match_id;
    expect(publicResults!.some((r) => r.match_id === unpublishedMatchId)).toBe(false);
  });

  it("the base match_results table is not readable by anon at all", async () => {
    const client = createAnonClient();
    const { data, error } = await client.from("match_results").select("*");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
