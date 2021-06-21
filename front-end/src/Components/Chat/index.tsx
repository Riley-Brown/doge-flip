import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTypedSelector } from 'Reducers';

import './Chat.scss';

export default function Chat() {
  const [chat, setChat] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const [open, setOpen] = useState(false);

  const socket = useRef<WebSocket>();

  const account = useTypedSelector((state) => state.account);

  useEffect(() => {
    const chatContainer = document.querySelector('.chat-container');

    if (!chatContainer) return;
    if (chat.length < 1) return;

    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: 'smooth'
    });
  }, [chat]);

  useEffect(() => {
    socket.current = new WebSocket('ws://localhost:9999');

    socket.current.onmessage = (message) => {
      console.log(message);
      const parsedData = JSON.parse(message.data);
      setChat((prev) => [...prev, parsedData]);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    socket.current?.send(
      JSON.stringify({
        displayName: account.displayName,
        message: input,
        timestamp: Date.now() / 1000
      })
    );

    setInput('');
  };

  return (
    <div id="chat" data-open={open}>
      <div className="container">
        <div className="header">
          <h1>Chat</h1>
          <button className="btn close-button" onClick={() => setOpen(false)}>
            &times;
          </button>
        </div>
        <div className="chat-form-wrapper">
          <div className="chat-container">
            {chat.map((data: any) => (
              <div className="chat-message">
                <p>
                  <strong className="display-name">{data.displayName}:</strong>
                  {data.message}
                </p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder="send message"
            />
            <button className="btn primary submit" type="submit">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
