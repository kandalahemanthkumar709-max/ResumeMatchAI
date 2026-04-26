import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

// Async Thunks
export const loadUser = createAsyncThunk(
    'auth/loadUser',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get('/api/auth/me');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to load user');
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const res = await axios.post('/api/auth/register', userData);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Registration failed');
        }
    }
);

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Login failed');
        }
    }
);
export const setRole = createAsyncThunk(
    'auth/setRole',
    async (role, { rejectWithValue }) => {
        try {
            const res = await axios.patch('/api/auth/set-role', { role });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Role assignment failed');
        }
    }
);

const initialState = {
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: false,
    isLoading: !!localStorage.getItem('token'),
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // loadUser
        builder.addCase(loadUser.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(loadUser.fulfilled, (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        });
        builder.addCase(loadUser.rejected, (state) => {
            localStorage.removeItem('token');
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
        });

        // register
        builder.addCase(register.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(register.fulfilled, (state, action) => {
            localStorage.setItem('token', action.payload.token);
            state.token = action.payload.token;
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        });
        builder.addCase(register.rejected, (state, action) => {
            localStorage.removeItem('token');
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = action.payload;
        });

        // login
        builder.addCase(login.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            localStorage.setItem('token', action.payload.token);
            state.token = action.payload.token;
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        });
        builder.addCase(login.rejected, (state, action) => {
            localStorage.removeItem('token');
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = action.payload;
        });

        // setRole
        builder.addCase(setRole.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(setRole.fulfilled, (state, action) => {
            localStorage.setItem('token', action.payload.token);
            state.token = action.payload.token;
            state.user = { 
                ...state.user, 
                role: action.payload.role
            };
            state.isLoading = false;
        });
        builder.addCase(setRole.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
