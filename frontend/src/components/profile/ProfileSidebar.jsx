import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaEdit,
  FaSignOutAlt,
  FaEye,
  FaCheckCircle,
  FaUserPlus,
  FaUserCheck,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import UserListModal from "../UserListModal";
import StatCard from "./StatCard";
import { toggleFollowAsync } from "../../features/auth/authSlice"; 

const ProfileSidebar = ({
  onEdit,
  onAvatarEdit,
  onLogout,
  selectedAvatar,
  isOtherUser = false,
}) => {
  const dispatch = useDispatch();
  const [modalType, setModalType] = useState(null);


  const {
    user: currentUser,
    selectedUser,
    loading,
  } = useSelector((state) => state.auth);


  const activeUser = isOtherUser ? selectedUser : currentUser;

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  // Follow/Unfollow Handler
  const handleFollow = () => {
    if (activeUser?._id) {
      dispatch(toggleFollowAsync(activeUser._id));
    }
  };

  // Modal logic
  const rawList =
    modalType === "followers" ? activeUser?.followers : activeUser?.following;
  const userList =
    Array.isArray(rawList) && typeof rawList[0] === "object" ? rawList : [];

  if (!activeUser && loading)
    return <div className="animate-pulse bg-gray-800 h-96 rounded-[3.5rem]" />;

  return (
    <aside className="lg:col-span-4 space-y-6">
      <div className="bg-background-soft border border-primary rounded-[3.5rem] p-8 shadow-2xl text-center backdrop-blur-xl relative overflow-hidden group">
        {/* Avatar Area */}
        <div className="relative inline-block">
          <img
            src={
              (isOtherUser
                ? activeUser?.profilePic || activeUser?.avatar
                : selectedAvatar ||
                  activeUser?.profilePic ||
                  activeUser?.avatar) ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser?._id || "seed"}`
            }
            alt="Profile"
            className="relative w-44 h-44 rounded-[3rem] object-cover border-4 border-background-soft shadow-2xl"
          />
          {!isOtherUser && (
            <button
              onClick={onAvatarEdit}
              className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-2xl border-4 border-background-soft"
            >
              <FaEdit size={14} />
            </button>
          )}
        </div>

        {/* Name & Rank */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-3xl font-black text-primary truncate">
              {activeUser?.name || "Developer"}
            </h2>
            <MdVerified className="text-primary text-xl" />
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-secondary text-sm">
              Rank
            </span>
            <span className="text-primary font-black text-xl">
              {activeUser?.rank?.toLocaleString() || "0"}
            </span>
          </div>
        </div>

        {/* Stat Card Section */}
        <div className="mt-6 flex justify-center border-y border-primary/40 py-4">
          <StatCard
            isOtherUser={isOtherUser}
            onFollowingClick={() => openModal("following")}
            onFollowersClick={() => openModal("followers")}
          />
        </div>

        {/* Community Stats */}
        <div className="mt-8 text-left space-y-5 px-2">
          <h3 className="text-primary text-xs font-black uppercase opacity-60">
            Community Stats
          </h3>
          <div className="space-y-4">
            <StatRow
              icon={<FaEye />}
              label="Views"
              value={activeUser?.stats?.views || 0}
              color="blue"
            />
            <StatRow
              icon={<FaCheckCircle />}
              label="Solutions"
              value={activeUser?.stats?.solutions || 0}
              color="emerald"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 space-y-3">
          {isOtherUser ? (
            <FollowButton
              isFollowing={activeUser?.isFollowing}
              onClick={handleFollow}
            />
          ) : (
            <MyProfileActions onEdit={onEdit} onLogout={onLogout} />
          )}
        </div>
      </div>

      <UserListModal
        isOpen={!!modalType}
        onClose={closeModal}
        title={modalType === "followers" ? "Followers" : "Following"}
        users={userList}
      />
    </aside>
  );
};

// Sub-components remains the same...
const StatRow = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-4">
    <div className={`p-2 bg-${color}-500/10 text-${color}-500 rounded-xl`}>
      {icon}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-secondary text-sm font-bold">
        {label}
      </span>
      <span className="text-primary font-black">
        {value}
      </span>
    </div>
  </div>
);

const FollowButton = ({ isFollowing, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${isFollowing ? "bg-background-elevated text-primary border border-primary" : "bg-primary text-white shadow-lg"}`}
  >
    {isFollowing ? (
      <>
        <FaUserCheck /> Following
      </>
    ) : (
      <>
        <FaUserPlus /> Follow
      </>
    )}
  </button>
);

const MyProfileActions = ({ onEdit, onLogout }) => (
  <>
    <button
      onClick={onEdit}
      className="w-full py-4 rounded-2xl font-black text-xs uppercase bg-primary text-white hover:opacity-90 transition-all"
    >
      Edit Profile
    </button>
    <button
      onClick={onLogout}
      className="w-full py-4 rounded-2xl font-black text-xs uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all"
    >
      <FaSignOutAlt /> Logout
    </button>
  </>
);

export default React.memo(ProfileSidebar);
