import redisClient from "../config/redis.js";
import { redisKeys } from "../utlis/redisKeys.js";

const SOCKET_SET_TTL_SECONDS = 60 * 60 * 24; // 24h safety TTL

export const setUserOnline = async (userId, socketId) => {
  const socketsKey = redisKeys.presenceSockets(userId);
  const onlineUsersKey = redisKeys.presenceOnlineUsers();

  const wasOnline = await redisClient.sIsMember(onlineUsersKey, String(userId));
  await redisClient.sAdd(socketsKey, String(socketId));
  await redisClient.expire(socketsKey, SOCKET_SET_TTL_SECONDS);
  await redisClient.sAdd(onlineUsersKey, String(userId));

  const onlineUsersCount = await redisClient.sCard(onlineUsersKey);

  return {
    becameOnline: !wasOnline,
    onlineUsersCount,
  };
};

export const setUserOffline = async (userId, socketId, lastSeenAt = new Date()) => {
  const socketsKey = redisKeys.presenceSockets(userId);
  const onlineUsersKey = redisKeys.presenceOnlineUsers();
  const lastSeenKey = redisKeys.presenceLastSeen();

  await redisClient.sRem(socketsKey, String(socketId));
  const remaining = await redisClient.sCard(socketsKey);

  if (remaining > 0) {
    const onlineUsersCount = await redisClient.sCard(onlineUsersKey);
    return { becameOffline: false, onlineUsersCount, lastSeenAt: null };
  }

  const wasOnline = await redisClient.sIsMember(onlineUsersKey, String(userId));
  await redisClient.sRem(onlineUsersKey, String(userId));
  await redisClient.hSet(lastSeenKey, String(userId), String(lastSeenAt.getTime()));

  const onlineUsersCount = await redisClient.sCard(onlineUsersKey);

  return {
    becameOffline: wasOnline,
    onlineUsersCount,
    lastSeenAt,
  };
};

export const isUserOnline = async (userId) => {
  return redisClient.sIsMember(redisKeys.presenceOnlineUsers(), String(userId));
};

export const getUsersOnlineState = async (userIds) => {
  const onlineUsersKey = redisKeys.presenceOnlineUsers();
  const lastSeenKey = redisKeys.presenceLastSeen();
  const ids = Array.isArray(userIds) ? userIds.map((id) => String(id)) : [];

  if (ids.length === 0) return {};

  const multi = redisClient.multi();
  for (const id of ids) multi.sIsMember(onlineUsersKey, id);
  for (const id of ids) multi.hGet(lastSeenKey, id);
  const results = await multi.exec();

  const onlineResults = results.slice(0, ids.length);
  const lastSeenResults = results.slice(ids.length);

  const out = {};
  for (let i = 0; i < ids.length; i += 1) {
    const isOnlineNow = Boolean(onlineResults[i]);
    const lastSeenMsRaw = lastSeenResults[i];
    const lastSeenAt =
      lastSeenMsRaw && !Number.isNaN(Number(lastSeenMsRaw))
        ? new Date(Number(lastSeenMsRaw))
        : null;

    out[ids[i]] = { isOnline: isOnlineNow, lastSeenAt };
  }

  return out;
};

export const getOnlineUserIds = async () => {
  return redisClient.sMembers(redisKeys.presenceOnlineUsers());
};
