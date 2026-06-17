import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "@/app/store";
import type { Member, MemberAvailability } from "./types";
import { availabilityApi } from "./availabilityApi";

const fetchMock = vi.fn();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// fetchBaseQuery calls fetch() with a single Request object — normalise method/url.
function reqInfo(input: unknown, init?: RequestInit): { method: string; url: string } {
  if (input instanceof Request) {
    return { method: input.method.toUpperCase(), url: input.url };
  }
  return { method: (init?.method ?? "GET").toUpperCase(), url: String(input) };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("availabilityApi — queries", () => {
  it("fetches members from /api/members", async () => {
    const members: Member[] = [{ id: "m1", name: "Олена" }];
    fetchMock.mockResolvedValueOnce(jsonResponse(members));

    const store = makeStore();
    const result = await store.dispatch(
      availabilityApi.endpoints.getMembers.initiate(),
    );

    expect(result.data).toEqual(members);
    expect(reqInfo(fetchMock.mock.calls[0]?.[0]).url).toContain("/api/members");
  });
});

describe("availabilityApi — putMyAvailability optimistic update", () => {
  const initial: MemberAvailability[] = [{ memberId: "m1", slots: ["1-9"] }];
  const next: MemberAvailability[] = [{ memberId: "m1", slots: ["2-10", "2-11"] }];

  it("applies the new layer to the cache before the server responds", async () => {
    let releasePut!: () => void;
    const putGate = new Promise<void>((resolve) => {
      releasePut = resolve;
    });

    fetchMock.mockImplementation(
      async (input: unknown, init?: RequestInit): Promise<Response> => {
        if (reqInfo(input, init).method === "PUT") {
          await putGate;
          return jsonResponse(next);
        }
        return jsonResponse(initial);
      },
    );

    const store = makeStore();
    await store.dispatch(availabilityApi.endpoints.getAvailability.initiate());

    const mutation = store.dispatch(
      availabilityApi.endpoints.putMyAvailability.initiate({
        memberId: "m1",
        slots: ["2-10", "2-11"],
      }),
    );

    // Let onQueryStarted apply its optimistic patch.
    await Promise.resolve();
    const optimistic = availabilityApi.endpoints.getAvailability.select()(
      store.getState(),
    );
    expect(optimistic.data).toEqual(next);

    releasePut();
    await mutation;
  });

  it("rolls back the optimistic patch when the request fails", async () => {
    fetchMock.mockImplementation(
      async (input: unknown, init?: RequestInit): Promise<Response> => {
        if (reqInfo(input, init).method === "PUT") {
          return jsonResponse({ error: "boom" }, 500);
        }
        return jsonResponse(initial);
      },
    );

    const store = makeStore();
    await store.dispatch(availabilityApi.endpoints.getAvailability.initiate());

    await store.dispatch(
      availabilityApi.endpoints.putMyAvailability.initiate({
        memberId: "m1",
        slots: ["2-10", "2-11"],
      }),
    );

    const rolledBack = availabilityApi.endpoints.getAvailability.select()(
      store.getState(),
    );
    expect(rolledBack.data).toEqual(initial);
  });
});
