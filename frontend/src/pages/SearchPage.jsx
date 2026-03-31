import React, { useState, useEffect } from "react";
import {
  HiSearch,
  HiTerminal,
  HiUsers,
  HiLightningBolt,
  HiPlus,
  HiCheck,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  searchUsersAsync,
  clearSearchResults,
  toggleFollowAsync,
} from "../features/auth/authSlice";

function SearchPage({ isDarkMode }) {
  const [activeTab, setActiveTab] = useState("Users");
  const [searchQuery, setSearchQuery] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    searchResults,
    loading,
    user: currentUser,
  } = useSelector((state) => state.auth);

  // Follow trigger handling
  const handleFollow = (e, targetUserId) => {
    e.stopPropagation();
    dispatch(toggleFollowAsync(targetUserId));
  };

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const query = searchQuery.trim();
      if (query !== "") {
        if (activeTab === "Users") {
          dispatch(searchUsersAsync(query));
        }
      } else {
        dispatch(clearSearchResults());
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab, dispatch]);

  // Clear results on tab switch
  useEffect(() => {
    dispatch(clearSearchResults());
    setSearchQuery("");
  }, [activeTab, dispatch]);

  const categories = [
    {
      id: "Users",
      label: "Developers",
      icon: <HiUsers />,
      color: "text-purple-500",
    },
    {
      id: "Problems",
      label: "Problems",
      icon: <HiTerminal />,
      color: "text-blue-500",
    },
    {
      id: "Quizzes",
      label: "Quizzes",
      icon: <HiLightningBolt />,
      color: "text-yellow-500",
    },
  ];

  const theme = {
    bg: "bg-[var(--color-background)]",
    card: "bg-[var(--color-background-soft)] border-[var(--border-color-primary)]",
    sidebar:
      "bg-[var(--color-background-elevated)]/50 border-[var(--border-color-primary)]",
    textPrimary: "text-[var(--text-color-primary)]",
    textSecondary: "text-[var(--text-color-secondary)]",
    skeleton:
      "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)]",
  };

  return (
    <div
      className={`${isDarkMode ? "dark" : ""} transition-all duration-500 scale-[0.95] origin-top-left w-[105.2%] h-[105.2%] overflow-hidden`}
    >
      <div
        className={`h-screen ${theme.bg} ${theme.textSecondary} transition-colors duration-500`}
      >
        <div className="w-full mx-auto px-4 py-22">
          <div
            className={`border rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl shadow-emerald-900/5 ${theme.card}`}
          >
            {/* Top Search Bar */}
            <div className="relative border-b p-4 flex items-center gap-5 backdrop-blur-xl border-primary bg-background-soft/80">
              <HiSearch
                size={22}
                className={`transition-all duration-300 ${searchQuery ? "text-(--color-primary)" : "text-zinc-500"}`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search across ${activeTab.toLowerCase()}...`}
                className={`w-full bg-transparent text-lg font-semibold outline-none tracking-tight ${theme.textPrimary} placeholder:text-zinc-500`}
              />
            </div>

            <div className="flex flex-col md:flex-row min-h-120">
              {/* Sidebar */}
              <div
                className={`w-full md:w-60 border-r p-4 space-y-2 ${theme.sidebar}`}
              >
                <p className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.25em] text-muted">
                  Index Context
                </p>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[12px] font-bold transition-all group ${
                      activeTab === cat.id
                        ? "bg-primary/10 text-(--color-primary) border border-(--color-primary)/20"
                        : "text-zinc-500 hover:text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`${activeTab === cat.id ? cat.color : "opacity-40 group-hover:opacity-100"}`}
                      >
                        {cat.icon}
                      </span>
                      {cat.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 relative overflow-y-auto max-h-150 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {!searchQuery ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20"
                    >
                      <div
                        className={`w-16 h-16 rounded-3xl flex items-center justify-center border group ${theme.skeleton}`}
                      >
                        <HiLightningBolt
                          size={28}
                          className="text-zinc-500 group-hover:text-(--color-primary) animate-pulse"
                        />
                      </div>
                      <h3
                        className={`text-sm font-black uppercase tracking-widest ${theme.textPrimary}`}
                      >
                        Orbiton CX Engine
                      </h3>
                    </motion.div>
                  ) : loading &&
                    (!searchResults || searchResults.length === 0) ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`p-4 border rounded-2xl flex items-center gap-4 ${theme.skeleton}`}
                        >
                          <div className="w-10 h-10 bg-zinc-500/10 rounded-xl animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2.5 w-1/2 bg-zinc-500/10 rounded-full animate-pulse" />
                            <div className="h-2 w-1/3 bg-zinc-500/5 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      {activeTab === "Users" && searchResults?.length > 0 ? (
                        searchResults.map((userItem) => {
                          const isActuallyFollowing =
                            currentUser?.following?.includes(userItem._id);

                          return (
                            <motion.div
                              key={userItem._id}
                              onClick={() =>
                                navigate(`/profile/${userItem._id}`)
                              }
                              whileHover={{ scale: 1.01, x: 5 }}
                              className={`p-4 border rounded-2xl flex items-center gap-4 transition-all cursor-pointer ${theme.card} hover:border-(--color-primary)/50 group`}
                            >
                              <img
                                src={
                                  userItem.avatar ||
                                  `https://ui-avatars.com/api/?name=${userItem.name}&background=random`
                                }
                                className="w-11 h-11 rounded-xl object-cover border border-primary/20 shadow-sm"
                                alt={userItem.name}
                              />
                              <div className="flex-1">
                                <h4
                                  className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}
                                >
                                  {userItem.name}
                                </h4>
                                <p className="text-[11px] text-zinc-500 line-clamp-1">
                                  {userItem.bio || "No bio added yet"}
                                </p>
                              </div>
                              <button
                                onClick={(e) => handleFollow(e, userItem._id)}
                                disabled={userItem._id === currentUser?._id}
                                className={`text-[10px] font-black uppercase tracking-tighter px-4 py-2 rounded-md cursor-pointer transition-all flex items-center gap-2 ${
                                  isActuallyFollowing
                                    ? "bg-primary text-white"
                                    : "text-(--color-primary) bg-primary/10 hover:bg-primary/20"
                                } ${userItem._id === currentUser?._id ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                              >
                                {isActuallyFollowing ? (
                                  <>
                                    <HiCheck size={14} /> Following
                                  </>
                                ) : (
                                  <>
                                    <HiPlus size={14} /> Follow
                                  </>
                                )}
                              </button>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 opacity-40 uppercase text-[10px] font-black tracking-widest">
                          No {activeTab.toLowerCase()} found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
