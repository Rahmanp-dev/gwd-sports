import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { authService } from "@/services/authService";

// TODO; import this from outside not here
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initialize with values from localStorage if available
const initialState: AuthState = {
  token: localStorage.getItem("mg_auth_token"),
  refreshToken: localStorage.getItem("mg_refresh_token"),
  user: JSON.parse(localStorage.getItem("mg_user") || "null"),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem("mg_auth_token"),
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      console.log("Attempting login with:", credentials.email);
      const response = await authService.login(credentials);
      console.log("Login response:", response);
      return response.data;
    } catch (error: any) {
      console.error("Login error:", error);
      return rejectWithValue(error.message || "Login failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Clear state
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem("mg_auth_token");
      localStorage.removeItem("mg_refresh_token");
      localStorage.removeItem("mg_user");

      console.log("User logged out, tokens removed");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { accessToken, refreshToken, user } = action.payload;

        // Update state
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = accessToken;
        state.refreshToken = refreshToken;
        state.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        };

        // Store in localStorage with console logs for debugging
        if (accessToken) {
          console.log(
            "Storing access token in localStorage:",
            accessToken.substring(0, 15) + "...",
          );
          localStorage.setItem("mg_auth_token", accessToken);
        }

        if (refreshToken) {
          console.log(
            "Storing refresh token in localStorage:",
            refreshToken.substring(0, 15) + "...",
          );
          localStorage.setItem("mg_refresh_token", refreshToken);
        }

        localStorage.setItem(
          "mg_user",
          JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          }),
        );

        console.log("Authentication successful:", { user });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
        console.error("Authentication failed:", action.payload);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
