import axios from 'axios';

import { UserContext, UserContextProvider } from './UserContext';
import Routes from './Routes';
import { useContext } from 'react';
function App() {
      axios.defaults.baseURL = 'https://chap-app-git-main-royal-dragon.vercel.app/api';
      axios.defaults.withCredentials = true;
      return (

            <UserContextProvider>
                <Routes />
            </UserContextProvider>

      )
}

export default App
