// RTK Query API for the availability feature. Owns client-side reads/caching and
// mutations against the mock route handlers (T3). After mount this is the canonical
// data source; Server Components only seed the first paint (T5).

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  PutAvailabilityBody,
  RecurringRuleBody,
} from "../server/contracts";
import type { Member, MemberAvailability } from "./types";

// Absolute base URL so requests work under both the browser and jsdom/undici (tests).
// RTK Query only ever runs client-side, so `window` is defined when a request fires.
const baseUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "http://localhost/api";

export const availabilityApi = createApi({
  reducerPath: "availabilityApi",
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ["Availability"],
  endpoints: (builder) => ({
    getMembers: builder.query<Member[], void>({
      query: () => "members",
    }),

    getAvailability: builder.query<MemberAvailability[], void>({
      query: () => "availability",
      providesTags: ["Availability"],
    }),

    putMyAvailability: builder.mutation<MemberAvailability[], PutAvailabilityBody>({
      query: (body) => ({ url: "availability", method: "PUT", body }),
      invalidatesTags: ["Availability"],
      // Optimistic: reflect the new layer in the heatmap immediately; roll back on error.
      async onQueryStarted({ memberId, slots }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          availabilityApi.util.updateQueryData(
            "getAvailability",
            undefined,
            (draft) => {
              const layer = draft.find((m) => m.memberId === memberId);
              if (layer) {
                layer.slots = slots;
              } else {
                draft.push({ memberId, slots });
              }
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    applyRecurringRule: builder.mutation<MemberAvailability[], RecurringRuleBody>({
      query: (body) => ({
        url: "availability/recurring",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Availability"],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useGetAvailabilityQuery,
  usePutMyAvailabilityMutation,
  useApplyRecurringRuleMutation,
} = availabilityApi;
