const express = require('express');
const http = require('http');
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const server = http.createServer(app);

// const io = SocketIo(server);

// cors
app.use(cors({ origin: [
    'http://localhost:3000',
    'https://nomalog.netlify.app'
]}));

const io = new Server(server, {
    cors : {
        origin : "http://localhost:3000",
    }
})

const publicRoom = () => {
    const {
        sockets : {
            adapter : {sids, rooms},
        },
    
    } = io;

    console.log(rooms);

    const publicRooms = [];
    rooms.forEach((_, key)=>{
        // public room이라면
        if(sids.get(key) === undefined){
            const count = countRoom(key);
            const roomObj = {
                roomName : key,
                roomCount : count,
            }
            publicRooms.push(roomObj);
            // publicRooms.push(key);
        }
    });

    return publicRooms;
}

const countRoom = (roomName) => {
    return io.sockets.adapter.rooms.get(roomName)?.size;
}



io.on("connection", (socket)=>{
    console.log("클라이언트와 연결 성공");
    socket.nickname = "Anonymous";

    socket.on("enter_room", (data)=>{
        console.log(`${socket.nickname}님이 ${data.enterRoom}방에 입장하셨습니다.`)
        socket.join(data.enterRoom);
        // socket.to(data.enterRoom).emit("welcome", `환영합니다. ${socket.nickname}님이 입장하셨습니다.`);
        socket.to(data.enterRoom).emit("welcome", `환영합니다. ${socket.nickname}님이 입장하셨습니다.`, data.enterRoom);
        // io.to(data.enterRoom).emit("welcome", `환영합니다. ${socket.nickname}님이 입장하셨습니다.`);

        // socket.broadcast.emit : 나를 제외한 모두에게 broadcast
        // io.emit : 모두에게 broadcast
        // socket.to().emit : 나를 제외한 특정 방에 있는 사람에게 broadcast
        // io.to().emit : 특정 방에 있는 모두에게 broadcast
        io.emit("public_rooms", publicRoom());
    });

    socket.on("leave_room", (data)=>{
        console.log(`${socket.nickname}님이 ${data.leaveRoom}방에서 나가셨습니다.`)
        socket.leave(data.leaveRoom);
        io.to(data.leaveRoom).emit("bye", `안녕히 가세요. ${socket.nickname}님이 나가셨습니다.`);
        io.emit("public_rooms", publicRoom());
    });

    socket.on("client_send_message", (data)=>{
        console.log(`${socket.nickname}님이 ${data.room}방에 ${data.message}라는 메시지를 보냈습니다.`)
        io.to(data.room).emit("server_send_message", `${socket.nickname} : ${data.message}`);
    });

    socket.on("change_nickname", (data)=>{
        console.log(`${socket.nickname}님이 ${data.nickname}으로 닉네임을 변경하셨습니다.`)
        socket.nickname = data.nickname;
        console.log(`${socket.nickname}님이 ${socket.nickname}으로 닉네임을 변경이 완료되었습니다.`)
    });

    socket.on("offer", (data)=>{
        console.log(data);
        // 나를 제외한 사람에게 getOffer 보내기
        socket.to(data.room).emit("getOffer", data.offer, data.room);
    })

    socket.on("answer", (data)=>{
        console.log("answer");
        console.log(data);
        socket.to(data.room).emit("getAnswer", data.answer, data.room);
    })
});

module.exports = {
    server,
}