import { useContext } from 'react'
import Register from './register'
import Chat from './Chat';
import { UserContext } from './UserContext'


export default function Routes (){
  const { username, id } = useContext(UserContext);
  if(username){
    return (
      <Chat />
    )

  }
  return(
    <Register />
  )
}