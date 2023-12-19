const express = require('express');
const http = require('http');
const app = express();
const WebSocket = require("ws");
const cors = require("cors");
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// cors
app.use(cors({ origin: [
    'http://localhost:3000',
    'https://nomalog.netlify.app'
]}));

wss.on("connection", (socket)=>{
    console.log("클라이언트와 연결 성공");
    socket.send("서버에서 당신의 접속을 환영하고 있습니다.");

    socket.on("close", ()=>{
        console.log("클라이언트와 연결 해제");
    });

    socket.on("message", (message)=>{
        console.log(message.toString('utf8'));
    })
});

app.get('/', (req, res) => {
    res.json("Hello world!");
});

module.exports = {
    server,
}