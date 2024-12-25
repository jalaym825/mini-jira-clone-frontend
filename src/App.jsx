import { Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import Component from './Component';
import Tasks from './Tasks';

const EditableCard = () => {
  let socket= io("http://localhost:3000", {
    query: {
      roomId: window.location.pathname.slice(1)
    }
  });;

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Tasks socket={socket} />} />
      <Route path="/:id" element={<Component socket={socket} />} />
    </Routes>
  );
};

export default EditableCard;
