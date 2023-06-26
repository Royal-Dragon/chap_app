import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios';
import { uniqBy } from 'lodash'
import Logo from './Logo';
import { UserContext } from './UserContext'
import { useRef } from 'react';
import Contact from './Contact';
const Chat = () => {
  const [ws, setWs] = useState(null);
  const { username, id, setid, setUsername } = useContext(UserContext)
  const [online, setOnline] = useState({});
  const [Offline, setOffline] = useState({});
  const [newMsg, setNewMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const MesRef = useRef();
  const [selectId, setSelectId] = useState(null);



  useEffect(() => {
    connectToWs();
  }, [])

  function connectToWs() {
    const ws = new WebSocket('ws://localhost:4040')
    setWs(ws)
    ws.addEventListener('message', handleMessage)
    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log("reconnecting");
        connectToWs();
      }, 1000)
    })
  }


  function showOnline(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnline(people);
    console.log(online)
  }
  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    console.log({ e, messageData });
    if ('online' in messageData) {
      showOnline(messageData.online)
    } else if ('text' in messageData) {
      if(messageData.sender === selectId){
        setMessages(item => ([...item, { ...messageData }]))
      }
  
    }
  }

  function gameOver() {
    axios.post('/logout').then(() => {
      setWs(null);
      setid(null);
      setUsername(null);
    })
  }


  function sendMsg(e, file = null) {
    if (e) e.preventDefault();

    ws.send(JSON.stringify({
      receipient: selectId,
      text: newMsg,
      file,
    }));
    setNewMsg('')
    setMessages(item => ([...item, {
      text: newMsg,
      sender: id,
      receipient: selectId,
      _id: Date.now(),
    }]))
    if (file) {
      axios.get('/messages/' + selectId).then(res => {
        sendMsg(res.data);
      })
    }
  }

  function sendFile(e) {
    console.log(e.target.files[0]);
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
      sendMsg(null, {
        name: e.target.files[0].name,
        data: reader.result,
      })
    }
  }
  useEffect(() => {
    const div = MesRef.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: "end" })
    }
  }, [messages])

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlineArr = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(online).includes(p._id));
      const offline = {};
      offlineArr.forEach(p => {
        offline[p._id] = p;
      })
      setOffline(offline)
    })
  }, [online])

  useEffect(() => {
    if (selectId) {
      axios.get('/messages/' + selectId).then(res => {
        setMessages(res.data);
      })
    }
  }, [selectId])


  const onlineExceptYou = { ...online }
  delete onlineExceptYou[id]

  const mesNoDuplicate = uniqBy(messages, '_id');
  console.log(mesNoDuplicate);

  return (
    <div className='flex h-screen'>
      <div className="bg-white w-1/3 flex flex-col ">
        <div className='flex-grow'>
          <Logo />
          {Object.keys(onlineExceptYou).map(userId => (
            <Contact
              key={userId}
              id={userId}
              username={onlineExceptYou[userId]}
              onClick={() => setSelectId(userId)}
              selected={userId === selectId}
              online={true}
            />
          ))}

          {Object.keys(Offline).map(userId => (
            <Contact
              key={userId}
              id={userId}
              username={Offline[userId].username}
              onClick={() => setSelectId(userId)}
              selected={userId === selectId}
              online={false}
            />
          ))}
        </div>


        <div className='p-2 text-center flex  items-center justify-center'>
          <span className='mr-2 text-md text-gray-500 flex items-center'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8">
              <path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd" />
            </svg>
            {username}
          </span>
          <button
            onClick={gameOver}
            className='inline-flex items-center justify-center  px-2 py-1 text-md font-semibold text-white transition-all duration-200 bg-blue-400 border border-transparent rounded-md focus:outline-none hover:bg-blue-700 focus:bg-blue-700'>Logout</button>
        </div>



      </div>
      <div className="bg-blue-100 flex flex-col w-2/3 p-2">
        <div className='flex-grow'>
          {!selectId && (
            <div className='h-full text-2xl text-gray-400 font-semibold flex items-center justify-center te'>
              &larr; select a person from sidebar
            </div>
          )}
        </div>
        {!!selectId && (
          <div className='relative h-full'>
            <div className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-2'>
              {mesNoDuplicate.map(item => (
                <div key={item._id} className={(item.sender === id ? 'text-right' : 'text-left')}>
                  <div className={'text-left inline-block p-2 my-2 rounded-lg ' + (item.sender === id ? 'bg-blue-500 text-white' : 'bg-green-500 text-gray-600')}>
                    {item.text}
                    {item.file && (
                      <div className='flex items-center gap-1'>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                        <a target='_blank' className='underline' href={axios.defaults.baseURL + '/uploads/' + item.file}>
                          {item.file}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={MesRef}></div>
            </div>
          </div>
        )}

        {!!selectId && (<form className='flex gap-2' onSubmit={sendMsg}>
          <input type="text"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder='type your messsage'
            className="bg-white flex-grow mx-2 border p-2" />
          <label className='bg-blue-400 p-2 rounded-md text-gray-600 border border-blue-200'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <input type="file" className='hidden' onChange={sendFile} />
          </label>
          <button type='submit' className='bg-blue-500 p-2 rounded-md text-white' >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
        )}

      </div>
    </div>
  )
}

export default Chat