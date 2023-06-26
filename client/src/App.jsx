import axios from 'axios';

import { UserContext, UserContextProvider } from './UserContext';
import Routes from './Routes';
import { useContext } from 'react';
function App() {
      axios.defaults.baseURL = 'https://chat-app-2ne0.onrender.com';
      axios.defaults.withCredentials = true;
      return (

            <UserContextProvider>
                <Routes />
            </UserContextProvider>

      )
}

export default App
