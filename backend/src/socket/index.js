import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { setUserOffline, setUserOnline, getUsersOnlineState } from "../services/presenceService.js";

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

  // In-memory presence counts (room -> count). Good enough for single-node.
  const presence = new Map();

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const cookies = parseCookies(cookieHeader);
      const token = cookies.accessToken;
      if (!token) return next(new Error("UNAUTHORIZED"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      const user = await User.findById(decoded.id)
        .select("_id role isBlocked isDeleted")
        .lean();

      if (!user) return next(new Error("UNAUTHORIZED"));
      if (user.isDeleted) return next(new Error("ACCOUNT_DELETED"));
      if (user.isBlocked) return next(new Error("ACCOUNT_BLOCKED"));

      socket.user = { id: String(user._id), role: user.role };
      return next();
    } catch (e) {
      return next(new Error("UNAUTHORIZED"));
    }
  });

  const updatePresence = (room) => {
    const count = presence.get(room) || 0;
    io.to(room).emit("problem:presence-update", { room, count });
  };

  io.on("connection", (socket) => {
    const userId = socket.user?.id;

    if (userId) {
      socket.join(`user:${userId}`);
      setUserOnline(userId, socket.id)
        .then(({ becameOnline }) => {
          if (becameOnline) io.emit("user:online", { userId });
        })
        .catch(() => {});
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
      if (userId) {
        setUserOffline(userId, socket.id, new Date())
          .then(async ({ becameOffline, lastSeenAt }) => {
            if (!becameOffline) return;
            await User.updateOne(
              { _id: userId },
              { $set: { lastSeenAt: lastSeenAt || new Date() } },
            );
            io.emit("user:offline", {
              userId,
              lastSeenAt: (lastSeenAt || new Date()).toISOString(),
            });
          })
          .catch(() => {});
      }

      // Best-effort cleanup: decrement counts for rooms the socket was in.
      // socket.rooms includes socket.id; ignore.
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

