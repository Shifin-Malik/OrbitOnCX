import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getProblemDiscussionsAPI,
  postProblemDiscussionAPI,
  replyProblemDiscussionAPI,
  deleteDiscussionAPI,
} from "../api.js";

export const fetchDiscussions = createAsyncThunk(
  "discussions/fetchDiscussions",
  async (problemId, thunkAPI) => {
    try {
      const res = await getProblemDiscussionsAPI(problemId);
      return res.data.comments || [];
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to load discussions",
      );
    }
  },
);

export const postComment = createAsyncThunk(
  "discussions/postComment",
  async ({ problemId, content }, thunkAPI) => {
    try {
      const res = await postProblemDiscussionAPI(problemId, { content });
      return res.data.comment;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to post comment",
      );
    }
  },
);

export const replyComment = createAsyncThunk(
  "discussions/replyComment",
  async ({ problemId, commentId, content }, thunkAPI) => {
    try {
      const res = await replyProblemDiscussionAPI(problemId, commentId, {
        content,
      });
      return res.data.reply;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to post reply",
      );
    }
  },
);

export const deleteComment = createAsyncThunk(
  "discussions/deleteComment",
  async ({ commentId }, thunkAPI) => {
    try {
      await deleteDiscussionAPI(commentId);
      return { _id: commentId };
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Failed to delete comment",
      );
    }
  },
);

const removeFromTree = (nodes, id) => {
  return nodes
    .filter((n) => n._id !== id)
    .map((n) => ({
      ...n,
      replies: Array.isArray(n.replies) ? removeFromTree(n.replies, id) : [],
    }));
};

const treeHasId = (nodes, id) => {
  if (!id) return false;
  const idStr = id.toString();
  for (const n of nodes || []) {
    if (n?._id?.toString?.() === idStr) return true;
    if (Array.isArray(n.replies) && treeHasId(n.replies, idStr)) return true;
  }
  return false;
};

const insertReply = (nodes, reply) => {
  return nodes.map((n) => {
    if (n._id === reply.parentComment) {
      const replies = Array.isArray(n.replies) ? n.replies : [];
      if (replies.some((r) => r?._id === reply._id)) return n;
      return { ...n, replies: [...replies, { ...reply, replies: [] }] };
    }
    return {
      ...n,
      replies: Array.isArray(n.replies) ? insertReply(n.replies, reply) : [],
    };
  });
};

const initialState = {
  comments: [],
  loading: false,
  posting: false,
  error: null,
};

const discussionSlice = createSlice({
  name: "discussions",
  initialState,
  reducers: {
    socketNewComment: (state, { payload }) => {
      if (!payload?._id || treeHasId(state.comments, payload._id)) return;
      state.comments = [...state.comments, { ...payload, replies: [] }];
    },
    socketNewReply: (state, { payload }) => {
      if (!payload?._id || treeHasId(state.comments, payload._id)) return;
      state.comments = insertReply(state.comments, payload);
    },
    socketDeleted: (state, { payload }) => {
      state.comments = removeFromTree(state.comments, payload?._id);
    },
    clearDiscussions: (state) => {
      state.comments = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscussions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscussions.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.comments = payload || [];
      })
      .addCase(fetchDiscussions.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || "Failed to load discussions";
      })
      .addCase(postComment.pending, (state) => {
        state.posting = true;
        state.error = null;
      })
      .addCase(postComment.fulfilled, (state, { payload }) => {
        state.posting = false;
        if (!payload?._id || treeHasId(state.comments, payload._id)) return;
        state.comments = [...state.comments, { ...payload, replies: [] }];
      })
      .addCase(postComment.rejected, (state, { payload }) => {
        state.posting = false;
        state.error = payload || "Failed to post comment";
      })
      .addCase(replyComment.pending, (state) => {
        state.posting = true;
        state.error = null;
      })
      .addCase(replyComment.fulfilled, (state, { payload }) => {
        state.posting = false;
        if (!payload?._id || treeHasId(state.comments, payload._id)) return;
        state.comments = insertReply(state.comments, payload);
      })
      .addCase(replyComment.rejected, (state, { payload }) => {
        state.posting = false;
        state.error = payload || "Failed to post reply";
      })
      .addCase(deleteComment.fulfilled, (state, { payload }) => {
        state.comments = removeFromTree(state.comments, payload?._id);
      });
  },
});

export const {
  socketNewComment,
  socketNewReply,
  socketDeleted,
  clearDiscussions,
} = discussionSlice.actions;
export default discussionSlice.reducer;

