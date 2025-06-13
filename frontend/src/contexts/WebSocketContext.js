import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5001');

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'NEW_EVENT':
        toast.info('New event has been created!');
        break;
      case 'RSVP_UPDATE':
        toast.info('RSVP status has been updated!');
        break;
      case 'NEW_ANNOUNCEMENT':
        toast.info(`New announcement: ${data.title}`);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (message) => {
    if (ws && connected) {
      ws.send(JSON.stringify(message));
    }
  };

  const value = {
    connected,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 