import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import {
  setUserOffline,
  setUserOnline,
  getUsersOnlineState,
} from "../services/presenceService.js";

const parseCookies = (cookieHeader = "") => {
  const out = {};
  cookieHeader.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) return;
    out[key] = decodeURIComponent(val);
  });
  return out;
};

export const initSocket = (httpServer, { corsOrigin }) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  const presence = new Map();

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const cookies = parseCookies(cookieHeader);
      const token = cookies.accessToken;
      if (!token) return next(new Error("UNAUTHORIZED"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      const user = await User.findById(decoded.id)
        .select("_id name role isBlocked isDeleted")
        .lean();

      if (!user) return next(new Error("UNAUTHORIZED"));
      if (user.isDeleted) return next(new Error("ACCOUNT_DELETED"));
      if (user.isBlocked) return next(new Error("ACCOUNT_BLOCKED"));

      socket.user = {
        id: String(user._id),
        name: user.name,
        role: user.role,
      };

      console.log(`Socket authenticated: ${user.name} (${user._id})`);

      return next();
    } catch (e) {
      console.log("Socket auth failed");
      return next(new Error("UNAUTHORIZED"));
    }
  });

  const updatePresence = (room) => {
    const count = presence.get(room) || 0;
    io.to(room).emit("problem:presence-update", { room, count });
  };

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    const userName = socket.user?.name;

    console.log(`Socket connected: ${userName} (${userId}) | socketId: ${socket.id}`);

    if (userId) {
      socket.join(`user:${userId}`);
      setUserOnline(userId, socket.id)
        .then(async ({ becameOnline }) => {
          if (!becameOnline) {
            console.log(`${userName} still online with another socket`);
            return;
          }

          await User.updateOne(
            { _id: userId },
            { $set: { isOnline: true } },
          );

          console.log(`${userName} is now ONLINE`);

          io.emit("user:online", { userId });
        })
        .catch((err) => {
          console.log("setUserOnline error:", err.message);
        });
    }

    socket.on("discussion:join", ({ problemId }) => {
      if (!problemId) return;
      const room = `discussion:${problemId}`;
      socket.join(room);
      presence.set(room, (presence.get(room) || 0) + 1);
      updatePresence(room);
    });

    socket.on("discussion:leave", ({ problemId }) => {
      if (!problemId) return;
      const room = `discussion:${problemId}`;
      socket.leave(room);
      presence.set(room, Math.max(0, (presence.get(room) || 0) - 1));
      updatePresence(room);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${userName} (${userId}) | socketId: ${socket.id}`);

      if (userId) {
        setUserOffline(userId, socket.id, new Date())
          .then(async ({ becameOffline, lastSeenAt }) => {
            if (!becameOffline) {
              console.log(`${userName} has other active sockets, still ONLINE`);
              return;
            }

            await User.updateOne(
              { _id: userId },
              {
                $set: {
                  isOnline: false,
                  lastSeenAt: lastSeenAt || new Date(),
                },
              },
            );

            console.log(
              `${userName} is now OFFLINE. Last seen: ${
                (lastSeenAt || new Date()).toISOString()
              }`,
            );

            io.emit("user:offline", {
              userId,
              lastSeenAt: (lastSeenAt || new Date()).toISOString(),
            });
          })
          .catch((err) => {
            console.log("setUserOffline error:", err.message);
          });
      }

      for (const room of socket.rooms) {
        if (!room.startsWith("discussion:")) continue;
        presence.set(room, Math.max(0, (presence.get(room) || 0) - 1));
        updatePresence(room);
      }
    });

    socket.on("presence:bulk-sync", async ({ userIds } = {}) => {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        socket.emit("presence:bulk-sync", { states: {} });
        return;
      }

      const states = await getUsersOnlineState(userIds);
      socket.emit("presence:bulk-sync", { states });
    });
  });

  return io;
};