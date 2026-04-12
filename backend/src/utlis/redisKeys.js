export const redisKeys = {
  refreshToken: (userId, deviceId = "default") =>
    `auth:refresh_token:${userId}:${deviceId}`,

  blacklistedRefresh: (token) => `auth:blacklist_refresh:${token}`,

  verifyOtp: (email) => `auth:verify_otp:${email.toLowerCase()}`,

  resetOtp: (email) => `auth:reset_otp:${email.toLowerCase()}`,

  loginAttempts: (email) => `auth:login_attempts:${email.toLowerCase()}`,

  loginBlock: (email) => `auth:login_block:${email.toLowerCase()}`,

  // --- Presence (Socket.IO) ---
  presenceSockets: (userId) => `presence:sockets:${userId}`,
  presenceOnlineUsers: () => "presence:online_users",
  presenceLastSeen: () => "presence:last_seen_at",
};
