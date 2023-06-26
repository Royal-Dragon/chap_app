import { createContext, useEffect, useState } from "react";
import axios from "axios"


export const UserContext = createContext({});

export function UserContextProvider({children}){
    const[username,setUsername] = useState(null)
    const[id,setid] = useState(null)
    useEffect(()=>{
        axios.get('/profile' ).then(response=>{
            setid(response.data.userId);
            setUsername(response.data.username)
        })
    })
    return(
       <UserContext.Provider value={{username,setUsername,id,setid}}>
       {children}
       </UserContext.Provider>
    );
} 