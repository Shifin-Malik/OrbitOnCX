import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUsers } from "react-icons/fa";

import Header from "../components/Header";
import Features from "../components/Features";
import Footer from "../components/Footer";
import {
  fetchActiveUsersCount,
  setActiveUsers,
} from "../features/presence/presenceSlice";
import { createAppSocket } from "../services/socket.js";

function Home() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { activeUsers, loading, error } = useSelector((s) => s.presence);
  const socketRef = useRef(null);

  useEffect(() => {
    dispatch(fetchActiveUsersCount());
    const intervalId = setInterval(() => {
      dispatch(fetchActiveUsersCount());
    }, 30 * 1000);
    return () => clearInterval(intervalId);
  }, [dispatch]);

  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = createAppSocket();
    socketRef.current.on("app:active-users", (payload) => {
      if (typeof payload?.activeUsers === "number") {
        dispatch(setActiveUsers(payload.activeUsers));
      }
    });

    return () => {
      try {
        socketRef.current?.disconnect();
      } finally {
        socketRef.current = null;
      }
    };
  }, [dispatch, user?._id]);

  const isInitialLoading = loading && activeUsers === null;

  const activeText = isInitialLoading
    ? "Loading..."
    : typeof activeUsers === "number"
      ? `${activeUsers} online now`
      : error
        ? "Unavailable"
        : "- online now";

  return (
    <div className="">
      <Header
        activeUsers={activeUsers}
        activeUsersLoading={loading && activeUsers === null}
      />

      <div className="md:hidden px-6 -mt-10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="p-5 rounded-3xl bg-background-soft border border-primary shadow-xl shadow-black/10 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-(--color-primary) shadow-inner">
              <FaUsers size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-(--color-primary) font-black uppercase tracking-widest leading-none mb-1">
                Active Users
              </p>
              <p className="text-sm font-black text-primary tracking-tight">
                {activeText}
              </p>
              {error ? (
                <p className="mt-1 text-[10px] font-bold text-muted">
                  Unable to load live count right now.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <Features />
      <Footer />
    </div>
  );
}

export default Home;
