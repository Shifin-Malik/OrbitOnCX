import { io } from "socket.io-client";

const SOCKET_URL ="http://localhost:5000";

export const createDiscussionSocket = () => {
  return io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
  });
};

export const createAppSocket = () => {
  return io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
  });
};
