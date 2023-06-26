const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    sender:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    receipient:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
     text: String,
     file: String,
}, {timestamps:true});

const MsgModel = mongoose.model('Message', MessageSchema);
module.exports=MsgModel;