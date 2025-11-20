import { createSlice } from '@reduxjs/toolkit';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const initialState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, setLoading, logout } = authSlice.actions;

// Thunk to handle logout
export const logoutUser = () => async (dispatch) => {
  await signOut(auth);
  dispatch(logout());
};

export default authSlice.reducer;

