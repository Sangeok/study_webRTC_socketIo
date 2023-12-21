import {useEffect, useRef, useState} from 'react';

import { io } from "socket.io-client";

function App() {
  const [room, setRoom] = useState("");
  const [nickname, setNickname] = useState("Anonymous");
  const [sendMessage, setSendMessage] = useState('');
  const [enterRoom, setEnterRoom] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);

  const socketRef = useRef();

  const handleRoomName = (e) => {
    setRoom(e.target.value);
  }

  const handleEnterRoom = (e) => {
    e.preventDefault();
    setAllMessages([]);
    socketRef.current.emit("enter_room", {enterRoom: room});
    console.log(`${socketRef.current.id}님이 ${room}방에 입장하셨습니다.`);
    setEnterRoom(true);
  }

  const handleLeaveRoom = (e) => {
    e.preventDefault();
    socketRef.current.emit("leave_room", {leaveRoom: room});
    console.log(`${socketRef.current.id}님이 ${room}방에서 나가셨습니다.`)
    setEnterRoom(false);
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    socketRef.current.emit("client_send_message", {room: room, message: sendMessage});
    setSendMessage("");
  }

  const handleNickname= (e) => {
    e.preventDefault();
    socketRef.current.emit("change_nickname", {nickname: nickname});
  }

  const onChangeNickname = (e) =>{
    e.preventDefault();
    setNickname(e.target.value);
  }

  const onChangeMessage = (e) =>{
    e.preventDefault();
    setSendMessage(e.target.value);
  }

  useEffect(() => {
    // Create the socket connection only once when the component mounts
    socketRef.current = io("http://localhost:3001");

    // Set up event listeners or any other socket-related logic here

    return () => {
      // Clean up the socket connection when the component is unmounted
      socketRef.current.disconnect();
    };
  }, []); // Empty dependency array ensures this effect runs only once

  useEffect(()=>{
    // if(effectForRef.current === false){
      const fetchWelcome = () => {
        socketRef.current.on("welcome", (data)=>{
          console.log(data);
          setAllMessages((pre)=>[...pre, data]);
        });
      }

      const fetchBye = () => {
        socketRef.current.on("bye", (data)=>{    
          setAllMessages((pre)=>[...pre, data]);
        });
      }
      
      const fetchMessage = () => {
        socketRef.current.on("server_send_message", (data)=>{
          setAllMessages((pre)=>[...pre, data]);
        });
      }

      const fetchPublicRooms = () => {
        socketRef.current.on("public_rooms", (data)=>{
          console.log(data);
          setPublicRooms(data);
        });
      }

      fetchWelcome();
      fetchBye();
      fetchMessage();
      fetchPublicRooms(); 
    // }

    // return () => { effectForRef.current = true };
  },[socketRef]);

  return (
    <div className="App">
      {
        enterRoom ? (
        <div> 
          <h1>{room}</h1>
          <ul>
            {
              allMessages.map((item, index) => {
                return <li key={index}>{item}</li>
              })
            }
          </ul>
          <form>
            <input 
              value={sendMessage} 
              onChange={onChangeMessage} 
              type="text" 
              placeholder="message" 
            />
            <button onClick={handleSendMessage}>메세지 전송</button>

            <button onClick={handleLeaveRoom}>방 나가기</button>
          </form>
          <form>
            <input 
              value={nickname} 
              onChange={onChangeNickname} 
              type="text" 
              placeholder="nickname" 
            />
            <button onClick={handleNickname}>닉네임 설정</button>
          </form>
        </div>
        ) : (
          <div>
            <form>
              <input 
                value={room} 
                onChange={handleRoomName} 
                type="text" 
                placeholder='room name' 
                required
              />
              <button onClick={handleEnterRoom}>방 입장</button>
            </form>
          </div>
        )
      }

      <div>
        <h1>public room</h1>
        {
          publicRooms.map((item, index) => {
            return <li key={index}>{item.roomName}  {item.roomCount}</li>
          })
        }
      </div>
    </div>
  );
}

export default App;
