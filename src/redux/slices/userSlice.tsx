import {createSlice} from '@reduxjs/toolkit';

export interface UserInfo{
    _id : string;
  name : string;
  email: string;
  role: string;
}

interface InitialState{
    userInfo : UserInfo | null;
}
const userInfoFromLocalStorage = localStorage.getItem("userInfo");

const initialState: InitialState = {
    userInfo: userInfoFromLocalStorage? JSON.parse(userInfoFromLocalStorage): null,
}
const authSlice = createSlice({
    name:'userAuth',
    initialState,
    reducers:{

          setUserCredentials: (state, action) => {
            state.userInfo = action.payload;
            localStorage.setItem("userInfo", JSON.stringify(action.payload));
          },
          userLogOut: (state) => {
            state.userInfo = null;
            localStorage.removeItem("userInfo")
          },
    }
})

export const {

  setUserCredentials,
  userLogOut
  
} = authSlice.actions

export default authSlice.reducer