import {useEffect, useRef, useState} from 'react';

import { io } from "socket.io-client";

function App() {
  const [room, setRoom] = useState("");
  const [nickname, setNickname] = useState("Anonymous");
  const [sendMessage, setSendMessage] = useState('');
  const [enterRoom, setEnterRoom] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [mute, setMute] = useState(false);
  const [showVideo, setShowVideo] = useState(false);  

  const socketRef = useRef();
  const videoRef = useRef(null)
  const videoOffRef = useRef(false);
  const streamRef = useRef(null);

  const myPeer = new RTCPeerConnection();


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

  const handleMute = (e) => {
    e.preventDefault();
    videoRef.current.srcObject.getAudioTracks().forEach((tracks)=>tracks.enabled = !tracks.enabled);
    setMute((pre)=>!pre);
  }

  const handleVideo = (e) => {
    e.preventDefault();
    videoRef.current.srcObject.getVideoTracks().forEach((tracks)=>tracks.enabled = !tracks.enabled);
    setShowVideo((pre)=>!pre);
  }

  useEffect(() => {
    socketRef.current = io("http://localhost:3001");

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(()=>{
    // if(effectForRef.current === false){
      const fetchWelcome = () => {
        socketRef.current.on("welcome", async (data, roomName)=>{
          setAllMessages((pre)=>[...pre, data]);

          // 문제 1. 여기서 emit으로 offer를 보낼 때 room값이 없는 현상이 발생.
          // createOffer(다른 브라우저가 참가할 수 있도록 함.)
          const offer = await myPeer.createOffer();
          myPeer.setLocalDescription(offer);
          socketRef.current.emit("offer", {offer: offer, room: roomName});
          console.log("send offer");
          console.log(offer);
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

      const fetchOffer = () => {
        socketRef.current.on("getOffer", async (offer, roomName)=>{
          console.log("receive offer");
          console.log(offer);

          await myPeer.setRemoteDescription(offer);
          // if (myPeer.signalingState === 'have-local-offer') {
          //   try {
          //     await myPeer.setRemoteDescription(data);
          //   } catch (error) {
          //     console.error('SDP 파싱 오류', error);
          //   }
          // } else {
          //   console.log('have-local-offer 상태가 아님');
          // }


          // createAnswer
          const answer = await myPeer.createAnswer();
          myPeer.setLocalDescription(answer);
          console.log("answer");
          console.log(answer);
          socketRef.current.emit("answer", {answer: answer, room: roomName});
        });
      }

      const fetchAnswer = () => {
        socketRef.current.on("getAnswer", async (answer)=>{
          console.log("getAnswer");
          console.log(answer);
          await myPeer.setRemoteDescription(answer);
        });
      }

      fetchWelcome();
      fetchBye();
      fetchMessage();
      fetchPublicRooms(); 
      fetchOffer();
      fetchAnswer();
    // }

    // return () => { effectForRef.current = true };
  },[socketRef]);

  // video 부분이 있어야만 정확히 동작함.. 왜지..
  useEffect(() => {
    const getUserMedia = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      } catch (err) {
        console.log(err);
      }
    };
    const makeConnection = () => {
      try {
        streamRef.current.getTracks().forEach((track) => {
          myPeer.addTrack(track, streamRef.current);
        })
        // myPeer
      } catch (err) {
        console.log(err);
      } 
    }
    getUserMedia();
    makeConnection();
  }, [enterRoom]);

  console.log(videoRef.current);

  return (
    <div className="App">
      {
        enterRoom ? (
        <div>
          {
            console.log(videoRef.current)
          }
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
          {/* plasyInline : 비디오가 전체 화면이 되지 않도록 함. */}
          <video
            ref={videoRef}
            autoPlay 
            playsInline 
            width="400" 
            height="400"
          />
          <button onClick={handleMute}>{mute ? "Speak" : "Mute"}</button>
          <button onClick={handleVideo}>{videoOffRef.current ? "Start Video" : "Stop Video"}</button>
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
