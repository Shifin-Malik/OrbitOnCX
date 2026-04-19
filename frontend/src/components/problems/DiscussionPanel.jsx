import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchDiscussions,
  postComment,
  replyComment,
  deleteComment,
  socketDeleted,
  socketNewComment,
  socketNewReply,
} from "../../features/discussions/discussionSlice.js";
import { socket } from "../../services/socket.js";
import { FaPaperPlane, FaTrash } from "react-icons/fa";

const DiscussionPanel = ({ problemId }) => {
  const dispatch = useDispatch();
  const { comments, loading } = useSelector((s) => s.discussions);
  const { user } = useSelector((s) => s.auth);

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const socketRef = useRef(null);

  useEffect(() => {
    if (!problemId) return;

    dispatch(fetchDiscussions(problemId));

    socketRef.current = socket;

    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    const handleNewComment = (payload) => {
      dispatch(socketNewComment(payload));
    };

    const handleNewReply = (payload) => {
      dispatch(socketNewReply(payload));
    };

    const handleDeleted = (payload) => {
      dispatch(socketDeleted(payload));
    };

    socketRef.current.on("discussion:new-comment", handleNewComment);
    socketRef.current.on("discussion:new-reply", handleNewReply);
    socketRef.current.on("discussion:deleted", handleDeleted);

    socketRef.current.emit("discussion:join", { problemId });

    return () => {
      socketRef.current?.emit("discussion:leave", { problemId });
      socketRef.current?.off("discussion:new-comment", handleNewComment);
      socketRef.current?.off("discussion:new-reply", handleNewReply);
      socketRef.current?.off("discussion:deleted", handleDeleted);
    };
  }, [dispatch, problemId]);

  const onPost = async () => {
    if (!problemId) return;
    if (!commentText.trim()) return;

    try {
      await dispatch(
        postComment({ problemId, content: commentText })
      ).unwrap();
      setCommentText("");
    } catch (e) {
      toast.error(e || "Failed to post");
    }
  };

  const onReply = async () => {
    if (!problemId || !replyTo) return;
    if (!replyText.trim()) return;

    try {
      await dispatch(
        replyComment({
          problemId,
          commentId: replyTo,
          content: replyText,
        })
      ).unwrap();

      setReplyText("");
      setReplyTo(null);
    } catch (e) {
      toast.error(e || "Failed to reply");
    }
  };

  const onDelete = async (id) => {
    try {
      await dispatch(deleteComment({ commentId: id })).unwrap();
    } catch (e) {
      toast.error(e || "Failed to delete");
    }
  };

  const canDelete = (commentUserId) => {
    if (!user?._id) return false;
    return String(user._id) === String(commentUserId);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add to the discussion…"
          className="flex-1 min-h-12 max-h-40 px-4 py-3 rounded-2xl bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] outline-none text-sm resize-y"
        />

        <button
          onClick={onPost}
          className="px-4 py-3 rounded-2xl bg-[var(--color-primary)] text-white font-black text-[10px] uppercase tracking-widest"
          title="Post"
        >
          <FaPaperPlane />
        </button>
      </div>

      {loading ? (
        <div className="text-[12px] font-bold text-[var(--text-color-muted)]">
          Loading…
        </div>
      ) : comments.length === 0 ? (
        <div className="text-[12px] font-bold text-[var(--text-color-muted)]">
          No discussions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c._id}
              className="p-4 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img
                    src={c.user?.avatar}
                    alt={c.user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-[11px] font-black">
                      {c.user?.name || "User"}
                    </div>
                    <div className="text-[10px] text-[var(--text-color-muted)] font-mono">
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {canDelete(c.user?._id) ? (
                  <button
                    onClick={() => onDelete(c._id)}
                    className="p-2 rounded-xl hover:bg-white/5 text-[var(--text-color-muted)] hover:text-rose-500"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                ) : null}
              </div>

              <div className="mt-3 text-[12px] text-[var(--text-color-secondary)] whitespace-pre-wrap">
                {c.content}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setReplyTo(c._id)}
                  className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]"
                >
                  Reply
                </button>
              </div>

              {replyTo === c._id ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 px-4 py-3 rounded-2xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] outline-none text-sm"
                  />

                  <button
                    onClick={onReply}
                    className="px-4 py-3 rounded-2xl bg-[var(--color-primary)] text-white font-black text-[10px] uppercase tracking-widest"
                  >
                    Send
                  </button>

                  <button
                    onClick={() => {
                      setReplyTo(null);
                      setReplyText("");
                    }}
                    className="px-4 py-3 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] font-black text-[10px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              {Array.isArray(c.replies) && c.replies.length ? (
                <div className="mt-4 space-y-2 pl-5 border-l border-[var(--border-color-primary)]">
                  {c.replies.map((r) => (
                    <div
                      key={r._id}
                      className="p-3 rounded-2xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={r.user?.avatar}
                            alt={r.user?.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="text-[10px] font-black">
                            {r.user?.name || "User"}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-color-muted)]">
                            {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {canDelete(r.user?._id) ? (
                          <button
                            onClick={() => onDelete(r._id)}
                            className="p-2 rounded-xl hover:bg-white/5 text-[var(--text-color-muted)] hover:text-rose-500"
                            title="Delete"
                          >
                            <FaTrash className="text-[12px]" />
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-2 text-[12px] text-[var(--text-color-secondary)] whitespace-pre-wrap">
                        {r.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(DiscussionPanel);