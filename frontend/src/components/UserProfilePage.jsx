import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserProfileByIdAsync,
  toggleFollowAsync,
  resetSelectedUser,
} from "../features/auth/authSlice";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import ProfileStats from "../components/profile/ProfileStats";
import ActivityHeatmap from "../components/ActivityHeatmap";

function UserProfilePage() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const {
    selectedUser,
    loading,
    user: currentUser,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(getUserProfileByIdAsync(id));
    }


    return () => {
      dispatch(resetSelectedUser());
    };
  }, [id, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-black uppercase text-xs tracking-widest opacity-50">
          Syncing OrbitonCX...
        </p>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter">
          User Not Found
        </h2>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === selectedUser?._id;

  return (
    <div className="min-h-screen bg-background text-primary pt-28 pb-16 px-4 md:px-12 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
        <ProfileSidebar
          user={selectedUser}
          isOtherUser={!isOwnProfile}
          onFollow={() => dispatch(toggleFollowAsync(selectedUser._id))}
          onEdit={() => console.log("Edit Profile Clicked")}
          onLogout={() => console.log("Logout Clicked")}
        />

        <main className="lg:col-span-8 space-y-4">
          <ProfileStats user={selectedUser} />
          <ActivityHeatmap userId={selectedUser._id} />
        </main>
      </div>
    </div>
  );
}

export default UserProfilePage;
