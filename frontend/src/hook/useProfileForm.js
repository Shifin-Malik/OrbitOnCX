import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export const useProfileForm = (user, dispatch, updateProfile) => {
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    github: "",
    linkedin: "",
    website: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState("");

  useEffect(() => {
    if (user) {
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
  }, [user]);

  const handleUpdate = async (fileInput) => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));

    if (fileInput?.files?.[0]) {
      data.append("avatar", fileInput.files[0]);
    } else {
      data.append("avatar", selectedAvatar);
    }

    try {
      const promise = dispatch(updateProfile(data)).unwrap();
      await toast.promise(promise, {
        loading: "Updating profile...",
        success: "Profile updated successfully!",
        error: (err) => err || "Update failed",
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  return {
    formData,
    setFormData,
    selectedAvatar,
    setSelectedAvatar,
    handleUpdate,
  };
};
