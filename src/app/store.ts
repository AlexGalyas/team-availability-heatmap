import { configureStore } from "@reduxjs/toolkit";
import { availabilityApi } from "@/features/availability/model/availabilityApi";
import { availabilityReducer } from "@/features/availability/model/availabilitySlice";

// Factory so each client gets its own store instance (avoids cross-request leakage
// under SSR and gives tests an isolated store).
export function makeStore() {
  return configureStore({
    reducer: {
      availabilityUi: availabilityReducer,
      [availabilityApi.reducerPath]: availabilityApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(availabilityApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
