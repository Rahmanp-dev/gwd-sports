import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "@/services/authService";
import type { User } from "@/types";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initialize with values from localStorage if available
const isBrowser = typeof window !== 'undefined';
const initialState: AuthState = {
  token: isBrowser ? localStorage.getItem("mg_auth_token") : null,
  refreshToken: isBrowser ? localStorage.getItem("mg_refresh_token") : null,
  user: isBrowser ? JSON.parse(localStorage.getItem("mg_user") || "null") : null,
  isLoading: false,
  error: null,
  isAuthenticated: isBrowser ? !!localStorage.getItem("mg_auth_token") : false,
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

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      name: string;
      email: string;
      password: string;
      phone: string;
      role?: "admin" | "student" | "trainer" | "user";
      sports?: string[];
    },
    { rejectWithValue },
  ) => {
    try {
      console.log("Attempting registration with:", userData.email);
      const response = await authService.register(userData);
      console.log("Registration response:", response);
      return response.data;
    } catch (error: any) {
      console.error("Registration error:", error);
      return rejectWithValue(error.message || "Registration failed");
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
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("mg_user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
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
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role as "admin" | "student" | "trainer" | "user",
          sports: user.sports || [],
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
        };

        // Store in localStorage with console logs for debugging
        if (accessToken) {
          console.log("Storing access token in localStorage:");
          localStorage.setItem("mg_auth_token", accessToken);
        }

        if (refreshToken) {
          console.log("Storing refresh token in localStorage:");
          localStorage.setItem("mg_refresh_token", refreshToken);
        }

        localStorage.setItem(
          "mg_user",
          JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            role: user.role as "admin" | "student" | "trainer" | "user",
            sports: user.sports || [],
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin,
          }),
        );

        console.log("Authentication successful:", { user });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
        console.error("Authentication failed:", action.payload);
      })
      // Registration cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { accessToken, refreshToken, user } = action.payload;

        // Update state
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = accessToken;
        state.refreshToken = refreshToken;
        state.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role as "admin" | "student" | "trainer" | "user",
          sports: user.sports || [],
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
        };

        // Store in localStorage
        if (accessToken) {
          console.log("Storing access token in localStorage");
          localStorage.setItem("mg_auth_token", accessToken);
        }

        if (refreshToken) {
          console.log("Storing refresh token in localStorage");
          localStorage.setItem("mg_refresh_token", refreshToken);
        }

        localStorage.setItem("mg_user", JSON.stringify(state.user));

        console.log("Registration successful:", { user: state.user });
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
        console.error("Registration failed:", action.payload);
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
