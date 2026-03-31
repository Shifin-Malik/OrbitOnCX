import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserProfileByIdAsync } from "../features/auth/authSlice"; // Ninte slice path
import ProfileSidebar from "../components/profile/ProfileSidebar"; // Sidebar component path

function UserProfilePage() {
  const { id } = useParams(); // URL-il ninnu ID edukkunnu (eg: /profile/123)
  const dispatch = useDispatch();

  // Redux-il ninnu data edukkunnu
  const {
    selectedUser,
    user: currentUser,
    loading,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(getUserProfileByIdAsync(id));
    }
  }, [id, dispatch]);

  // Logic: Swantham profile aanel 'user', vere aaludenkil 'selectedUser'
  const isOwnProfile = id === currentUser?._id;
  const profileData = isOwnProfile ? currentUser : selectedUser;

  // Dynamic Page Name (Title)
  const pageName = isOwnProfile
    ? "My Profile"
    : `${profileData?.name || "User"}'s Profile`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        <p className="ml-4 font-bold text-[var(--text-color-primary)]">
          Syncing OrbitonCX...
        </p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-rose-500">User Not Found!</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Page Header Section */}
      <div className="mb-10 ml-2">
        <h1 className="text-4xl font-black tracking-tight text-[var(--text-color-primary)]">
          {pageName}
        </h1>
        <p className="text-[var(--text-color-secondary)] font-medium mt-1">
          {isOwnProfile
            ? "Your personal developer dashboard and stats."
            : `Viewing professional profile of ${profileData?.name}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Sidebar (Nee ezhuthiya component) */}
        <ProfileSidebar
          user={profileData}
          // Swantham profile aayirunnal mathram Edit button work aaku
          onEdit={() => isOwnProfile && console.log("Edit Profile")}
        />

        {/* Right Side Content (Nammukk ini ezhuthaam - eg: Solved Problems, Activity) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[var(--color-background-soft)] p-8 rounded-[2.5rem] border border-[var(--border-color-primary)]">
            <h3 className="text-xl font-black mb-4">
              About {profileData?.name}
            </h3>
            <p className="text-[var(--text-color-secondary)]">
              {profileData?.bio || "No bio added yet."}
            </p>
          </div>

          {/* Oru example section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
              <p className="text-xs font-black uppercase opacity-60">
                Easy Solved
              </p>
              <p className="text-2xl font-black text-emerald-500">
                {profileData?.stats?.easySolved || 0}
              </p>
            </div>
            {/* Medium and Hard sections... */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
