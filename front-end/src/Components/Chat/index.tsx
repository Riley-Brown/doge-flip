import { API_ROOT } from 'API';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTypedSelector } from 'Reducers';
import { io, Socket } from 'socket.io-client';

import { ReactComponent as ChevronUp } from 'Assets/chevron-up.svg';
import { ReactComponent as ChevronDown } from 'Assets/chevron-down.svg';

import './Chat.scss';

export default function Chat() {
  const [chat, setChat] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const [open, setOpen] = useState(false);

  const socket = useRef<Socket>();

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

    socket.current = io(`${API_ROOT}`, { path: '/chat' });

    socket.current?.on('chatMessage', (message) => {
      setChat((prev) => [...prev, message]);
    });
  }, [account.userId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    socket.current?.emit('chatMessage', {
      displayName: account.displayName,
      message: input,
      timestamp: Date.now() / 1000
    });

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
