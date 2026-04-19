import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaGoogle,
  FaGithub,
  FaShieldAlt,
  FaKey,
  FaArrowLeft,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { googleLoginAction } from "../features/auth/authSlice";
import { resetCompilerState } from "../features/compiler/compilerSlice";
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  resetAuthState,
  getProfile,
} from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

function Login({ isOpen, onClose, initialMode = "signin" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, isSuccess, isError, message, user } = useSelector(
    (state) => state.auth,
  );

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await dispatch(googleLoginAction(tokenResponse.access_token)).unwrap();

        const profile = await dispatch(getProfile()).unwrap();

        dispatch(resetCompilerState());
        onClose();

        if (profile?.user?.role === "admin" || profile?.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        toast.error("Google Login Failed");
      }
    },
    onError: () => toast.error("Google Login Failed"),
  });

  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(resetAuthState());
    }

    if (isSuccess) {
      if (message) toast.success(message);

      if (mode === "signup") {
        setMode("verify");
      } else if (mode === "forgot") {
        setMode("reset");
      } else if (mode === "verify") {
        setMode("signin");
      } else if (mode === "reset") {
        setMode("signin");
        setFormData((prev) => ({ ...prev, otp: "", password: "" }));
      } else if (mode === "signin") {
        dispatch(resetCompilerState());
        dispatch(resetAuthState());
        onClose();

        if (user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }

      if (mode !== "signin") {
        dispatch(resetAuthState());
      }
    }
  }, [isError, isSuccess, message, mode, dispatch, onClose, user, navigate]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setShowPassword(false);
      setFormData({ name: "", email: "", password: "", otp: "" });
    }
  }, [initialMode, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    switch (mode) {
      case "signup":
        dispatch(
          register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        );
        break;
      case "verify":
        dispatch(
          verifyEmail({
            email: formData.email,
            otp: formData.otp,
          }),
        );
        break;
      case "signin":
        dispatch(
          login({
            email: formData.email,
            password: formData.password,
          }),
        );
        break;
      case "forgot":
        dispatch(
          forgotPassword({
            email: formData.email,
          }),
        );
        break;

      case "reset":
        dispatch(
          resetPassword({
            email: formData.email,
            otp: formData.otp,
            newPassword: formData.password,
          }),
        );
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-100 p-4">
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background-soft border border-primary/20 rounded-3xl w-full max-w-82.5 p-5 relative shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-3">
            {["verify", "forgot", "reset"].includes(mode) ? (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
              >
                <FaArrowLeft /> Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="text-muted hover:text-rose-500 transition-colors text-lg p-1"
            >
              ✕
            </button>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-xl font-black text-primary tracking-tight uppercase leading-none">
              {mode === "signin" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "verify" && "Verify Email"}
              {mode === "forgot" && "Reset Password"}
              {mode === "reset" && "Set New Password"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === "signup" && (
              <Input
                icon={<FaUser />}
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            )}

            <Input
              icon={<FaEnvelope />}
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            {(mode === "verify" || mode === "reset") && (
              <Input
                icon={<FaShieldAlt />}
                name="otp"
                maxLength="6"
                placeholder="6-Digit OTP"
                className="text-center tracking-[0.3em]"
                value={formData.otp}
                onChange={handleChange}
                required
              />
            )}

            {["signin", "signup", "reset"].includes(mode) && (
              <div className="relative group">
                <Input
                  icon={mode === "reset" ? <FaKey /> : <FaLock />}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "reset" ? "New Password" : "Password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            )}

            {mode === "signin" && (
              <div className="flex justify-end px-1">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[9px] text-primary font-bold uppercase hover:underline"
                >
                  Forgot?
                </button>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-primary text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 mt-1 transition-all"
            >
              {loading ? "..." : mode.toUpperCase()}
            </button>
          </form>

          {(mode === "signin" || mode === "signup") && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-primary/10"></span>
                </div>
                <div className="relative flex justify-center text-[8px] uppercase font-black text-muted bg-background-soft px-3">
                  OR
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SocialBtn
                  onClick={() => googleLoginHandler()}
                  icon={<FaGoogle className="text-rose-500" />}
                  label="Google"
                />
                <SocialBtn icon={<FaGithub />} label="GitHub" />
              </div>
            </>
          )}

          <p className="text-[10px] text-center mt-4 text-secondary">
            {mode === "signin" ? "New here?" : "Joined already?"}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-black uppercase tracking-wider ml-1 hover:underline"
            >
              {mode === "signin" ? "Register" : "Sign In"}
            </button>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const Input = ({ icon, className = "", name, ...props }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs group-focus-within:text-primary transition-colors z-10">
      {icon}
    </div>
    <input
      name={name}
      {...props}
      className={`w-full pl-9 pr-3 py-2 bg-background border border-primary/10 rounded-lg outline-none text-xs text-primary transition-all focus:border-primary placeholder:text-muted/40 ${className}`}
    />
  </div>
);

const SocialBtn = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center gap-2 py-2 border border-primary/10 rounded-lg bg-background hover:bg-primary/5 transition-all font-bold text-[9px] text-primary uppercase active:scale-95"
  >
    {icon} {label}
  </button>
);

export default Login;
