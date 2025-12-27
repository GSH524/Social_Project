import { createSlice } from '@reduxjs/toolkit';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: {
      fullname: '',
      email: '',
      mobile: '',
      address: '',
      uid: '',
      // Note: We usually don't store passwords in Redux for security, 
      // but we keep the structure consistent if you need it.
    },
  },
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    logout: (state) => {
      signOut(auth);
      state.profile = { fullname: '', email: '', mobile: '', address: '', uid: '' };
    },
  },
});

export const { setProfile, logout } = userSlice.actions;
export default userSlice.reducer;