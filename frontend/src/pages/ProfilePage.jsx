import React, { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FaGithub, FaLinkedin, FaLock, FaUpload } from "react-icons/fa";

import ActivityHeatmap from "../components/ActivityHeatmap";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import ProfileStats from "../components/profile/ProfileStats";
import { useProfileForm } from "../hook/useProfileForm";
import {
  updateProfile,
  logout,
  resetAuthState,
} from "../features/auth/authSlice";
import {
  fetchActivity,
  fetchStreak,
  fetchProblemStats,
} from "../features/activity/activitySlice.js";

const AVATAR_STYLES = [
  "avataaars",
  "bottts",
  "pixel-art",
  "adventurer",
  "big-smile",
  "fun-emoji",
  "lorelei",
  "micah",
];

function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const { activities, streak } = useSelector((state) => state.activity);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [modals, setModals] = useState({ avatar: false, edit: false });
  const [formStep, setFormStep] = useState("profile");

  const {
    formData,
    setFormData,
    selectedAvatar,
    setSelectedAvatar,
    handleUpdate,
  } = useProfileForm(user, dispatch, updateProfile);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  React.useEffect(() => {
    dispatch(fetchActivity());
    dispatch(fetchStreak());
    dispatch(fetchProblemStats());
  }, [dispatch]);

  const toggleModal = useCallback((type, val) => {
    setModals((p) => ({ ...p, [type]: val }));
    if (type === "edit") setFormStep("profile");
  }, []);

  const handleLogout = useCallback(() => {
    toast.success("Logging out...");
    setTimeout(() => {
      dispatch(logout());
      dispatch(resetAuthState());
      navigate("/");
    }, 600);
  }, [dispatch, navigate]);

  const onUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    const success = await handleUpdate(fileInputRef.current);
    if (success) setModals({ avatar: false, edit: false });
  };

  const onUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      return toast.error("Please fill all fields");
    }

    const data = new FormData();
    data.append("oldPassword", passwordData.oldPassword);
    data.append("newPassword", passwordData.newPassword);

    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success("Password updated successfully!");
      setPasswordData({ oldPassword: "", newPassword: "" });
      setModals({ ...modals, edit: false });
    } catch (err) {
      toast.error(err || "Failed to update password");
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary pt-28 pb-16 px-4 md:px-12 font-sans">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ProfileSidebar
          user={user}
          selectedAvatar={selectedAvatar}
          onAvatarEdit={() => toggleModal("avatar", true)}
          onEdit={() => toggleModal("edit", true)}
          onLogout={handleLogout}
        />

        <main className="lg:col-span-8 space-y-2">
          <ProfileStats user={user} />
          <ActivityHeatmap userActivities={activities} />
        </main>
      </div>

      {modals.edit && (
        <Modal
          title="Account Settings"
          onClose={() => toggleModal("edit", false)}
          className="max-w-100"
        >
          {/* Tabs */}
          <div className="flex bg-background-elevated p-1 rounded-2xl mb-6">
            <button
              onClick={() => setFormStep("profile")}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                formStep === "profile"
                  ? "bg-primary text-white shadow-lg"
                  : "text-zinc-500 opacity-60"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setFormStep("security")}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                formStep === "security"
                  ? "bg-primary text-white shadow-lg"
                  : "text-zinc-500 opacity-60"
              }`}
            >
              Security
            </button>
          </div>

          {formStep === "profile" ? (
            <form
              onSubmit={onUpdateProfile}
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              <InputField
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                compact
              />
              <InputField
                label="Bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                compact
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="GitHub"
                  value={formData.github}
                  icon={<FaGithub />}
                  onChange={(e) =>
                    setFormData({ ...formData, github: e.target.value })
                  }
                  compact
                />
                <InputField
                  label="LinkedIn"
                  value={formData.linkedin}
                  icon={<FaLinkedin />}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                  compact
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all mt-2"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <form
              onSubmit={onUpdatePassword}
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              <InputField
                label="Current Password"
                type="password"
                icon={<FaLock />}
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    oldPassword: e.target.value,
                  })
                }
                compact
              />
              <InputField
                label="New Password"
                type="password"
                icon={<FaLock />}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                compact
              />
              <button
                type="submit"
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all mt-2"
              >
                Update Password
              </button>
            </form>
          )}
        </Modal>
      )}

      {modals.avatar && (
        <Modal
          title="Choose Identity"
          onClose={() => toggleModal("avatar", false)}
        >
          <div className="grid grid-cols-4 gap-3 mb-6">
            {AVATAR_STYLES.map((style) => {
              const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${user?.name || "seed"}`;
              const isSelected = selectedAvatar === url;
              return (
                <button
                  key={style}
                  onClick={() => setSelectedAvatar(url)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-transparent bg-background-elevated"
                  }`}
                >
                  <img src={url} alt={style} className="w-full h-full p-2" />
                </button>
              );
            })}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setSelectedAvatar(reader.result);
                reader.readAsDataURL(file);
              }
            }}
          />
          <div className="space-y-3">
            <button
              onClick={onUpdateProfile}
              className="w-full py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              Confirm Selection
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full flex items-center justify-center gap-2 text-[9px] font-bold uppercase opacity-50 hover:opacity-100 transition-all border-2 border-dashed border-zinc-500/30 py-3 rounded-xl mt-2"
            >
              <FaUpload className="text-[10px]" />
              Or Upload Custom Image
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ProfilePage;
