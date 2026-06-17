// Global UI state for the feature. Only `currentMemberId` ("who am I") lives here —
// drag state stays local (T6) and server data is owned by RTK Query.

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export interface AvailabilityUiState {
  currentMemberId: string | null;
}

const initialState: AvailabilityUiState = {
  currentMemberId: null,
};

const availabilitySlice = createSlice({
  name: "availabilityUi",
  initialState,
  reducers: {
    setCurrentMember(state, action: PayloadAction<string | null>) {
      state.currentMemberId = action.payload;
    },
  },
});

export const { setCurrentMember } = availabilitySlice.actions;
export const availabilityReducer = availabilitySlice.reducer;

export const selectCurrentMemberId = (state: RootState): string | null =>
  state.availabilityUi.currentMemberId;
