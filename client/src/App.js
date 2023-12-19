import {useEffect, useRef, useState} from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const webSocket = useRef(null);

  useEffect(()=>{
    webSocket.current = new WebSocket(`ws://localhost:3001/`);

    webSocket.current.onopen = ()=>{
      console.log('WebSocket 연결!');
    }
    webSocket.current.onmessage = (message) => {   
      console.log('event.data', message.data);
      setMessages((prev) => [...prev, message.data]);
    };

    setTimeout(() => {
      if (webSocket.current.readyState === WebSocket.OPEN) {
        webSocket.current.send("This is a test message from client.");
        console.log('서버로 메시지 전송');
      }
    }, 10000); // Set the timeout to 10 seconds (10000 milliseconds)

    fetch('http://localhost:3001/')
    .then((res)=>res.json())
    .then((res)=>{
      console.log(res);
    });
  },[])

  return (
    <div className="App">
    </div>
  );
}

export default App;
