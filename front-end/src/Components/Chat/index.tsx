import { WS_ROOT } from 'API';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTypedSelector } from 'Reducers';

import { ReactComponent as ChevronUp } from 'Assets/chevron-up.svg';
import { ReactComponent as ChevronDown } from 'Assets/chevron-down.svg';

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
    if (!account.userId) return;

    socket.current = new WebSocket(`${WS_ROOT}/chat`);

    socket.current.onopen = () => {
      socket.current?.send(
        JSON.stringify({
          event: 'chatInitialized',
          data: {
            displayName: account.displayName,
            userId: account.userId
          }
        })
      );
    };

    socket.current.onmessage = (message) => {
      const parsedData = JSON.parse(message.data);
      if (parsedData.event === 'chatMessage') {
        setChat((prev) => [...prev, parsedData.data]);
      }
    };

    // Ping ws every 2 minutes to keep alive
    setInterval(() => {
      socket.current?.send(JSON.stringify({ event: 'ping' }));
    }, 90000);
  }, [account.userId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    socket.current?.send(
      JSON.stringify({
        event: 'chatMessage',
        data: {
          displayName: account.displayName,
          message: input,
          timestamp: Date.now() / 1000
        }
      })
    );

    setInput('');
  };

  return (
    <>
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
                    <strong className="display-name">
                      {data.displayName}:
                    </strong>
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
      <button id="mobile-chat-toggle" onClick={() => setOpen(!open)}>
        Chat
        {open ? <ChevronDown /> : <ChevronUp />}
      </button>
    </>
  );
}
