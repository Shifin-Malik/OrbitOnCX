import React from "react";
import { useSelector } from "react-redux";

const StatCard = ({
  isOtherUser = false,
  onFollowingClick,
  onFollowersClick,
}) => {
  const { user, selectedUser } = useSelector((state) => state.auth);

  const targetUser = isOtherUser ? selectedUser : user;

  const followingCount = isOtherUser
    ? (targetUser?.stats?.followingCount ?? targetUser?.following?.length ?? 0)
    : (targetUser?.following?.length ?? targetUser?.stats?.followingCount ?? 0);

  const followersCount = isOtherUser
    ? (targetUser?.stats?.followerCount ?? targetUser?.followers?.length ?? 0)
    : (targetUser?.followers?.length ?? targetUser?.stats?.followerCount ?? 0);

  return (
    <div className="flex items-center gap-8">
      {/* Following Section */}
      <button
        onClick={onFollowingClick}
        className="group flex flex-col items-center transition-all active:scale-95 focus:outline-none"
        aria-label={`View ${followingCount} following`}
      >
        <span className="text-primary font-black text-2xl group-hover:text-primary transition-colors duration-300">
          {followingCount}
        </span>
        <span className="text-secondary text-[10px] font-black uppercase tracking-[0.15em] opacity-50 group-hover:opacity-100 transition-opacity">
          Following
        </span>
      </button>

      {/* Divider - Vertical Line */}
      <div className="h-10 w-px bg-linear-to-b from-transparent via-(--border-color-primary) to-transparent opacity-30" />

      {/* Followers Section */}
      <button
        onClick={onFollowersClick}
        className="group flex flex-col items-center transition-all active:scale-95 focus:outline-none"
        aria-label={`View ${followersCount} followers`}
      >
        <span className="text-primary font-black text-2xl group-hover:text-primary transition-colors duration-300">
          {followersCount}
        </span>
        <span className="text-secondary text-[10px] font-black uppercase tracking-[0.15em] opacity-50 group-hover:opacity-100 transition-opacity">
          Followers
        </span>
      </button>
    </div>
  );
};

export default React.memo(StatCard);
