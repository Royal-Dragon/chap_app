const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const Message = require('./models/message')
const ws = require('ws')
const cors = require('cors');
const User = require('./models/User');
const fs = require('fs');

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const jwt_secret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);


const app = express();
app.use('/uploads', express.static(__dirname +'/uploads'))
app.use(express.json());
app.use(cookieParser());


app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL,
}));

async function getUserData(req){
  return new Promise((resolve, reject)=>{
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwt_secret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData)
      });
    } else{
      reject('no token')
    }
  })
  
}

app.get('/api/test', (req, res) => {
  res.json('test ok');
});

app.get('/api/messages/:userId',async (req,res)=>{
const {userId}= (req.params);
const UserData = await getUserData(req);
const OurId = UserData.userId
console.log({userId,OurId})
const msgs = await Message.find({
  sender:{$in:[userId,OurId]},
  receipient:{$in:[userId,OurId]}
}).sort({createdAt:1})
res.json(msgs)
})

app.get('/api/people', async(req,res) =>{
  res.json(await User.find({},{_id:1,username:1}))
})


app.get('/api/profile', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwt_secret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData)
    })
  } else {
    res.status(401).json('no token')
  }
})


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    const check = bcrypt.compareSync(password, existingUser.password)
    if (check) {
      jwt.sign({ userId: existingUser._id, username }, jwt_secret, {}, (err, token) => {
        if (err) {
          throw err;
        }
        res.cookie('token', token, { sameSite: 'none', secure: true }).json({
          id: existingUser._id,
        })
      })
    }
    else {
      console.log('password wrong')
    }

  }

  console.log('page created')
})

app.post('/api/logout',(req,res)=> {
  res.cookie('token','', { sameSite: 'none', secure: true }).json('logged out');
})


app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {

    const hashpass = bcrypt.hashSync(password, bcryptSalt)
    const createdUser = await User.create({
      username: username,
      password: hashpass
    });
    jwt.sign({ userId: createdUser._id, username }, jwt_secret, {}, (err, token) => {
      if (err) {
        throw err;
      }
      res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
        id: createdUser._id
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json('Error during registration');
  }
});

const server = app.listen(4040, () => {
  console.log('Server listening on port 4040');
});

const wss = new ws.WebSocketServer({ server })

wss.on('connection', (connection, req) => {

function notify_people() {
  [...wss.clients].forEach(Client => {
    Client.send(JSON.stringify(
      {
        online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
      }))
  })
}

  connection.isAlive = true;

  connection.timer = setInterval(()=>{
    connection.ping();
    connection.death = setTimeout(()=>{
      connection.isAlive = false;
      clearInterval(connection.timer)
      connection.terminate();
      notify_people();
      console.log('dead');
    },1000);
  },5000);

 connection.on('pong',()=>{
  clearTimeout(connection.death)
 })

  //getting username and id from cookie for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tcs = cookies.split(';').find(str => str.startsWith('token='))
    if (tcs) {
      const token = tcs.split('=')[1]
      if (token) {
        jwt.verify(token, jwt_secret, {}, (err, userData) => {
          if (err) throw err
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;

        })
      }
    }
  }
  
  connection.on('message',async (message)=>{
    const mesData = JSON.parse(message.toString())
    const {receipient, text,file} = mesData;
    let filename = null;
    if(file){
      const parts = file.name.split(".");
      const ext = parts[parts.length-1];
       filename = Date.now()+ '.'+ext;
      const path = __dirname+'/uploads/'+filename;
      fs.writeFile(path, Buffer.from(file.data.split(',')[1],'base64'), () => {
             console.log('file saved at' +path)
      });
    }
    if(receipient && (text || file)) {
    const MesDoc = await Message.create({
      sender: connection.userId ,
      receipient,
      text,
      file: file ? filename : null
    });
    
      [...wss.clients]
      .filter( c=> c.userId === receipient)
      .forEach(c => c.send(JSON.stringify({
        text,
      sender:connection.userId,
      receipient,
      file: file ? filename :null,
      _id:MesDoc._id,
    })))
    }
  });
 
  //notifying online users who others are online
  notify_people();
}) 
