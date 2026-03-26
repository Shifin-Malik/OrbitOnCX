import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaSignOutAlt,
  FaLock,
  FaArrowLeft,
  FaUpload,
  FaGithub,
  FaLinkedin,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import ActivityHeatmap from "./ActivityHeatmap";
import {
  updateProfile,
  logout,
  resetAuthState,
} from "../features/auth/authSlice";
import toast, { Toaster } from "react-hot-toast";

const avatarStyles = [
  "avataaars",
  "bottts",
  "pixel-art",
  "adventurer",
  "big-smile",
  "fun-emoji",
  "lorelei",
  "identicon",
  "micah",
  "croodles",
];


const InputField = ({
  label,
  value,
  name,
  onChange,
  type = "text",
  placeholder,
  icon,
  compact,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const isPasswordField = type === "password";

  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase opacity-50 ml-2 flex items-center gap-2">
        {icon} {label}
      </label>
      <div className="relative">
        <input
          type={isPasswordField ? (isVisible ? "text" : "password") : type}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full ${
            compact ? "p-3" : "p-4"
          } bg-background-elevated border-2 border-transparent focus:border-(--color-primary) rounded-xl outline-none text-sm font-bold transition-all ${
            isPasswordField ? "pr-10" : ""
          }`}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-(--color-primary) transition-colors"
          >
            {isVisible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};


function Profile() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formStep, setFormStep] = useState("profile");

  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    github: "",
    linkedin: "",
    website: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        github: user.socialLinks?.github || "",
        linkedin: user.socialLinks?.linkedin || "",
        website: user.socialLinks?.website || "",
      });
      setSelectedAvatar(
        user.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
      );
    }
  }, [user, navigate]);

  const handleLogout = () => {
    toast.success("Logging out...");
    setTimeout(() => {
      dispatch(logout());
      dispatch(resetAuthState());
    }, 600);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleAvatarChange = (style) => {
    const newAvatar = `https://api.dicebear.com/7.x/${style}/svg?seed=${Math.floor(
      Math.random() * 10000,
    )}`;
    setSelectedAvatar(newAvatar);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024)
        return toast.error("File too large (Max 2MB)");
      const reader = new FileReader();
      reader.onloadend = () => setSelectedAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword)
      return toast.error("Please fill all password fields");

    const data = new FormData();
    data.append("oldPassword", passwordData.oldPassword);
    data.append("newPassword", passwordData.newPassword);

    dispatch(updateProfile(data))
      .unwrap()
      .then(() => {
        toast.success("Password updated!");
        setShowEditModal(false);
        setPasswordData({ oldPassword: "", newPassword: "" });
        setFormStep("profile");
      })
      .catch((err) => toast.error(err || "Update failed"));
  };

  const handleUpdateProfile = (e) => {
    if (e) e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("bio", formData.bio);
    data.append("github", formData.github);
    data.append("linkedin", formData.linkedin);
    data.append("website", formData.website);

    if (fileInputRef.current?.files[0]) {
      data.append("avatar", fileInputRef.current.files[0]);
    } else {
      data.append("avatar", selectedAvatar);
    }

    dispatch(updateProfile(data))
      .unwrap()
      .then(() => {
        setShowEditModal(false);
        setShowAvatarModal(false);
      })
      .catch((err) => toast.error(err || "Update failed"));
  };

  const displayStats = {
    totalSolved: user?.stats?.totalSolved || 300,
    totalProblems: 3865,
    easy: user?.stats?.easySolved || 100,
    easyTotal: 930,
    medium: user?.stats?.mediumSolved || 100,
    mediumTotal: 2022,
    hard: user?.stats?.hardSolved || 100,
    hardTotal: 913,
    streak: 12,
    followers: user?.stats?.followerCount || 0,
  };

  return (
    <div className="min-h-screen bg-background text-primary pt-28 pb-16 px-4 md:px-12">
      <Toaster position="top-center" />
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
       
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-background-soft border border-primary rounded-[3rem] p-8 shadow-2xl backdrop-blur-md text-center">
            <div className="relative group p-1.5 rounded-[3rem] bg-linear-to-tr from-primary to-accent inline-block">
              <img
                src={selectedAvatar || null}
                alt="Profile"
                className="w-40 h-40 rounded-[2.8rem] object-cover border-4 border-background-soft"
              />
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-2xl border-2 border-background-soft hover:scale-110 transition-all"
              >
                <FaEdit size={14} />
              </button>
            </div>
            <h2 className="text-3xl font-black mt-6">{user?.name || "User"}</h2>
            <div className="mt-2 px-4 py-1.5 bg-background-elevated rounded-full border border-primary inline-block">
              <p className="text-(--color-primary) font-bold text-[10px] uppercase tracking-widest">
                {user?.bio || "Developer"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 w-full">
              <StatCard label="Followers" value={displayStats.followers} />
              <StatCard label="Streak" value={displayStats.streak} isFire />
            </div>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => {
                  setFormStep("profile");
                  setShowEditModal(true);
                }}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase bg-primary text-white flex items-center justify-center gap-2"
              >
                <FaEdit /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center gap-2"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

       
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-background-soft border border-primary rounded-[3rem] p-8 md:p-12 shadow-xl">
            <h3 className="text-xl font-black flex items-center gap-3 mb-10 uppercase tracking-tighter">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Performance Overview
            </h3>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative flex justify-center">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="var(--color-background-elevated)"
                    strokeWidth="14"
                    fill="transparent"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="var(--color-primary)"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={502}
                    strokeDashoffset={
                      502 -
                      502 *
                        (displayStats.totalSolved / displayStats.totalProblems)
                    }
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">
                    {displayStats.totalSolved}
                  </span>
                  <span className="text-[9px] font-black uppercase opacity-50">
                    Solved
                  </span>
                </div>
              </div>
              <div className="space-y-5">
                <ModernBar
                  label="Easy"
                  solved={displayStats.easy}
                  total={displayStats.easyTotal}
                  color="bg-emerald-400"
                />
                <ModernBar
                  label="Medium"
                  solved={displayStats.medium}
                  total={displayStats.mediumTotal}
                  color="bg-amber-400"
                />
                <ModernBar
                  label="Hard"
                  solved={displayStats.hard}
                  total={displayStats.hardTotal}
                  color="bg-rose-400"
                />
              </div>
            </div>
          </div>
          <ActivityHeatmap />
        </div>
      </div>

      
      {showEditModal && (
        <Modal
          onClose={() => {
            setShowEditModal(false);
            setFormStep("profile");
          }}
          title="Account Settings"
          className="max-w-85 mx-auto overflow-hidden shadow-2xl"
        >
          <div className="flex bg-background-elevated p-1 rounded-xl mb-5 mx-3">
            <button
              onClick={() => setFormStep("profile")}
              className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                formStep === "profile"
                  ? "bg-primary shadow-sm text-white"
                  : "text-zinc-500 opacity-50"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setFormStep("reset")}
              className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                formStep === "reset"
                  ? "bg-primary shadow-sm text-white"
                  : "text-zinc-500 opacity-50"
              }`}
            >
              Security
            </button>
          </div>

          {formStep === "profile" ? (
            <form
              onSubmit={handleUpdateProfile}
              className="space-y-4 max-h-[55vh] overflow-y-auto px-4 scrollbar-hide"
            >
              <div className="space-y-3">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Basic Info
                </p>
                <InputField
                  label="Name"
                  value={formData.name}
                  name="name"
                  onChange={handleChange}
                  compact
                />
                <InputField
                  label="Bio"
                  value={formData.bio}
                  name="bio"
                  onChange={handleChange}
                  compact
                />
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3 opacity-50"></div>
              <div className="space-y-3">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Socials
                </p>
                <InputField
                  label="GitHub"
                  value={formData.github}
                  name="github"
                  onChange={handleChange}
                  icon={<FaGithub />}
                  compact
                />
                <InputField
                  label="LinkedIn"
                  value={formData.linkedin}
                  name="linkedin"
                  onChange={handleChange}
                  icon={<FaLinkedin />}
                  compact
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white rounded-xl font-black uppercase text-[9px] tracking-widest mt-2 active:scale-95 transition-all"
              >
                Update Profile
              </button>
            </form>
          ) : (
            <div className="px-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded-xl border border-zinc-100 dark:border-white/5 mb-2">
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight font-medium">
                    Keep account safe with a strong password.
                  </p>
                </div>
                <InputField
                  label="Old Password"
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  icon={<FaLock />}
                  onChange={handlePasswordChange}
                  compact
                />
                <InputField
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  icon={<FaLock />}
                  onChange={handlePasswordChange}
                  compact
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest mt-2 active:scale-95 transition-all"
                >
                  Update Password
                </button>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("Password reset link sent to your email!");
                    }}
                    className="text-[10px] font-bold text-white hover:underline uppercase tracking-wider"
                  >
                    Forgot old password?
                  </button>
                </div>
              </form>
              <button
                type="button"
                onClick={() => setFormStep("profile")}
                className="w-full py-3 text-[8px] font-black uppercase opacity-30 hover:opacity-80 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <FaArrowLeft size={6} /> Back
              </button>
            </div>
          )}
        </Modal>
      )}

   
      {showAvatarModal && (
        <Modal onClose={() => setShowAvatarModal(false)} title="Update Photo">
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current.click()}
              className="group cursor-pointer p-6 border-2 border-dashed border-primary rounded-4xl bg-background-elevated flex flex-col items-center justify-center hover:border-(--color-primary) transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
              />
              <FaUpload className="text-(--color-primary) text-2xl mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Upload Image
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {avatarStyles.map((s) => (
                <button
                  key={s}
                  onClick={() => handleAvatarChange(s)}
                  className="p-0.5 rounded-xl bg-background-elevated border-2 border-transparent hover:border-(--color-primary) transition-all"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/${s}/svg?seed=preview`}
                    alt={s}
                    className="w-full rounded-lg"
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => handleUpdateProfile()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs"
            >
              Confirm & Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}


const StatCard = ({ label, value, isFire }) => (
  <div className="bg-background-elevated border border-primary p-4 rounded-3xl text-center hover:scale-105 transition-transform">
    <p className="text-[9px] font-black uppercase opacity-60 mb-1">{label}</p>
    <p className={`text-lg font-black ${isFire ? "text-orange-500" : ""}`}>
      {isFire && "🔥"} {value}
    </p>
  </div>
);

const ModernBar = ({ label, solved, total, color }) => (
  <div className="w-full">
    <div className="flex justify-between items-center mb-1.5 font-black text-[9px] uppercase opacity-60">
      <span>{label}</span>
      <span>
        {solved}/{total}
      </span>
    </div>
    <div className="h-2.5 w-full bg-background-elevated rounded-full overflow-hidden border border-primary">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000`}
        style={{ width: `${(solved / total) * 100}%` }}
      ></div>
    </div>
  </div>
);

const Modal = ({ children, onClose, title, className = "max-w-md" }) => (
  <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
    <div
      className={`bg-background-soft border border-primary rounded-[2.5rem] p-8 w-full shadow-2xl animate-in zoom-in duration-200 ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-full hover:bg-rose-500 transition-all text-sm"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default Profile;
