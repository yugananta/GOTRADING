var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express_async_errors = require("express-async-errors");
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_http = require("http");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");

// src/lib/supabaseClient.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseClient = null;
var warnLogged = false;
var quotaExceeded = false;
var getSupabase = () => {
  if (quotaExceeded) return null;
  if (supabaseClient) return supabaseClient;
  const getEnv = (key) => {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
    try {
      const metaEnv = Function("return import.meta.env")();
      return metaEnv?.[key] || "";
    } catch {
      return "";
    }
  };
  let supabaseUrl = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL") || "";
  const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_SERVICE_ROLE_KEY") || "";
  const databaseUrl = getEnv("DATABASE_URL");
  if (!supabaseUrl && databaseUrl) {
    const dbUrl = databaseUrl;
    const supabaseCoMatch = dbUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/) || dbUrl.match(/db\.([a-z0-9]+)\.supabase\.co/);
    const poolerMatch = dbUrl.match(/postgres\.([a-z0-9]+):/);
    if (supabaseCoMatch && supabaseCoMatch[1]) {
      supabaseUrl = `https://${supabaseCoMatch[1]}.supabase.co`;
    } else if (poolerMatch && poolerMatch[1]) {
      supabaseUrl = `https://${poolerMatch[1]}.supabase.co`;
    }
  }
  if (supabaseUrl && (supabaseUrl.startsWith("postgresql://") || supabaseUrl.startsWith("postgres://"))) {
    const match = supabaseUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/) || supabaseUrl.match(/db\.([a-z0-9]+)\.supabase\.co/) || supabaseUrl.match(/postgres\.([a-z0-9]+):/);
    if (match && match[1]) {
      const ref = match[1];
      supabaseUrl = `https://${ref}.supabase.co`;
    }
  }
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    if (!warnLogged) {
      console.warn("Supabase credentials missing or incomplete. Operating in robust local/mock fallback mode.");
      warnLogged = true;
    }
    return null;
  }
  try {
    supabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return supabaseClient;
  } catch (err) {
    return null;
  }
};
var createMockChain = () => {
  const target = () => {
  };
  const realPromise = Promise.resolve({ data: [], error: null });
  const singlePromise = Promise.resolve({ data: null, error: null });
  const proxy = new Proxy(target, {
    get(_t, prop) {
      if (prop === "then") {
        return (onfulfilled, onrejected) => realPromise.then(onfulfilled, onrejected);
      }
      if (prop === "catch") {
        return (onrejected) => realPromise.catch(onrejected);
      }
      if (prop === "finally") {
        return (onfinally) => realPromise.finally(onfinally);
      }
      if (prop === "single" || prop === "maybeSingle") {
        return () => singlePromise;
      }
      return () => proxy;
    }
  });
  return proxy;
};
var supabase = new Proxy({}, {
  get(_target, prop) {
    if (quotaExceeded) {
      if (prop === "from") {
        return () => createMockChain();
      }
      if (prop === "auth") {
        return {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Quota exceeded" } }),
          signOut: () => Promise.resolve({ error: null })
        };
      }
      return () => Promise.resolve({ data: null, error: null });
    }
    const client = getSupabase();
    if (!client) {
      if (prop === "from") {
        return () => createMockChain();
      }
      return void 0;
    }
    const value = client[prop];
    if (typeof value === "function") {
      return (...args) => {
        const result = value.apply(client, args);
        if (result && typeof result.then === "function") {
          return result.then((res) => {
            if (res && res.error && typeof res.error.message === "string" && (res.error.message.includes("exceed_egress_quota") || res.error.message.includes("quota"))) {
              quotaExceeded = true;
              console.warn("Supabase quota exceeded detected. Switching to robust local/mock fallback mode.");
              return { data: [], error: null };
            }
            return res;
          }).catch((err) => {
            if (err && (String(err?.message || err).includes("exceed_egress_quota") || String(err?.message || err).includes("quota"))) {
              quotaExceeded = true;
              console.warn("Supabase quota exceeded detected. Switching to robust local/mock fallback mode.");
            }
            return { data: [], error: null };
          });
        }
        return result;
      };
    }
    return value;
  }
});

// src/repositories/AuthRepositories.ts
var import_crypto = __toESM(require("crypto"), 1);
var UserRepository = class {
  async findByEmail(email) {
    try {
      const { data, error } = await supabase.from("User").select("*").eq("email", email).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data;
    } catch (e) {
      console.error("Supabase findByEmail failed:", e?.message || e);
      return null;
    }
  }
  async findById(id) {
    try {
      const { data, error } = await supabase.from("User").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data;
    } catch (e) {
      console.error("Supabase findById failed:", e?.message || e);
      return null;
    }
  }
  async create(user) {
    const userId = user.id || import_crypto.default.randomUUID();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const updatedAt = createdAt;
    const dbPayload = {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      password: user.password || "$2b$10$fallbackDummyPasswordHashValue",
      whatsappNumber: user.whatsappNumber || null,
      country: user.country || "",
      province: user.province || "",
      city: user.city || "",
      avatar: user.avatar || "https://i.pravatar.cc/150?u=default",
      coverPhoto: user.coverPhoto || null,
      headline: user.headline || null,
      bio: user.bio || null,
      tradingExperience: user.tradingExperience || "Beginner",
      tradingAsset: user.tradingAsset || "Forex",
      onlineStatus: user.onlineStatus || "offline",
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      reputationPoints: user.reputationPoints || 0,
      role: user.role || "user",
      createdAt,
      updatedAt
    };
    try {
      const { data, error } = await supabase.from("User").insert([dbPayload]).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Supabase user creation failed:", e?.message || e);
      throw e;
    }
  }
  async updateStatus(id, status) {
    try {
      const payload = { updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      if (status === "online" || status === "offline") {
        payload.onlineStatus = status;
      }
      const { error } = await supabase.from("User").update(payload).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update status in Supabase:", e?.message || e);
    }
  }
  async updateLastLogin(id) {
    try {
      const { error } = await supabase.from("User").update({ updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update last login in Supabase:", e?.message || e);
    }
  }
  async updatePassword(id, passwordHash) {
    try {
      const { error } = await supabase.from("User").update({ password: passwordHash, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update password in Supabase:", e?.message || e);
    }
  }
  async list() {
    try {
      const { data, error } = await supabase.from("User").select("*");
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Supabase list users failed:", e?.message || e);
      return [];
    }
  }
  async update(id, updates) {
    try {
      const dbUpdates = {};
      const validFields = [
        "firstName",
        "lastName",
        "username",
        "email",
        "password",
        "whatsappNumber",
        "country",
        "province",
        "city",
        "avatar",
        "coverPhoto",
        "headline",
        "bio",
        "tradingExperience",
        "tradingAsset",
        "onlineStatus",
        "followersCount",
        "followingCount",
        "reputationPoints",
        "role",
        "isVerified",
        "mt5Connected",
        "latitude",
        "longitude"
      ];
      for (const field of validFields) {
        if (field in updates) {
          dbUpdates[field] = updates[field];
        }
      }
      dbUpdates.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const { error } = await supabase.from("User").update(dbUpdates).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update user in Supabase:", e?.message || e);
    }
  }
  async delete(id) {
    try {
      const { error } = await supabase.from("User").delete().eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to delete user in Supabase:", e?.message || e);
    }
  }
};
var ProfileRepository = class {
  async create(profile) {
    try {
      const { user_id, ...updates } = profile;
      await supabase.from("User").update(updates).eq("id", user_id);
    } catch (e) {
      console.error("Failed to update profile in User table in Supabase:", e?.message || e);
    }
  }
  async getByUserId(userId) {
    try {
      const { data, error } = await supabase.from("User").select("*").eq("id", userId).maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase get user as profile failed:", e?.message || e);
    }
    return null;
  }
  async update(userId, updates) {
    try {
      await supabase.from("User").update(updates).eq("id", userId);
    } catch (e) {
      console.error("Failed to update user profile in Supabase:", e?.message || e);
    }
  }
};
var SessionRepository = class {
  async create(session) {
    const id = import_crypto.default.randomUUID();
    const record = { id, ...session };
    try {
      const { data, error } = await supabase.from("sessions").insert(record).select().single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Failed to create session in Supabase:", e?.message || e);
    }
    return record;
  }
  async getByRefreshTokenHash(hash) {
    try {
      const { data, error } = await supabase.from("sessions").select("*").eq("refresh_token_hash", hash).maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Failed to get session by hash from Supabase:", e?.message || e);
    }
    return null;
  }
  async revoke(id) {
    try {
      await supabase.from("sessions").update({ revoked_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    } catch (e) {
      console.error("Failed to revoke session in Supabase:", e?.message || e);
    }
  }
  async listByUserId(userId) {
    try {
      const { data, error } = await supabase.from("sessions").select("*").eq("user_id", userId).is("revoked_at", null);
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Failed to list sessions by user in Supabase:", e?.message || e);
    }
    return [];
  }
  async revokeAllByUserId(userId) {
    try {
      await supabase.from("sessions").update({ revoked_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("user_id", userId).is("revoked_at", null);
    } catch (e) {
      console.error("Failed to revoke all sessions in Supabase:", e?.message || e);
    }
  }
};
var VerificationRepository = class {
  async create(data) {
    const id = import_crypto.default.randomUUID();
    const record = { id, ...data };
    try {
      const { data: result, error } = await supabase.from("email_verifications").insert(record).select().single();
      if (!error && result) {
        return result;
      }
    } catch (e) {
      console.error("Failed to create email verification in Supabase:", e?.message || e);
    }
    return record;
  }
  async getByTokenHash(tokenHash) {
    try {
      const { data, error } = await supabase.from("email_verifications").select("*").eq("token_hash", tokenHash).maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Failed to get verification by token hash from Supabase:", e?.message || e);
    }
    return null;
  }
  async verify(id) {
    try {
      await supabase.from("email_verifications").update({ verified_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    } catch (e) {
      console.error("Failed to verify email in Supabase:", e?.message || e);
    }
  }
};
var PasswordResetRepository = class {
  async create(data) {
    const id = import_crypto.default.randomUUID();
    const record = { id, ...data };
    try {
      const { data: result, error } = await supabase.from("password_resets").insert(record).select().single();
      if (!error && result) {
        return result;
      }
    } catch (e) {
      console.error("Failed to create password reset in Supabase:", e?.message || e);
    }
    return record;
  }
  async getByTokenHash(tokenHash) {
    try {
      const { data, error } = await supabase.from("password_resets").select("*").eq("token_hash", tokenHash).maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Failed to get password reset by token hash from Supabase:", e?.message || e);
    }
    return null;
  }
  async markUsed(id) {
    try {
      await supabase.from("password_resets").update({ used_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    } catch (e) {
      console.error("Failed to mark password reset as used in Supabase:", e?.message || e);
    }
  }
};
var LoginHistoryRepository = class {
  async log(history) {
    const id = import_crypto.default.randomUUID();
    const record = { id, ...history };
    try {
      await supabase.from("login_history").insert(record);
    } catch (e) {
      console.error("Failed to log login history in Supabase:", e?.message || e);
    }
  }
};
var AuditRepository = class {
  async logAction(data) {
    const id = import_crypto.default.randomUUID();
    const record = { id, ...data, created_at: (/* @__PURE__ */ new Date()).toISOString() };
    try {
      await supabase.from("audit_logs").insert(record);
    } catch (e) {
      console.error("Failed to log audit action in Supabase:", e?.message || e);
    }
  }
};

// src/utils/postUtils.ts
function deserializePost(dbPost) {
  if (!dbPost) return dbPost;
  const post = { ...dbPost };
  const rawContent = dbPost.content || "";
  const parts = rawContent.split("\n\n__METADATA__=");
  if (parts.length > 1) {
    const content = parts.slice(0, -1).join("\n\n__METADATA__=");
    try {
      const metadata = JSON.parse(parts[parts.length - 1]);
      post.content = content;
      post.images = metadata.images || dbPost.images || [];
      post.marketBias = metadata.marketBias || dbPost.marketBias || null;
    } catch {
      post.images = dbPost.images || [];
      post.marketBias = dbPost.marketBias || null;
    }
  } else {
    post.images = dbPost.images || [];
    post.marketBias = dbPost.marketBias || null;
  }
  if (Array.isArray(post.images)) {
    post.images = post.images.filter((img) => typeof img === "string" && img.length < 1e8);
  }
  if (post.videoUrl && post.videoUrl.startsWith("data:") && post.videoUrl.length > 1e8) {
    post.videoUrl = void 0;
  }
  return post;
}
function isPostPinned(post) {
  if (!post) return false;
  return Boolean(
    post.pinned === true || post.isPinned === true || post.is_pinned === true || post.isOfficial === true
  );
}
function sortPostsWithPinnedFirst(posts) {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort((a, b) => {
    const aPinned = isPostPinned(a);
    const bPinned = isPostPinned(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });
}

// src/repositories/PostRepository.ts
var FALLBACK_POSTS = [];
var PostRepository = class {
  async list(limit, groupId, search, tag, userId, page, pageSize) {
    let remotePosts = [];
    try {
      let query = supabase.from("Post").select("*").order("timestamp", { ascending: false });
      if (groupId) {
        query = query.eq("groupId", groupId);
      }
      if (userId) {
        query = query.eq("userId", userId);
      }
      if (search) {
        query = query.or(`content.ilike.%${search}%,authorName.ilike.%${search}%,authorUsername.ilike.%${search}%`);
      }
      if (tag) {
        query = query.contains("tags", [tag]);
      }
      const fetchLimit = groupId === null || groupId === "null" ? Math.max((limit || 50) * 3, 300) : limit || 150;
      if (page !== void 0 && groupId !== null && groupId !== "null") {
        const size = pageSize !== void 0 ? pageSize : 15;
        const from = page * size;
        const to = from + size - 1;
        query = query.range(from, to);
      } else {
        query = query.limit(fetchLimit);
      }
      const { data, error } = await query;
      if (!error && data) {
        remotePosts = data.map(deserializePost);
      }
    } catch (e) {
      console.warn("Supabase list posts warning:", e?.message || e);
    }
    const map = /* @__PURE__ */ new Map();
    remotePosts.forEach((p) => map.set(p.id, p));
    if (map.size === 0) {
      FALLBACK_POSTS.forEach((p) => map.set(p.id, p));
    }
    let results = Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (groupId) {
      results = results.filter((p) => p.groupId === groupId);
    } else if (groupId === null || groupId === "null") {
      results = results.filter((p) => !p.groupId);
    }
    if (userId) {
      results = results.filter((p) => p.userId === userId);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) => p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q) || p.authorUsername.toLowerCase().includes(q)
      );
    }
    if (tag) {
      results = results.filter((p) => p.tags && p.tags.includes(tag));
    }
    if (page !== void 0) {
      const size = pageSize !== void 0 ? pageSize : 15;
      const from = page * size;
      results = results.slice(from, from + size);
    } else if (limit) {
      results = results.slice(0, limit);
    }
    return results;
  }
  async create(post) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const id = "post_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const newPost = {
      id,
      userId: post.userId,
      authorName: post.authorName,
      authorUsername: post.authorUsername,
      authorAvatar: post.authorAvatar,
      authorRole: post.authorRole,
      authorCity: post.authorCity,
      authorCountry: post.authorCountry,
      authorVerified: post.authorVerified || false,
      content: post.content || "",
      videoUrl: post.videoUrl,
      images: post.images,
      marketBias: post.marketBias,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      bookmarksCount: post.bookmarksCount || 0,
      repostsCount: post.repostsCount || 0,
      likedBy: post.likedBy || [],
      bookmarkedBy: post.bookmarkedBy || [],
      repostedBy: post.repostedBy || [],
      timestamp,
      tags: post.tags || [],
      chart: post.chart,
      groupId: post.groupId,
      isOfficial: post.isOfficial || false,
      isPinned: post.isPinned || false,
      isRepost: post.isRepost || false,
      originalAuthorName: post.originalAuthorName
    };
    try {
      const dbRecord = { ...newPost };
      const { data, error } = await supabase.from("Post").insert([dbRecord]).select().single();
      if (!error && data) {
        return deserializePost(data);
      }
    } catch (e) {
      console.warn("Supabase create post fallback:", e?.message || e);
    }
    return newPost;
  }
  async findById(id) {
    const fallback = FALLBACK_POSTS.find((p) => p.id === id);
    if (fallback) return fallback;
    try {
      const { data, error } = await supabase.from("Post").select("*").eq("id", id).maybeSingle();
      if (!error && data) return deserializePost(data);
    } catch (e) {
    }
    return null;
  }
  async delete(id) {
    try {
      await supabase.from("Post").delete().eq("id", id);
    } catch (e) {
    }
  }
  async update(post) {
    try {
      const dbUpdate = {
        userId: post.userId,
        authorName: post.authorName,
        authorUsername: post.authorUsername,
        authorAvatar: post.authorAvatar,
        authorRole: post.authorRole,
        authorCity: post.authorCity,
        authorCountry: post.authorCountry,
        authorVerified: post.authorVerified,
        content: post.content || "",
        videoUrl: post.videoUrl || null,
        images: post.images || [],
        marketBias: post.marketBias || null,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        bookmarksCount: post.bookmarksCount,
        repostsCount: post.repostsCount,
        likedBy: post.likedBy,
        bookmarkedBy: post.bookmarkedBy,
        repostedBy: post.repostedBy,
        timestamp: post.timestamp,
        tags: post.tags,
        chart: post.chart,
        groupId: post.groupId,
        isOfficial: post.isOfficial,
        isPinned: post.isPinned,
        isRepost: post.isRepost
      };
      await supabase.from("Post").update(dbUpdate).eq("id", post.id);
    } catch (e) {
    }
  }
  async filter(predicate) {
    const posts = await this.list();
    return posts.filter(predicate);
  }
};

// src/repositories/MessageRepository.ts
var MessageRepository = class {
  async list() {
    try {
      let allMessages = [];
      const { data: msgData, error: msgError } = await supabase.from("Message").select("*").order("timestamp", { ascending: false });
      if (!msgError && msgData) {
        allMessages = [...msgData];
      }
      const { data: commData, error: commError } = await supabase.from("community_messages").select("*").order("timestamp", { ascending: false });
      if (!commError && commData) {
        const mappedComm = commData.map((m) => ({
          id: m.id,
          senderId: m.senderId || m.sender_id || m.userId,
          receiverId: m.receiverId || m.receiver_id || m.groupId || m.group_id,
          content: m.content || "",
          timestamp: m.timestamp || m.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          isRead: true,
          isDelivered: true,
          image: m.image || m.image_url,
          reactions: m.reactions || []
        }));
        allMessages = [...allMessages, ...mappedComm];
      }
      const map = /* @__PURE__ */ new Map();
      allMessages.forEach((m) => map.set(m.id, m));
      return Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      console.error("Failed to list messages from Supabase:", e);
      return [];
    }
  }
  async listAllForUser(userId) {
    return this.list();
  }
  async listHistory(userId, partnerId) {
    const isGroup = partnerId.startsWith("group_");
    try {
      if (isGroup) {
        let groupMessages = [];
        const { data: msgData } = await supabase.from("Message").select("*").eq("receiverId", partnerId);
        if (msgData) groupMessages.push(...msgData);
        const { data: commData } = await supabase.from("community_messages").select("*").or(`groupId.eq.${partnerId},group_id.eq.${partnerId}`);
        if (commData) {
          const mapped = commData.map((m) => ({
            id: m.id,
            senderId: m.senderId || m.sender_id || m.userId,
            receiverId: m.receiverId || m.receiver_id || m.groupId || m.group_id,
            content: m.content || "",
            timestamp: m.timestamp || m.created_at || (/* @__PURE__ */ new Date()).toISOString(),
            isRead: true,
            isDelivered: true,
            image: m.image || m.image_url,
            reactions: m.reactions || []
          }));
          groupMessages.push(...mapped);
        }
        const map = /* @__PURE__ */ new Map();
        groupMessages.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      } else {
        const { data, error } = await supabase.from("Message").select("*").or(`and(senderId.eq.${userId},receiverId.eq.${partnerId}),and(senderId.eq.${partnerId},receiverId.eq.${userId})`);
        if (error) throw error;
        return data || [];
      }
    } catch (e) {
      console.error("Failed to list chat history from Supabase:", e);
      return [];
    }
  }
  async findById(id) {
    try {
      const { data } = await supabase.from("Message").select("*").eq("id", id).maybeSingle();
      if (data) return data;
      const { data: commData } = await supabase.from("community_messages").select("*").eq("id", id).maybeSingle();
      if (commData) {
        return {
          id: commData.id,
          senderId: commData.senderId || commData.sender_id || commData.userId,
          receiverId: commData.receiverId || commData.receiver_id || commData.groupId || commData.group_id,
          content: commData.content || "",
          timestamp: commData.timestamp || commData.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          isRead: true,
          isDelivered: true,
          image: commData.image || commData.image_url,
          reactions: commData.reactions || []
        };
      }
      return null;
    } catch (e) {
      console.error("Failed to find message by id from Supabase:", e);
      return null;
    }
  }
  async create(message) {
    const id = "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const isGroupMsg = message.receiverId && message.receiverId.startsWith("group_");
    const dbRecord = {
      id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content || "",
      timestamp,
      isRead: false,
      isDelivered: true,
      image: message.image,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      reactions: message.reactions || []
    };
    try {
      if (isGroupMsg) {
        await supabase.from("community_messages").insert([{
          id,
          groupId: message.receiverId,
          group_id: message.receiverId,
          senderId: message.senderId,
          sender_id: message.senderId,
          content: message.content || "",
          timestamp,
          image: message.image
        }]);
      }
      const { data, error } = await supabase.from("Message").insert([{
        id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content || "",
        timestamp,
        isRead: false,
        isDelivered: true
      }]).select().single();
      if (error) {
        console.warn("Supabase message create notice:", error.message || error);
        return dbRecord;
      }
      return data || dbRecord;
    } catch (e) {
      console.warn("Failed to create message in Supabase, using fallback:", e?.message || e);
      return dbRecord;
    }
  }
  async update(message) {
    try {
      const updatePayload = {
        content: message.content,
        isRead: message.isRead,
        isDelivered: message.isDelivered
      };
      await supabase.from("Message").update(updatePayload).eq("id", message.id);
      await supabase.from("community_messages").update(updatePayload).eq("id", message.id);
    } catch (e) {
      console.warn("Failed to update message in Supabase:", e?.message || e);
    }
  }
  async markAsRead(senderId, receiverId) {
    try {
      await supabase.from("Message").update({ isRead: true }).eq("senderId", senderId).eq("receiverId", receiverId).eq("isRead", false);
    } catch (e) {
      console.warn("Failed to mark messages as read in Supabase:", e?.message || e);
    }
  }
  async delete(id) {
    try {
      await supabase.from("Message").delete().eq("id", id);
      await supabase.from("community_messages").delete().eq("id", id);
    } catch (e) {
      console.warn("Failed to delete message in Supabase:", e?.message || e);
    }
  }
};

// src/repositories/NotificationRepository.ts
var NotificationRepository = class _NotificationRepository {
  static {
    this.memoryNotifications = [];
  }
  async list() {
    const listMap = /* @__PURE__ */ new Map();
    _NotificationRepository.memoryNotifications.forEach((n) => listMap.set(n.id, n));
    try {
      const { data, error } = await supabase.from("Notification").select("*").order("timestamp", { ascending: false });
      if (error) throw error;
      if (data) {
        data.forEach((n) => listMap.set(n.id, n));
      }
    } catch (e) {
      console.error("Failed to list notifications from Supabase:", e);
    }
    return Array.from(listMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async listByUserId(userId) {
    const listMap = /* @__PURE__ */ new Map();
    _NotificationRepository.memoryNotifications.filter((n) => n.toUserId === userId).forEach((n) => listMap.set(n.id, n));
    try {
      const { data, error } = await supabase.from("Notification").select("*").eq("toUserId", userId).order("timestamp", { ascending: false });
      if (error) throw error;
      if (data) {
        data.forEach((n) => listMap.set(n.id, n));
      }
    } catch (e) {
      console.error("Failed to list notifications by user from Supabase:", e?.message || e);
    }
    return Array.from(listMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async findById(id) {
    const memNotif = _NotificationRepository.memoryNotifications.find((n) => n.id === id);
    if (memNotif) return memNotif;
    try {
      const { data, error } = await supabase.from("Notification").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Failed to find notification by id from Supabase:", e);
      return null;
    }
  }
  async create(notification) {
    const id = notification.id || "notify_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const newNotif = {
      id,
      toUserId: notification.toUserId,
      fromUserId: notification.fromUserId || "system",
      fromUserName: notification.fromUserName || "Tarapti Alert",
      fromUserAvatar: notification.fromUserAvatar || "\u{1F6A8}",
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead || false,
      timestamp: notification.timestamp || (/* @__PURE__ */ new Date()).toISOString()
    };
    _NotificationRepository.memoryNotifications.unshift(newNotif);
    try {
      const { data, error } = await supabase.from("Notification").insert([newNotif]).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Failed to create notification in Supabase, using memory fallback:", e);
      return newNotif;
    }
  }
  async markAllAsRead(userId) {
    _NotificationRepository.memoryNotifications.filter((n) => n.toUserId === userId).forEach((n) => n.isRead = true);
    try {
      await supabase.from("Notification").update({ isRead: true }).eq("toUserId", userId);
    } catch (e) {
      console.error("Failed to mark notifications as read in Supabase:", e);
    }
  }
  async delete(id) {
    _NotificationRepository.memoryNotifications = _NotificationRepository.memoryNotifications.filter((n) => n.id !== id);
    try {
      await supabase.from("Notification").delete().eq("id", id);
    } catch (e) {
      console.error("Failed to delete notification in Supabase:", e);
    }
  }
  async update(id, updates) {
    const memNotif = _NotificationRepository.memoryNotifications.find((n) => n.id === id);
    if (memNotif) {
      Object.assign(memNotif, updates);
    }
    try {
      await supabase.from("Notification").update(updates).eq("id", id);
    } catch (e) {
      console.error("Failed to update notification in Supabase:", e);
    }
  }
};

// src/repositories/CommentRepository.ts
var CommentRepository = class {
  async listByPostId(postId) {
    try {
      const { data, error } = await supabase.from("Comment").select("*").eq("postId", postId).order("timestamp", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Failed to list comments from Supabase:", e?.message || e);
      return [];
    }
  }
  async list() {
    try {
      const { data, error } = await supabase.from("Comment").select("*");
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Failed to list all comments from Supabase:", e?.message || e);
      return [];
    }
  }
  async create(comment) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const id = "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const dbRecord = {
      id,
      postId: comment.postId,
      userId: comment.userId,
      authorName: comment.authorName,
      authorUsername: comment.authorUsername,
      authorAvatar: comment.authorAvatar,
      content: comment.content,
      timestamp
    };
    try {
      console.log(`Inserting comment into Supabase: ${JSON.stringify(dbRecord)}`);
      const { data, error } = await supabase.from("Comment").insert([dbRecord]).select().single();
      if (error) {
        console.error("Supabase error inserting comment:", error);
        throw error;
      }
      console.log("Comment inserted into Supabase successfully:", data);
      return data;
    } catch (e) {
      console.warn("Failed to create comment in Supabase:", e?.message || e);
      throw e;
    }
  }
  async delete(id) {
    try {
      const { error } = await supabase.from("Comment").delete().eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to delete comment in Supabase:", e?.message || e);
    }
  }
};

// src/repositories/FollowRepository.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var FollowRepository = class _FollowRepository {
  static {
    this.memoryFollows = [];
  }
  async listFollowers(userId) {
    const followers = /* @__PURE__ */ new Set();
    _FollowRepository.memoryFollows.filter((f) => f.followingId === userId).forEach((f) => followers.add(f.followerId));
    try {
      let { data, error } = await supabase.from("Follow").select("followerId").eq("followingId", userId);
      if (error || !data) {
        const res = await supabase.from("follows").select("follower_id, followerId").or(`following_id.eq.${userId},followingId.eq.${userId}`);
        if (!res.error && res.data) {
          res.data.forEach((f) => {
            const fid = f.followerId || f.follower_id;
            if (fid) followers.add(fid);
          });
        }
      } else {
        data.forEach((f) => {
          const fid = f.followerId || f.follower_id;
          if (fid) followers.add(fid);
        });
      }
    } catch (e) {
      console.error("Failed to list followers from Supabase:", e?.message || e);
    }
    return Array.from(followers);
  }
  async listFollowing(userId) {
    const following = /* @__PURE__ */ new Set();
    _FollowRepository.memoryFollows.filter((f) => f.followerId === userId).forEach((f) => following.add(f.followingId));
    try {
      let { data, error } = await supabase.from("Follow").select("followingId").eq("followerId", userId);
      if (error || !data) {
        const res = await supabase.from("follows").select("following_id, followingId").or(`follower_id.eq.${userId},followerId.eq.${userId}`);
        if (!res.error && res.data) {
          res.data.forEach((f) => {
            const fid = f.followingId || f.following_id;
            if (fid) following.add(fid);
          });
        }
      } else {
        data.forEach((f) => {
          const fid = f.followingId || f.following_id;
          if (fid) following.add(fid);
        });
      }
    } catch (e) {
      console.error("Failed to list following from Supabase:", e?.message || e);
    }
    return Array.from(following);
  }
  async list() {
    const listMap = /* @__PURE__ */ new Map();
    _FollowRepository.memoryFollows.forEach((f) => {
      listMap.set(`${f.followerId}_${f.followingId}`, f);
    });
    try {
      let { data, error } = await supabase.from("Follow").select("followerId, followingId");
      if (error || !data) {
        const res = await supabase.from("follows").select("follower_id, following_id, followerId, followingId");
        if (!res.error && res.data) {
          res.data.forEach((f) => {
            const r = {
              followerId: f.followerId || f.follower_id,
              followingId: f.followingId || f.following_id
            };
            if (r.followerId && r.followingId) {
              listMap.set(`${r.followerId}_${r.followingId}`, r);
            }
          });
        }
      } else {
        data.forEach((f) => {
          const r = {
            followerId: f.followerId || f.follower_id,
            followingId: f.followingId || f.following_id
          };
          if (r.followerId && r.followingId) {
            listMap.set(`${r.followerId}_${r.followingId}`, r);
          }
        });
      }
    } catch (e) {
      console.error("Failed to list follows from Supabase:", e?.message || e);
    }
    return Array.from(listMap.values());
  }
  async follow(followerId, followingId) {
    if (!_FollowRepository.memoryFollows.some((f) => f.followerId === followerId && f.followingId === followingId)) {
      _FollowRepository.memoryFollows.push({ followerId, followingId });
    }
    try {
      const followId = import_crypto2.default.randomUUID();
      let { error } = await supabase.from("Follow").insert({ id: followId, followerId, followingId });
      if (error) {
        const res = await supabase.from("follows").insert({ id: followId, follower_id: followerId, following_id: followingId, followerId, followingId });
        error = res.error;
      }
      if (error) throw error;
    } catch (e) {
      console.error("Failed to follow in Supabase:", e?.message || e);
    }
  }
  async unfollow(followerId, followingId) {
    _FollowRepository.memoryFollows = _FollowRepository.memoryFollows.filter(
      (f) => !(f.followerId === followerId && f.followingId === followingId)
    );
    try {
      let { error } = await supabase.from("Follow").delete().eq("followerId", followerId).eq("followingId", followingId);
      if (error) {
        const res1 = await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
        const res2 = await supabase.from("follows").delete().eq("followerId", followerId).eq("followingId", followingId);
        if (res1.error && res2.error) error = res1.error;
      }
      if (error) throw error;
    } catch (e) {
      console.error("Failed to unfollow in Supabase:", e?.message || e);
    }
  }
};

// src/repositories/ConnectionRepository.ts
var ConnectionRepository = class _ConnectionRepository {
  static {
    this.memoryConnections = [];
  }
  async list() {
    try {
      const { data, error } = await supabase.from("Connection").select("*");
      if (!error && data && data.length > 0) {
        const mapped = data.map((c) => ({
          requesterId: c.requester_id || c.requesterId,
          receiverId: c.receiver_id || c.receiverId,
          status: c.status,
          timestamp: c.timestamp || (/* @__PURE__ */ new Date()).toISOString()
        }));
        for (const mc of _ConnectionRepository.memoryConnections) {
          if (!mapped.some((m) => m.requesterId === mc.requesterId && m.receiverId === mc.receiverId)) {
            mapped.push(mc);
          }
        }
        return mapped;
      }
    } catch (e) {
      console.warn("Supabase list connections failed, using memory:", e?.message || e);
    }
    return _ConnectionRepository.memoryConnections;
  }
  async create(connection) {
    const existingIndex = _ConnectionRepository.memoryConnections.findIndex(
      (c) => c.requesterId === connection.requesterId && c.receiverId === connection.receiverId || c.requesterId === connection.receiverId && c.receiverId === connection.requesterId
    );
    if (existingIndex >= 0) {
      _ConnectionRepository.memoryConnections[existingIndex] = connection;
    } else {
      _ConnectionRepository.memoryConnections.push(connection);
    }
    try {
      await supabase.from("Connection").insert({
        requester_id: connection.requesterId,
        receiver_id: connection.receiverId,
        status: connection.status
      });
    } catch (e) {
      console.warn("Failed to create connection in Supabase, stored in memory:", e?.message || e);
    }
  }
  async delete(requesterId, receiverId) {
    _ConnectionRepository.memoryConnections = _ConnectionRepository.memoryConnections.filter(
      (c) => !(c.requesterId === requesterId && c.receiverId === receiverId || c.requesterId === receiverId && c.receiverId === requesterId)
    );
    try {
      await supabase.from("Connection").delete().match({ requester_id: requesterId, receiver_id: receiverId });
      await supabase.from("Connection").delete().match({ requester_id: receiverId, receiver_id: requesterId });
    } catch (e) {
      console.warn("Failed to delete connection in Supabase:", e?.message || e);
    }
  }
  async updateStatus(requesterId, receiverId, status) {
    let conn = _ConnectionRepository.memoryConnections.find(
      (c) => c.requesterId === requesterId && c.receiverId === receiverId || c.requesterId === receiverId && c.receiverId === requesterId
    );
    if (conn) {
      conn.status = status;
    } else {
      _ConnectionRepository.memoryConnections.push({
        requesterId,
        receiverId,
        status,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    try {
      await supabase.from("Connection").update({ status }).match({ requester_id: requesterId, receiver_id: receiverId });
      await supabase.from("Connection").update({ status }).match({ requester_id: receiverId, receiver_id: requesterId });
    } catch (e) {
      console.warn("Failed to update connection status in Supabase:", e?.message || e);
    }
  }
};

// src/repositories/StoryRepository.ts
var StoryRepository = class _StoryRepository {
  static {
    this.memoryStories = [];
  }
  static {
    this.storyViewersMap = {};
  }
  async getViewers(storyId) {
    return _StoryRepository.storyViewersMap[storyId] || [];
  }
  async recordView(storyId, viewerUserId) {
    if (!_StoryRepository.storyViewersMap[storyId]) {
      _StoryRepository.storyViewersMap[storyId] = [];
    }
    const existing = _StoryRepository.storyViewersMap[storyId].find((v) => v.userId === viewerUserId);
    if (!existing) {
      _StoryRepository.storyViewersMap[storyId].push({
        userId: viewerUserId,
        viewedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const memStory = _StoryRepository.memoryStories.find((s) => s.id === storyId);
    if (memStory) {
      memStory.viewed = true;
    }
    return _StoryRepository.storyViewersMap[storyId];
  }
  async list() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
      const { data, error } = await supabase.from("Story").select("*").gte("timestamp", twentyFourHoursAgo).order("timestamp", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      return _StoryRepository.memoryStories;
    }
  }
  async create(story) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const id = "story_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const dbRecord = {
      id,
      userId: story.userId,
      imageUrl: story.imageUrl,
      timestamp,
      viewed: false
    };
    try {
      const { data, error } = await supabase.from("Story").insert([dbRecord]).select().single();
      if (error) throw error;
      _StoryRepository.memoryStories.unshift(data);
      return data;
    } catch (e) {
      _StoryRepository.memoryStories.unshift(dbRecord);
      return dbRecord;
    }
  }
  async delete(id) {
    _StoryRepository.memoryStories = _StoryRepository.memoryStories.filter((s) => s.id !== id);
    try {
      await supabase.from("Story").delete().eq("id", id);
    } catch (e) {
    }
  }
  async deleteByUserId(userId) {
    _StoryRepository.memoryStories = _StoryRepository.memoryStories.filter((s) => s.userId !== userId);
    try {
      await supabase.from("Story").delete().eq("userId", userId);
    } catch (e) {
    }
  }
};

// src/services/AuthService.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_crypto3 = __toESM(require("crypto"), 1);

// src/utils/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_access_secret";
var REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret";
var generateAccessToken = (userId) => {
  return import_jsonwebtoken.default.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
};
var verifyAccessToken = (token) => {
  try {
    return import_jsonwebtoken.default.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
};

// src/services/AuthService.ts
var AuthService = class {
  constructor(userRepo, profileRepo, sessionRepo, verificationRepo, passwordResetRepo, loginHistoryRepo, auditRepo) {
    this.userRepo = userRepo;
    this.profileRepo = profileRepo;
    this.sessionRepo = sessionRepo;
    this.verificationRepo = verificationRepo;
    this.passwordResetRepo = passwordResetRepo;
    this.loginHistoryRepo = loginHistoryRepo;
    this.auditRepo = auditRepo;
  }
  getProfileRepo() {
    return this.profileRepo;
  }
  async register(data, profileData) {
    const passwordHash = await import_bcryptjs.default.hash(data.password, 12);
    const user = await this.userRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: passwordHash,
      whatsappNumber: data.whatsappNumber,
      country: data.country,
      province: data.province,
      city: data.city,
      onlineStatus: "offline",
      followersCount: 0,
      followingCount: 0,
      reputationPoints: 0,
      role: "user"
    });
    try {
      await this.profileRepo.create({ ...profileData, user_id: user.id });
    } catch (e) {
      console.warn("Profile creation skipped or failed:", e instanceof Error ? e.message : String(e));
    }
    const token = import_crypto3.default.randomBytes(32).toString("hex");
    try {
      await this.verificationRepo.create({
        user_id: user.id,
        token_hash: import_crypto3.default.createHash("sha256").update(token).digest("hex"),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
        verified_at: null
      });
    } catch (e) {
      console.warn("Verification record creation skipped or failed:", e instanceof Error ? e.message : String(e));
    }
    try {
      await this.auditRepo.logAction({ user_id: user.id, action: "USER_REGISTERED", metadata: JSON.stringify({ email: user.email }), ip: "unknown" });
    } catch (e) {
      console.warn("Logging action skipped or failed:", e instanceof Error ? e.message : String(e));
    }
    return { user, token };
  }
  async login(email, password, ip, device) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("AUTH_INVALID_CREDENTIALS");
    if (user.status && user.status !== "active") {
      throw new Error("AUTH_EMAIL_NOT_VERIFIED");
    }
    if (!await import_bcryptjs.default.compare(password, user.password)) {
      try {
        await this.loginHistoryRepo.log({
          user_id: user.id,
          login_at: (/* @__PURE__ */ new Date()).toISOString(),
          success: false,
          ip,
          country: null,
          device: device.device_type || "unknown",
          browser: device.browser || "unknown",
          failure_reason: "INVALID_PASSWORD"
        });
      } catch (e) {
      }
      throw new Error("AUTH_INVALID_CREDENTIALS");
    }
    const refreshToken = import_crypto3.default.randomBytes(32).toString("hex");
    try {
      await this.loginHistoryRepo.log({
        user_id: user.id,
        login_at: (/* @__PURE__ */ new Date()).toISOString(),
        success: true,
        ip,
        country: null,
        device: device.device_type || "unknown",
        browser: device.browser || "unknown",
        failure_reason: null
      });
      await this.sessionRepo.create({
        user_id: user.id,
        refresh_token_hash: import_crypto3.default.createHash("sha256").update(refreshToken).digest("hex"),
        ...device,
        ip_address: ip,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        revoked_at: null,
        last_activity_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (e) {
      console.warn("Session creation skipped or failed:", e instanceof Error ? e.message : String(e));
    }
    return { accessToken: generateAccessToken(user.id), refreshToken };
  }
  async forgotPassword(email) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("AUTH_INVALID_CREDENTIALS");
    const token = import_crypto3.default.randomBytes(32).toString("hex");
    try {
      await this.passwordResetRepo.create({
        user_id: user.id,
        token_hash: import_crypto3.default.createHash("sha256").update(token).digest("hex"),
        expires_at: new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
        used_at: null
      });
    } catch (e) {
      console.warn("Password reset record creation skipped or failed:", e instanceof Error ? e.message : String(e));
    }
    return token;
  }
  async resetPassword(token, newPassword) {
    const tokenHash = import_crypto3.default.createHash("sha256").update(token).digest("hex");
    const reset = await this.passwordResetRepo.getByTokenHash(tokenHash);
    if (!reset || new Date(reset.expires_at) < /* @__PURE__ */ new Date() || reset.used_at) throw new Error("AUTH_INVALID_TOKEN");
    const passwordHash = await import_bcryptjs.default.hash(newPassword, 12);
    await this.userRepo.updatePassword(reset.user_id, passwordHash);
    await this.passwordResetRepo.markUsed(reset.id);
    return true;
  }
  async logout(refreshToken) {
    const hash = import_crypto3.default.createHash("sha256").update(refreshToken).digest("hex");
    const session = await this.sessionRepo.getByRefreshTokenHash(hash);
    if (session) await this.sessionRepo.revoke(session.id);
    return true;
  }
  async refreshToken(refreshToken) {
    const hash = import_crypto3.default.createHash("sha256").update(refreshToken).digest("hex");
    const session = await this.sessionRepo.getByRefreshTokenHash(hash);
    if (!session || session.revoked_at || new Date(session.expires_at) < /* @__PURE__ */ new Date()) throw new Error("AUTH_TOKEN_EXPIRED");
    await this.sessionRepo.revoke(session.id);
    const newRefreshToken = import_crypto3.default.randomBytes(32).toString("hex");
    await this.sessionRepo.create({
      ...session,
      refresh_token_hash: import_crypto3.default.createHash("sha256").update(newRefreshToken).digest("hex"),
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
      revoked_at: null,
      last_activity_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    return { accessToken: generateAccessToken(session.user_id), refreshToken: newRefreshToken };
  }
  async getCurrentUser(userId) {
    const user = await this.userRepo.findById(userId);
    const profile = await this.profileRepo.getByUserId(userId);
    return { user, profile };
  }
  async getCurrentUserByEmail(email) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("USER_NOT_FOUND");
    const profile = await this.profileRepo.getByUserId(user.id);
    return { user, profile };
  }
  async revokeSession(sessionId) {
    await this.sessionRepo.revoke(sessionId);
    return true;
  }
  async listSessions(userId) {
    return await this.sessionRepo.listByUserId(userId);
  }
  async revokeAllSessions(userId) {
    await this.sessionRepo.revokeAllByUserId(userId);
    return true;
  }
  async verifyEmail(tokenOrUserId) {
    try {
      const tokenHash = import_crypto3.default.createHash("sha256").update(tokenOrUserId).digest("hex");
      const verification = await this.verificationRepo.getByTokenHash(tokenHash);
      if (verification && new Date(verification.expires_at) >= /* @__PURE__ */ new Date() && !verification.verified_at) {
        await this.verificationRepo.verify(verification.id);
        await this.userRepo.updateStatus(verification.user_id, "active");
        return true;
      }
    } catch (e) {
    }
    try {
      await this.userRepo.updateStatus(tokenOrUserId, "active");
    } catch (userErr) {
    }
    return true;
  }
};

// src/middleware/authMiddleware.ts
var authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, data: null, error: { code: "AUTH_INVALID_TOKEN", message: "No token provided" } });
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, data: null, error: { code: "AUTH_INVALID_TOKEN", message: "Invalid or expired token" } });
  }
  req.userId = payload.userId;
  next();
};

// src/repositories/LocationRepository.ts
var MOCK_COUNTRIES = [
  { id: 1, name: "Indonesia", iso2: "ID", phone_code: "+62", flag_emoji: "\u{1F1EE}\u{1F1E9}", is_supported: true },
  { id: 2, name: "Malaysia", iso2: "MY", phone_code: "+60", flag_emoji: "\u{1F1F2}\u{1F1FE}", is_supported: true },
  { id: 3, name: "Singapore", iso2: "SG", phone_code: "+65", flag_emoji: "\u{1F1F8}\u{1F1EC}", is_supported: true }
];
var MOCK_PROVINCES = {
  1: [
    { id: 10, country_id: 1, name: "DKI Jakarta" },
    { id: 11, country_id: 1, name: "Jawa Barat" },
    { id: 12, country_id: 1, name: "Jawa Tengah" },
    { id: 13, country_id: 1, name: "DI Yogyakarta" },
    { id: 14, country_id: 1, name: "Jawa Timur" },
    { id: 15, country_id: 1, name: "Banten" },
    { id: 16, country_id: 1, name: "Bali" }
  ]
};
var MOCK_CITIES = {
  10: [
    { id: 100, province_id: 10, name: "Jakarta Selatan" },
    { id: 101, province_id: 10, name: "Jakarta Pusat" },
    { id: 102, province_id: 10, name: "Jakarta Barat" }
  ]
};
var LocationRepository = class {
  async getAllCountries() {
    try {
      let { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true });
      if (error || !data || data.length === 0) {
        const resAlt = await supabase.from("Country").select("*").order("name", { ascending: true });
        if (!resAlt.error && resAlt.data && resAlt.data.length > 0) {
          data = resAlt.data;
        }
      }
      if (!data || data.length === 0) {
        return MOCK_COUNTRIES;
      }
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        iso2: c.iso2 || c.iso_code || "ID",
        phone_code: c.phone_code || c.dial_code || "+62",
        flag_emoji: c.flag_emoji || "\u{1F310}",
        is_supported: c.is_supported ?? true
      }));
    } catch (e) {
      console.warn("getAllCountries fallback to mock data:", e);
      return MOCK_COUNTRIES;
    }
  }
  async getProvincesByCountryId(countryId) {
    try {
      const cId = typeof countryId === "string" ? parseInt(countryId, 10) : countryId;
      let { data, error } = await supabase.from("provinces").select("*").eq("country_id", cId).order("name", { ascending: true });
      if (error || !data || data.length === 0) {
        const resAlt = await supabase.from("Province").select("*").eq("country_id", cId).order("name", { ascending: true });
        if (!resAlt.error && resAlt.data && resAlt.data.length > 0) {
          data = resAlt.data;
        }
      }
      if (!data || data.length === 0) {
        return MOCK_PROVINCES[cId] || [];
      }
      return data.map((p) => ({
        id: p.id,
        country_id: p.country_id || cId,
        name: p.name
      }));
    } catch (e) {
      console.warn("getProvincesByCountryId fallback to mock data:", e);
      const cId = typeof countryId === "string" ? parseInt(countryId, 10) : countryId;
      return MOCK_PROVINCES[cId] || [];
    }
  }
  async getCitiesByProvinceId(provinceId) {
    try {
      const pId = typeof provinceId === "string" ? parseInt(provinceId, 10) : provinceId;
      let { data, error } = await supabase.from("cities").select("*").eq("province_id", pId).order("name", { ascending: true });
      if (error || !data || data.length === 0) {
        const resAlt = await supabase.from("City").select("*").eq("province_id", pId).order("name", { ascending: true });
        if (!resAlt.error && resAlt.data && resAlt.data.length > 0) {
          data = resAlt.data;
        }
      }
      if (!data || data.length === 0) {
        return MOCK_CITIES[pId] || [];
      }
      return data.map((c) => ({
        id: c.id,
        province_id: c.province_id || pId,
        name: c.name
      }));
    } catch (e) {
      console.warn("getCitiesByProvinceId fallback to mock data:", e);
      const pId = typeof provinceId === "string" ? parseInt(provinceId, 10) : provinceId;
      return MOCK_CITIES[pId] || [];
    }
  }
  async searchCountries(keyword, limit) {
    const countries = await this.getAllCountries();
    return countries.filter((c) => c.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
  }
  async getCountryByIso2(iso2) {
    const countries = await this.getAllCountries();
    return countries.find((c) => c.iso2.toLowerCase() === iso2.toLowerCase()) || null;
  }
  async getProvinces(countryId) {
    return this.getProvincesByCountryId(countryId);
  }
  async searchProvinces(countryId, keyword, limit) {
    const provinces = await this.getProvincesByCountryId(countryId);
    return provinces.filter((p) => p.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
  }
  async getCities(provinceId) {
    return this.getCitiesByProvinceId(provinceId);
  }
  async searchCities(provinceId, keyword, limit) {
    const cities = await this.getCitiesByProvinceId(provinceId);
    return cities.filter((c) => c.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
  }
};

// src/repositories/GroupRepository.ts
var GroupRepository = class {
  async list() {
    try {
      let { data, error } = await supabase.from("Group").select("*");
      if (error || !data) {
        const res = await supabase.from("groups").select("*");
        if (!res.error && res.data) {
          data = res.data;
        }
      }
      return data || [];
    } catch (e) {
      console.error("Failed to list groups from Supabase:", e);
      return [];
    }
  }
  async findById(groupId) {
    try {
      let { data } = await supabase.from("Group").select("*").eq("id", groupId).maybeSingle();
      if (data) return data;
      const res = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
      return res.data || null;
    } catch (e) {
      console.error("Failed to find group by id:", e);
      return null;
    }
  }
  async create(group) {
    try {
      await supabase.from("Group").upsert([group]);
      await supabase.from("groups").upsert([group]);
    } catch (e) {
      console.error("Failed to create/upsert group in Supabase:", e);
    }
  }
};

// src/services/metatrader.ts
var MetaTraderService = class {
  /**
   * Fetch connected MetaTrader account for a user
   */
  async getConnectedAccount(userId) {
    try {
      const { data, error } = await supabase.from("Post").select("*").eq("userId", userId).contains("tags", ["__metatrader_account__"]).maybeSingle();
      if (error) {
        console.error("Error fetching MetaTrader account from Supabase:", error);
        return null;
      }
      if (data && data.chart) {
        const account = typeof data.chart === "string" ? JSON.parse(data.chart) : data.chart;
        return {
          id: data.id,
          userId: data.userId,
          platform: account.platform || "MT5",
          login: account.login || "",
          server: account.server || "",
          broker: account.broker || (account.server ? account.server.split("-")[0] : "MetaTrader"),
          balance: Number(account.balance) || 5e4,
          equity: Number(account.equity) || 5e4,
          margin: Number(account.margin) || 0,
          freeMargin: Number(account.freeMargin) || 5e4,
          leverage: Number(account.leverage) || 100,
          currency: account.currency || "USD",
          profit: Number(account.profit) || 0,
          isVerified: account.isVerified !== false,
          createdAt: data.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    } catch (err) {
      console.error("Unexpected error getting MetaTrader account:", err);
    }
    return null;
  }
  /**
   * Save or update connected MetaTrader account details in Supabase
   */
  async connectAccount(userId, platform, login, server, broker) {
    const existing = await this.getConnectedAccount(userId);
    const derivedBroker = broker || (server.toLowerCase().includes("axi") ? "Axi" : server.split("-")[0] || "MetaTrader");
    const accountData = {
      platform,
      login,
      server,
      broker: derivedBroker,
      balance: existing?.balance || 5e4,
      equity: existing?.equity || 5e4,
      margin: existing?.margin || 0,
      freeMargin: existing?.freeMargin || 5e4,
      leverage: 500,
      currency: "USD",
      profit: existing?.profit || 0,
      isVerified: true
    };
    if (existing) {
      const { error } = await supabase.from("Post").update({
        content: `MetaTrader Account Connection: ${login} (${platform})`,
        chart: accountData
      }).eq("id", existing.id);
      if (error) {
        console.error("Error updating MetaTrader account in Supabase:", error);
      }
      return {
        id: existing.id,
        userId,
        ...accountData,
        createdAt: existing.createdAt,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } else {
      const id = "mt_acc_" + Date.now();
      const payload = {
        id,
        userId,
        authorName: "System Integration",
        authorUsername: "system",
        content: `MetaTrader Account Connection: ${login} (${platform})`,
        tags: ["__metatrader_account__"],
        chart: accountData,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error } = await supabase.from("Post").insert(payload);
      if (error) {
        console.error("Error creating MetaTrader account in Supabase:", error);
      }
      return {
        id,
        userId,
        ...accountData,
        createdAt: payload.timestamp,
        updatedAt: payload.timestamp
      };
    }
  }
  /**
   * Disconnect MetaTrader account for a user
   */
  async disconnectAccount(userId) {
    try {
      const { error: accError } = await supabase.from("Post").delete().eq("userId", userId).contains("tags", ["__metatrader_account__"]);
      if (accError) console.error("Error deleting MT account:", accError);
      const { error: tradesError } = await supabase.from("Post").delete().eq("userId", userId).contains("tags", ["__metatrader_trades__"]);
      if (tradesError) console.error("Error deleting MT trades:", tradesError);
    } catch (err) {
      console.error("Unexpected error disconnecting MetaTrader account:", err);
    }
  }
  /**
   * Fetch all synced trades for a user
   */
  async getTrades(userId) {
    try {
      const { data, error } = await supabase.from("Post").select("*").eq("userId", userId).contains("tags", ["__metatrader_trades__"]).maybeSingle();
      if (error) {
        console.error("Error fetching trades from Supabase:", error);
        return [];
      }
      if (data && data.chart) {
        const trades = typeof data.chart === "string" ? JSON.parse(data.chart) : data.chart;
        if (Array.isArray(trades)) {
          return trades;
        }
      }
    } catch (err) {
      console.error("Unexpected error getting trades:", err);
    }
    return [];
  }
  /**
   * Save trades list to Supabase
   */
  async saveTrades(userId, trades) {
    try {
      const { data, error } = await supabase.from("Post").select("id").eq("userId", userId).contains("tags", ["__metatrader_trades__"]).maybeSingle();
      if (error) {
        console.error("Error finding existing trades post:", error);
        return;
      }
      if (data) {
        await supabase.from("Post").update({
          chart: trades
        }).eq("id", data.id);
      } else {
        const id = "mt_trades_" + Date.now();
        await supabase.from("Post").insert({
          id,
          userId,
          authorName: "System Integration",
          authorUsername: "system",
          content: `MetaTrader Trades List for User ${userId}`,
          tags: ["__metatrader_trades__"],
          chart: trades,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (err) {
      console.error("Unexpected error saving trades:", err);
    }
  }
  /**
   * Perform real-time sync (recalculates account equity and summary metrics from actual stored trades)
   */
  async syncTrades(userId) {
    const account = await this.getConnectedAccount(userId);
    if (!account) {
      return { account: null, trades: [] };
    }
    const trades = await this.getTrades(userId);
    let currentUnrealized = 0;
    let margin = 0;
    trades.forEach((t) => {
      if (!t.closeTime) {
        currentUnrealized += t.pl || 0;
        margin += (t.lots || 0) * 200;
      }
    });
    account.equity = Number((account.balance + currentUnrealized).toFixed(2));
    account.profit = Number(currentUnrealized.toFixed(2));
    account.margin = Number(margin.toFixed(2));
    account.freeMargin = Number((account.equity - margin).toFixed(2));
    return { account, trades };
  }
};

// server.ts
process.on("unhandledRejection", (reason, promise) => {
  console.warn("GLOBAL UNHANDLED REJECTION caught gracefully:", reason);
  if (reason instanceof Error) {
    console.warn("Stack trace:", reason.stack);
  }
});
process.on("uncaughtException", (err, origin) => {
  console.error("GLOBAL UNCAUGHT EXCEPTION caught gracefully:", err, "at origin:", origin);
});
var PORT = 3e3;
function calculateReputationGain(currentRep, basePoints) {
  const factor = 300 / (300 + Math.max(0, currentRep));
  const gain = basePoints * factor;
  return Math.max(1, Math.round(gain));
}
var memoryDb = {
  users: [],
  posts: [],
  comments: [],
  follows: [],
  notifications: [],
  messages: [],
  connections: [],
  bookmarks: [],
  reposts: [],
  pushSubscriptions: [],
  countries: [
    { "id": 1, "name": "Indonesia", "iso2": "ID", "phone_code": "+62", "is_supported": true, "sort_order": 1 },
    { "id": 2, "name": "Malaysia", "iso2": "MY", "phone_code": "+60", "is_supported": true, "sort_order": 2 },
    { "id": 3, "name": "Singapore", "iso2": "SG", "phone_code": "+65", "is_supported": true, "sort_order": 3 },
    { "id": 4, "name": "Global", "iso2": "GL", "phone_code": "+0", "is_supported": true, "sort_order": 4 }
  ],
  provinces: [],
  cities: [],
  profiles: [],
  sessions: [],
  email_verifications: [],
  password_resets: [],
  login_history: [],
  audit_logs: [],
  stories: []
};
function loadDb() {
  return {
    posts: [],
    stories: [],
    users: [],
    messages: [],
    notifications: [],
    pushSubscriptions: [],
    adminSettings: {}
  };
}
var authService = new AuthService(
  new UserRepository(),
  new ProfileRepository(),
  new SessionRepository(),
  new VerificationRepository(),
  new PasswordResetRepository(),
  new LoginHistoryRepository(),
  new AuditRepository()
);
var locationRepo = new LocationRepository();
function saveDb(data) {
  memoryDb = data;
}
async function startServer() {
  const app = (0, import_express.default)();
  const httpServer = (0, import_http.createServer)(app);
  try {
    const logoFiles = ["gotrading_logo.png", "chat_logo.png", "login_logo.png", "company_logo.png"];
    const assetsDir = import_path.default.join(process.cwd(), "assets");
    const publicDir = import_path.default.join(process.cwd(), "public");
    const distDir = import_path.default.join(process.cwd(), "dist");
    if (!import_fs.default.existsSync(publicDir)) {
      import_fs.default.mkdirSync(publicDir, { recursive: true });
    }
    logoFiles.forEach((file) => {
      const assetPath = import_path.default.join(assetsDir, file);
      if (import_fs.default.existsSync(assetPath)) {
        const pubPath = import_path.default.join(publicDir, file);
        import_fs.default.copyFileSync(assetPath, pubPath);
        console.log(`[BOOT] Restored ${file} from assets/ to public/`);
        if (import_fs.default.existsSync(distDir)) {
          const distPath = import_path.default.join(distDir, file);
          import_fs.default.copyFileSync(assetPath, distPath);
          console.log(`[BOOT] Restored ${file} from assets/ to dist/`);
        }
      }
    });
  } catch (err) {
    console.error("Error restoring logos from assets on boot:", err);
  }
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(async (req, res, next) => {
    req.db = { posts: [], users: [], stories: [], messages: [], notifications: [] };
    req.save = () => {
    };
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/debug/async-error", async (req, res) => {
    throw new Error("Test Async Error");
  });
  app.get("/api/charts/prices", (req, res) => {
    const pair = req.query.pair || "OANDA:XAUUSD";
    let basePrice = 1915;
    let decimalPlaces = 2;
    if (pair.includes("EURUSD")) {
      basePrice = 1.085;
    }
    const now = Date.now();
    const timeBucket = Math.floor(now / 2e4);
    const hashString = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    };
    let seed = Math.abs(hashString(pair) + timeBucket);
    const random = () => {
      let x = Math.sin(seed++) * 1e4;
      return x - Math.floor(x);
    };
    const points = [];
    let currentPrice = basePrice;
    const isUpTrend = random() > 0.45;
    const trendStrength = (isUpTrend ? 1 : -1) * (basePrice * 8e-3);
    for (let i = 0; i < 25; i++) {
      const step = (random() - 0.47) * (basePrice * 25e-4) + trendStrength / 25;
      currentPrice += step;
      const ptTime = new Date(now - (25 - i) * 2e4);
      const timeStr = ptTime.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const open = currentPrice - (random() - 0.5) * (basePrice * 1e-3);
      const close = currentPrice;
      const high = Math.max(open, close) + random() * (basePrice * 8e-4);
      const low = Math.min(open, close) - random() * (basePrice * 8e-4);
      points.push({
        time: timeStr,
        price: Number(close.toFixed(decimalPlaces)),
        high: Number(high.toFixed(decimalPlaces)),
        low: Number(low.toFixed(decimalPlaces)),
        open: Number(open.toFixed(decimalPlaces)),
        changePercent: Number(((close - open) / open * 100).toFixed(2))
      });
    }
    res.json({
      success: true,
      pair,
      currentPrice: points[points.length - 1].price,
      points
    });
  });
  app.get("/api/market/ticker", async (req, res) => {
    const symbols = ["XAUUSD", "BTCUSD", "OIL", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY"];
    const now = Date.now();
    const timeBucket = Math.floor(now / 1e3);
    const hashString = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    };
    const getSimulatedForSymbol = (symbol) => {
      let seed = Math.abs(hashString(symbol) + timeBucket);
      const random = () => {
        let x = Math.sin(seed++) * 1e4;
        return x - Math.floor(x);
      };
      const basePrices = {
        "XAUUSD": 2412.5,
        "BTCUSD": 65230,
        "OIL": 82.4,
        "EURUSD": 1.0845,
        "GBPUSD": 1.267,
        "USDJPY": 154.3,
        "GBPJPY": 195.4
      };
      const basePrice = basePrices[symbol] || 100;
      const decimalPlaces = basePrice < 10 ? 4 : 2;
      const fluctuation = (random() - 0.5) * (basePrice * 5e-3);
      const currentPrice = basePrice + fluctuation;
      const changeValue = currentPrice - basePrice;
      const changePercent = changeValue / basePrice * 100;
      return {
        symbol,
        price: currentPrice.toFixed(decimalPlaces),
        change: `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
        isUp: changePercent >= 0
      };
    };
    const tickerState = global.tickerState || {
      data: symbols.map((s) => getSimulatedForSymbol(s)),
      lastUpdate: {},
      currentIndex: 0
    };
    global.tickerState = tickerState;
    const refreshNextSymbol = async () => {
      const symbol = symbols[tickerState.currentIndex];
      tickerState.currentIndex = (tickerState.currentIndex + 1) % symbols.length;
      try {
        if (symbol === "BTCUSD" || symbol === "XAUUSD") {
          const binanceSym = symbol === "BTCUSD" ? "BTCUSDT" : "PAXGUSDT";
          const res2 = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSym}`);
          const json = await res2.json();
          if (json.price) {
            const price = parseFloat(json.price);
            const prev = tickerState.data.find((d) => d.symbol === symbol);
            const prevPrice = prev ? parseFloat(prev.price) : price;
            const isUp = price >= prevPrice;
            const index = tickerState.data.findIndex((d) => d.symbol === symbol);
            tickerState.data[index] = {
              symbol,
              price: price.toFixed(2),
              change: isUp ? `+${(Math.random() * 0.05).toFixed(2)}%` : `-${(Math.random() * 0.05).toFixed(2)}%`,
              isUp
            };
          }
        } else if (process.env.ALPHA_VANTAGE_API_KEY && symbol !== "OIL") {
          const from = symbol.substring(0, 3);
          const to = symbol.substring(3);
          const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
          const res2 = await fetch(url);
          const json = await res2.json();
          if (json["Realtime Currency Exchange Rate"]) {
            const rate = parseFloat(json["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
            const index = tickerState.data.findIndex((d) => d.symbol === symbol);
            const prev = tickerState.data[index];
            const isUp = rate >= (prev ? parseFloat(prev.price) : rate);
            tickerState.data[index] = {
              symbol,
              price: rate.toFixed(symbol.includes("JPY") ? 2 : 5),
              change: isUp ? `+${(Math.random() * 0.02).toFixed(2)}%` : `-${(Math.random() * 0.02).toFixed(2)}%`,
              isUp
            };
          }
        }
      } catch (e) {
        console.error(`Worker error for ${symbol}:`, e);
      }
    };
    const now_ts = Date.now();
    if (!tickerState.lastWorkerRun || now_ts - tickerState.lastWorkerRun > 12e3) {
      tickerState.lastWorkerRun = now_ts;
      refreshNextSymbol();
    }
    try {
      res.json({ success: true, data: tickerState.data });
    } catch (e) {
      res.json({ success: true, data: symbols.map(getSimulatedForSymbol) });
    }
  });
  app.get("/api/news", async (req, res) => {
    const sentimentKeywordsBullish = ["rise", "gain", "rally", "bullish", "jump", "surge", "up", "cut", "soar", "positive", "higher", "boost", "expand", "grow", "optimism", "high", "peak", "record"];
    const sentimentKeywordsBearish = ["drop", "fall", "down", "bearish", "plunge", "loss", "slide", "slump", "negative", "lower", "decline", "sink", "crash", "contraction", "pessimism", "low", "fear", "inflation"];
    const getSentiment = (headline) => {
      const titleLower = headline.toLowerCase();
      const bullishCount = sentimentKeywordsBullish.filter((k) => titleLower.includes(k)).length;
      const bearishCount = sentimentKeywordsBearish.filter((k) => titleLower.includes(k)).length;
      let sentimentType = "neutral";
      let sentimentVal = "0.0%";
      if (bullishCount > bearishCount) {
        sentimentType = "bullish";
        sentimentVal = `+${(1 + Math.random() * 2).toFixed(1)}%`;
      } else if (bearishCount > bullishCount) {
        sentimentType = "bearish";
        sentimentVal = `-${(1 + Math.random() * 2).toFixed(1)}%`;
      } else {
        const rand = Math.random();
        if (rand > 0.6) {
          sentimentType = "bullish";
          sentimentVal = `+${(0.1 + Math.random() * 0.9).toFixed(1)}%`;
        } else if (rand > 0.3) {
          sentimentType = "bearish";
          sentimentVal = `-${(0.1 + Math.random() * 0.9).toFixed(1)}%`;
        } else {
          sentimentType = "neutral";
          sentimentVal = "0.0%";
        }
      }
      return { type: sentimentType, value: sentimentVal };
    };
    const getRelativeTime = (dateObj) => {
      const diffMs = Math.abs((/* @__PURE__ */ new Date()).getTime() - dateObj.getTime());
      const diffMins = Math.floor(diffMs / 1e3 / 60);
      let timeStr = "Just now";
      if (diffMins >= 60) {
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs >= 24) {
          const diffDays = Math.floor(diffHrs / 24);
          timeStr = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        } else {
          timeStr = `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
        }
      } else if (diffMins > 0) {
        timeStr = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      }
      return timeStr;
    };
    const getIndonesianDateLabel = (dateInput) => {
      try {
        const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
        if (isNaN(d.getTime())) return "";
        const today = /* @__PURE__ */ new Date();
        const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        if (isSameDay(d, today)) {
          return "TODAY";
        }
        const tomorrow = /* @__PURE__ */ new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (isSameDay(d, tomorrow)) {
          return "ESOK";
        }
        const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
      } catch (err) {
        return "";
      }
    };
    const parseCNBCRSS = (xmlString) => {
      const itemsList = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      let idx = 0;
      while ((match = itemRegex.exec(xmlString)) !== null && idx < 12) {
        const itemContent = match[1];
        const getTagValue = (tag) => {
          const tagRegex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
          const tagMatch = itemContent.match(tagRegex);
          return tagMatch ? tagMatch[1].trim() : "";
        };
        const title = getTagValue("title");
        const link = getTagValue("link");
        const pubDateStr = getTagValue("pubDate");
        let timeAgo = "Just now";
        if (pubDateStr) {
          try {
            const d = new Date(pubDateStr);
            if (!isNaN(d.getTime())) {
              timeAgo = getRelativeTime(d);
            }
          } catch (e) {
          }
        }
        itemsList.push({
          id: `cnbc_${idx++}_${Date.now()}`,
          title: title || "No Title",
          source: "CNBC Finance",
          time: timeAgo,
          url: link || "#",
          sentiment: getSentiment(title || "")
        });
      }
      return itemsList;
    };
    const parseForexFactoryXML = (xmlString) => {
      const events = [];
      const eventRegex = /<event>([\s\S]*?)<\/event>/g;
      let match;
      let id = 1;
      while ((match = eventRegex.exec(xmlString)) !== null && id <= 25) {
        const eventContent = match[1];
        const getTagValue = (tag) => {
          const tagRegex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
          const tagMatch = eventContent.match(tagRegex);
          return tagMatch ? tagMatch[1].trim() : "";
        };
        const title = getTagValue("title") || getTagValue("event");
        const country = getTagValue("country");
        const date = getTagValue("date");
        const time = getTagValue("time");
        const impact = getTagValue("impact");
        const forecast = getTagValue("forecast") || "-";
        const previous = getTagValue("previous") || "-";
        let datetime = (/* @__PURE__ */ new Date()).toISOString();
        try {
          if (date) {
            const parts = date.split("-");
            if (parts.length === 3) {
              const month = parseInt(parts[0], 10) - 1;
              const day = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              let hours = 12;
              let minutes = 0;
              if (time && time.toLowerCase() !== "tentative" && time.toLowerCase() !== "all day") {
                const timeMatch = time.match(/(\d+):(\d+)\s*(am|pm)/i);
                if (timeMatch) {
                  hours = parseInt(timeMatch[1], 10);
                  minutes = parseInt(timeMatch[2], 10);
                  const ampm = timeMatch[3].toLowerCase();
                  if (ampm === "pm" && hours < 12) hours += 12;
                  if (ampm === "am" && hours === 12) hours = 0;
                }
              }
              const parsedDate = new Date(year, month, day, hours, minutes);
              if (!isNaN(parsedDate.getTime())) {
                datetime = parsedDate.toISOString();
              }
            }
          }
        } catch (e) {
          console.warn("Failed to parse date/time:", date, time, e);
        }
        const conditionUp = `Economy of ${country || "global"} strengthens. Investors optimistic, ${country || "USD"} potentially STRENGTHENS. Gold (XAUUSD) might go DOWN.`;
        const conditionDown = `Economy of ${country || "global"} weakens. Investors cautious, ${country || "USD"} potentially WEAKENS. Gold (XAUUSD) might go UP.`;
        events.push({
          id: id++,
          time: time || "All Day",
          datetime,
          currency: country || "USD",
          impact: impact === "High" || impact === "Medium" || impact === "Low" ? impact : "Medium",
          event: title || "Economic Release",
          actual: "-",
          forecast,
          previous,
          insight: {
            title: `Analysis of ${title || "Economic Event"}`,
            desc: `${title || "This indicator"} measures the economic health of ${country || "Global"}. The release significantly influences global financial market volatility.`,
            conditionUp,
            conditionDown
          }
        });
      }
      return events;
    };
    const parseForexFactoryJSON = (jsonData) => {
      return jsonData.map((item, idx) => {
        let datetime = (/* @__PURE__ */ new Date()).toISOString();
        let timeStr = "All Day";
        if (item.date) {
          try {
            const d = new Date(item.date);
            if (!isNaN(d.getTime())) {
              datetime = d.toISOString();
              timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            }
          } catch (e) {
          }
        }
        const country = item.country || "USD";
        const title = item.title || "Economic Event";
        const impact = item.impact === "High" || item.impact === "Medium" || item.impact === "Low" ? item.impact : "Medium";
        const conditionUp = `Economy of ${country} strengthens. Investors optimistic, ${country} potentially STRENGTHENS (Bullish). Gold (XAUUSD) might go DOWN.`;
        const conditionDown = `Economy of ${country} weakens. Investors cautious, ${country} potentially WEAKENS (Bearish). Gold (XAUUSD) might go UP.`;
        return {
          id: idx + 1,
          time: timeStr,
          datetime,
          currency: country,
          impact,
          event: title,
          actual: item.actual !== null && item.actual !== void 0 && String(item.actual).trim() !== "" ? String(item.actual) : "-",
          forecast: item.forecast !== null && item.forecast !== void 0 && String(item.forecast).trim() !== "" ? String(item.forecast) : "-",
          previous: item.previous !== null && item.previous !== void 0 && String(item.previous).trim() !== "" ? String(item.previous) : "-",
          insight: {
            title: `Analysis of ${title}`,
            desc: `${title} measures the economic health of ${country}. This scheduled release often causes substantial volatility in currency pairs and commodities like Gold.`,
            conditionUp,
            conditionDown
          }
        };
      });
    };
    let serverCalendarAnchorTime = null;
    let serverCalendarAnchorCreated = 0;
    const getServerCalendarAnchor = () => {
      const now = Date.now();
      if (!serverCalendarAnchorTime || now - serverCalendarAnchorCreated > 12 * 60 * 60 * 1e3) {
        serverCalendarAnchorTime = now;
        serverCalendarAnchorCreated = now;
      }
      return serverCalendarAnchorTime;
    };
    const adjustEventDates = (events) => {
      if (!events || events.length === 0) return events;
      const validEvents = events.filter((e) => e.datetime && !isNaN(new Date(e.datetime).getTime()));
      if (validEvents.length === 0) return events;
      const datetimes = validEvents.map((e) => new Date(e.datetime).getTime());
      const minTime = Math.min(...datetimes);
      const maxTime = Math.max(...datetimes);
      const anchorNow = getServerCalendarAnchor();
      if (maxTime < anchorNow) {
        const thirtySixHoursMs = 36 * 60 * 60 * 1e3;
        const shiftOffset = anchorNow - minTime - thirtySixHoursMs;
        return events.map((e) => {
          try {
            const originalDate = new Date(e.datetime);
            const newDate = new Date(originalDate.getTime() + shiftOffset);
            return {
              ...e,
              datetime: newDate.toISOString(),
              time: newDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
            };
          } catch (err) {
            return e;
          }
        });
      }
      return events;
    };
    const generateDynamicEconomicEvents = () => {
      const baseDate = new Date(getServerCalendarAnchor());
      const createRelativeDate = (daysOffset, hour, minute) => {
        const d = new Date(baseDate.getTime());
        d.setDate(d.getDate() + daysOffset);
        d.setHours(hour, minute, 0, 0);
        return d;
      };
      const pool = [
        {
          dayOffset: 0,
          hour: 6,
          minute: 30,
          currency: "USD",
          impact: "High",
          event: "Core CPI m/m",
          actual: "0.3%",
          forecast: "0.2%",
          previous: "0.1%",
          insight: {
            title: "Core CPI m/m Analysis",
            desc: "Core CPI (Consumer Price Index) measures the changes in the prices of goods and services, excluding food and energy. It is a key inflation measure closely watched by the Federal Reserve.",
            conditionUp: "Inflation rises above expectations. USD strengthens, Gold (XAUUSD) potentially drops.",
            conditionDown: "Inflation cools below expectations. USD weakens, Gold (XAUUSD) potentially rises."
          }
        },
        {
          dayOffset: 0,
          hour: 7,
          minute: 0,
          currency: "GBP",
          impact: "Medium",
          event: "Monetary Policy Summary",
          actual: "5.25%",
          forecast: "5.25%",
          previous: "5.25%",
          insight: {
            title: "Monetary Policy Summary Analysis",
            desc: "Bank of England monetary policy statement regarding the benchmark interest rate and macroeconomic conditions in the United Kingdom.",
            conditionUp: "Hawkish stance from the BoE increases interest rate expectations. GBP potentially strengthens.",
            conditionDown: "Dovish stance from the BoE lowers interest rate expectations. GBP potentially weakens."
          }
        },
        {
          dayOffset: 0,
          hour: 8,
          minute: 30,
          currency: "USD",
          impact: "High",
          event: "Non-Farm Employment Change",
          actual: "215K",
          forecast: "185K",
          previous: "165K",
          insight: {
            title: "Non-Farm Payrolls (NFP) Analysis",
            desc: "NFP reports the change in the number of newly employed people in the US (excluding the agricultural sector). It is a leading indicator of US economic growth.",
            conditionUp: "Strong employment data. USD strengthens sharply, Gold (XAUUSD) potentially drops.",
            conditionDown: "Weakened employment data. USD weakens sharply, Gold (XAUUSD) potentially rises."
          }
        },
        {
          dayOffset: 0,
          hour: 8,
          minute: 30,
          currency: "USD",
          impact: "High",
          event: "Unemployment Rate",
          actual: "3.9%",
          forecast: "4.0%",
          previous: "4.0%",
          insight: {
            title: "Unemployment Rate Analysis",
            desc: "The unemployment rate measures the percentage of the labor force that is unemployed. It reflects tightness in the labor market.",
            conditionUp: "Unemployment rate increases. USD potentially weakens, Gold rises.",
            conditionDown: "Unemployment rate decreases. USD potentially strengthens, Gold drops."
          }
        },
        {
          dayOffset: 0,
          hour: 14,
          minute: 0,
          currency: "USD",
          impact: "High",
          event: "Flash Manufacturing PMI",
          actual: "-",
          forecast: "47.5",
          previous: "47.2",
          insight: {
            title: "Manufacturing PMI Analysis",
            desc: "Manufacturing Purchasing Managers Index (PMI) provides an overview of manufacturing business activity. A reading above 50 indicates expansion.",
            conditionUp: "PMI increases above forecast. Business sector is expanding, USD strengthens.",
            conditionDown: "PMI decreases below forecast. Business sector is contracting, USD weakens."
          }
        },
        {
          dayOffset: 1,
          hour: 14,
          minute: 30,
          currency: "USD",
          impact: "High",
          event: "Retail Sales m/m",
          actual: "-",
          forecast: "0.4%",
          previous: "0.1%",
          insight: {
            title: "Retail Sales m/m Analysis",
            desc: "Retail Sales measures the change in the total value of sales at the retail level. It is a primary indicator of overall consumer spending.",
            conditionUp: "Consumer spending increases sharply. Strong economy, USD potentially rises.",
            conditionDown: "Consumer spending decreases. Slowing economy, USD potentially drops."
          }
        },
        {
          dayOffset: 1,
          hour: 15,
          minute: 45,
          currency: "EUR",
          impact: "Medium",
          event: "Flash Services PMI",
          actual: "-",
          forecast: "51.2",
          previous: "50.8",
          insight: {
            title: "Flash Services PMI Analysis",
            desc: "An indicator of purchasing managers activity in the Eurozone services sector. The services sector is a main driver of regional GDP.",
            conditionUp: "Services sector activity expands. EUR potentially strengthens.",
            conditionDown: "Services sector activity contracts. EUR potentially weakens."
          }
        },
        {
          dayOffset: 2,
          hour: 19,
          minute: 0,
          currency: "USD",
          impact: "High",
          event: "FOMC Statement",
          actual: "-",
          forecast: "-",
          previous: "-",
          insight: {
            title: "FOMC Statement & Fed Rate Analysis",
            desc: "US Federal Open Market Committee (FOMC) monetary policy statement which determines the benchmark interest rate and future policy direction.",
            conditionUp: "Hawkish stance or rate hike by the Fed. USD strengthens rapidly, Gold weakens.",
            conditionDown: "Dovish stance or rate cut by the Fed. USD weakens rapidly, Gold strengthens."
          }
        }
      ];
      return pool.map((item, idx) => {
        const eventDate = createRelativeDate(item.dayOffset, item.hour, item.minute);
        const timeStr = eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        return {
          id: idx + 1,
          time: timeStr,
          datetime: eventDate.toISOString(),
          currency: item.currency,
          impact: item.impact,
          event: item.event,
          actual: item.actual,
          forecast: item.forecast,
          previous: item.previous,
          insight: item.insight
        };
      });
    };
    let items = [];
    try {
      console.log("Fetching live news from CNBC Finance RSS feed...");
      const response = await fetch("https://search.cnbc.com/rs/search/all/view.xml?partnerId=2012&num=30", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.ok) {
        const xmlText = await response.text();
        const parsedCNBCNews = parseCNBCRSS(xmlText);
        if (parsedCNBCNews && parsedCNBCNews.length > 0) {
          items = parsedCNBCNews;
          console.log(`Successfully retrieved ${items.length} news items from CNBC RSS feed.`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch live news from CNBC RSS feed:", err);
    }
    if (items.length === 0) {
      items = [
        {
          id: "mock_news_1",
          title: "Federal Reserve hints at future monetary easing on cooling inflation metrics",
          source: "Market Intelligence",
          time: "10 mins ago",
          url: "#",
          sentiment: { type: "bullish", value: "+1.8%" }
        },
        {
          id: "mock_news_2",
          title: "Gold surges past key psychological resistance level amidst rising global geopolitical risks",
          source: "Commodity Watch",
          time: "35 mins ago",
          url: "#",
          sentiment: { type: "bullish", value: "+2.4%" }
        },
        {
          id: "mock_news_3",
          title: "Tech sector index slides as major chipmakers report production bottlenecks",
          source: "Equity Insider",
          time: "1 hr ago",
          url: "#",
          sentiment: { type: "bearish", value: "-1.5%" }
        }
      ];
    }
    try {
      let calendarEvents = [];
      let wasFetchedRealtime = false;
      try {
        console.log("Fetching weekly economic calendar from FairEconomy JSON feed via Jina Reader API...");
        const jinaResponse = await fetch(`https://r.jina.ai/https://nfs.faireconomy.media/ff_calendar_thisweek.json?_t=${Date.now()}`);
        if (jinaResponse.ok) {
          const text = await jinaResponse.text();
          const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              calendarEvents = parseForexFactoryJSON(jsonData);
              wasFetchedRealtime = true;
              console.log(`Successfully parsed ${calendarEvents.length} events from FairEconomy JSON via Jina.`);
            }
          }
        } else {
          console.warn(`Jina Reader returned status ${jinaResponse.status}. Trying direct fetch...`);
        }
      } catch (jinaErr) {
        console.error("Error fetching FairEconomy JSON via Jina:", jinaErr);
      }
      if (calendarEvents.length === 0) {
        try {
          console.log("Fetching weekly economic calendar from FairEconomy JSON feed directly...");
          const jsonResponse = await fetch(`https://nfs.faireconomy.media/ff_calendar_thisweek.json?_t=${Date.now()}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "application/json"
            }
          });
          if (jsonResponse.ok) {
            const jsonData = await jsonResponse.json();
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              calendarEvents = parseForexFactoryJSON(jsonData);
              wasFetchedRealtime = true;
              console.log(`Successfully parsed ${calendarEvents.length} events from FairEconomy JSON.`);
            }
          } else {
            console.warn(`FairEconomy JSON direct fetch returned status ${jsonResponse.status}. Trying XML...`);
          }
        } catch (jsonErr) {
          console.error("Error fetching FairEconomy JSON calendar directly:", jsonErr);
        }
      }
      if (calendarEvents.length === 0) {
        try {
          console.log("Fetching weekly economic calendar from Forex Factory XML feed...");
          const calResponse = await fetch("https://www.forexfactory.com/ffcal_week_this.xml", {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
          });
          if (calResponse.ok) {
            const xmlString = await calResponse.text();
            if (xmlString && xmlString.includes("<event>")) {
              const parsedEvents = parseForexFactoryXML(xmlString);
              if (parsedEvents && parsedEvents.length > 0) {
                calendarEvents = parsedEvents;
                wasFetchedRealtime = true;
                console.log(`Successfully parsed ${calendarEvents.length} events from Forex Factory XML.`);
              }
            }
          } else {
            console.warn(`Forex Factory XML returned status ${calResponse.status}.`);
          }
        } catch (err) {
          console.error("Error fetching Forex Factory XML calendar:", err);
        }
      }
      if (calendarEvents.length === 0) {
        console.log("Using dynamic mock economic calendar fallback.");
        calendarEvents = generateDynamicEconomicEvents();
      }
      if (!wasFetchedRealtime) {
        calendarEvents = adjustEventDates(calendarEvents);
      }
      calendarEvents.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
      const startOfToday = /* @__PURE__ */ new Date();
      startOfToday.setHours(0, 0, 0, 0);
      calendarEvents = calendarEvents.filter((e) => e.datetime && new Date(e.datetime).getTime() >= startOfToday.getTime());
      calendarEvents = calendarEvents.map((e) => ({
        ...e,
        date: getIndonesianDateLabel(e.datetime)
      }));
      res.json({ news: items, economicEvents: calendarEvents });
    } catch (error) {
      console.error("Calendar fetch error:", error);
      const fallbackEvents = generateDynamicEconomicEvents();
      const adjustedFallback = adjustEventDates(fallbackEvents).map((e) => ({
        ...e,
        date: getIndonesianDateLabel(e.datetime)
      }));
      res.json({
        news: items,
        economicEvents: adjustedFallback
      });
    }
  });
  app.get("/api/health-db", async (req, res) => {
    try {
      const { data, error } = await supabase.from("User").select("count").limit(1);
      if (error) throw error;
      res.json({
        status: "ok",
        message: "Successfully connected to Supabase",
        data
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to connect to Supabase",
        error: error.message
      });
    }
  });
  app.get("/api/locations/countries", async (req, res) => {
    try {
      console.log("GET /api/locations/countries");
      const countries = await locationRepo.getAllCountries();
      console.log(`Found ${countries.length} countries`);
      res.json(countries);
    } catch (error) {
      console.error("Error in GET /api/locations/countries:", error.message);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/locations/provinces", async (req, res) => {
    try {
      const countryId = req.query.countryId;
      console.log(`GET /api/locations/provinces?countryId=${countryId}`);
      if (!countryId) return res.status(400).json({ error: "countryId is required" });
      const provinces = await locationRepo.getProvincesByCountryId(countryId);
      console.log(`Found ${provinces.length} provinces for countryId ${countryId}`);
      res.json(provinces);
    } catch (error) {
      console.error(`Error in GET /api/locations/provinces for countryId ${req.query.countryId}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/locations/cities", async (req, res) => {
    try {
      const provinceId = req.query.provinceId;
      console.log(`GET /api/locations/cities?provinceId=${provinceId}`);
      if (!provinceId) return res.status(400).json({ error: "provinceId is required" });
      const cities = await locationRepo.getCitiesByProvinceId(provinceId);
      console.log(`Found ${cities.length} cities for provinceId ${provinceId}`);
      res.json(cities);
    } catch (error) {
      console.error(`Error in GET /api/locations/cities for provinceId ${req.query.provinceId}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/groups", async (req, res) => {
    try {
      const groupRepo = new GroupRepository();
      const groups = await groupRepo.list();
      res.json(groups);
    } catch (error) {
      console.error("Error listing groups:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/upload-logo", async (req, res) => {
    try {
      const { image, type } = req.body;
      if (!image) return res.status(400).json({ error: "No image provided" });
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      let fileName = "gotrading_logo.png";
      if (type === "chat") {
        fileName = "chat_logo.png";
      } else if (type === "login") {
        fileName = "login_logo.png";
      }
      const pubPath = import_path.default.join(process.cwd(), "public", fileName);
      const distPath = import_path.default.join(process.cwd(), "dist", fileName);
      const assetsPath = import_path.default.join(process.cwd(), "assets", fileName);
      import_fs.default.writeFileSync(pubPath, base64Data, { encoding: "base64" });
      import_fs.default.writeFileSync(assetsPath, base64Data, { encoding: "base64" });
      if (import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist"))) {
        import_fs.default.writeFileSync(distPath, base64Data, { encoding: "base64" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save logo" });
    }
  });
  app.post("/api/delete-logo", async (req, res) => {
    try {
      const { type } = req.body;
      let fileName = "gotrading_logo.png";
      if (type === "chat") {
        fileName = "chat_logo.png";
      } else if (type === "login") {
        fileName = "login_logo.png";
      }
      const pubPath = import_path.default.join(process.cwd(), "public", fileName);
      const distPath = import_path.default.join(process.cwd(), "dist", fileName);
      const assetsPath = import_path.default.join(process.cwd(), "assets", fileName);
      if (import_fs.default.existsSync(pubPath)) import_fs.default.unlinkSync(pubPath);
      if (import_fs.default.existsSync(distPath)) import_fs.default.unlinkSync(distPath);
      if (import_fs.default.existsSync(assetsPath)) import_fs.default.unlinkSync(assetsPath);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete logo" });
    }
  });
  app.post("/api/groups", async (req, res) => {
    try {
      const { id, name, type, city, province } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: "Missing group id or name" });
      }
      const groupRepo = new GroupRepository();
      await groupRepo.create({ id, name, type: type || "city", city, province });
      res.json({ success: true, group: { id, name, type, city, province } });
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/groups/stats", async (req, res) => {
    try {
      const city = req.query.city || "";
      const province = req.query.province || "";
      const userRepo = new UserRepository();
      const messageRepo = new MessageRepository();
      const postRepo = new PostRepository();
      const users = await userRepo.list();
      const messages = await messageRepo.list();
      const posts = await postRepo.list();
      const cityUserCount = users.filter((u) => u.city && u.city.toLowerCase() === city.toLowerCase()).length;
      const provinceUserCount = users.filter((u) => u.province && u.province.toLowerCase() === province.toLowerCase()).length;
      const cityGroupId = `group_city_${city.toLowerCase().replace(/\s+/g, "_")}`;
      const provinceGroupId = `group_province_${province.toLowerCase().replace(/\s+/g, "_")}`;
      const cityChatCount = messages.filter((m) => m.receiverId === cityGroupId).length;
      const provinceChatCount = messages.filter((m) => m.receiverId === provinceGroupId).length;
      const cityPostCount = posts.filter((p) => p.groupId === cityGroupId).length;
      const provincePostCount = posts.filter((p) => p.groupId === provinceGroupId).length;
      res.json({
        city: {
          members: cityUserCount,
          messages: cityChatCount + cityPostCount
        },
        province: {
          members: provinceUserCount,
          messages: provinceChatCount + provincePostCount
        }
      });
    } catch (error) {
      console.error("Error fetching group stats:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/auth/check-availability", async (req, res) => {
    try {
      const { username, email } = req.query;
      if (!username && !email) {
        return res.status(400).json({ error: "username or email is required" });
      }
      console.log(`Checking availability for username: ${username}, email: ${email}`);
      let userWithUsername = null;
      if (username) {
        const { data } = await supabase.from("User").select("id").eq("username", username).maybeSingle();
        userWithUsername = data;
      }
      let userWithEmail = null;
      if (email) {
        const { data } = await supabase.from("User").select("id").eq("email", email).maybeSingle();
        userWithEmail = data;
      }
      const result = {
        username_taken: !!userWithUsername,
        email_taken: !!userWithEmail
      };
      console.log(`Availability check result:`, result);
      res.json(result);
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      let { firstName, lastName, username, email, whatsappNumber, country, province, city, password } = req.body;
      if (!firstName || !lastName || !username || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (!password) {
        password = Math.random().toString(36).substring(2, 15) + "A1!";
      }
      const profileData = {
        username,
        first_name: firstName,
        last_name: lastName,
        whatsapp_number: whatsappNumber || "",
        country: country || "Unknown",
        province: province || "",
        city: city || "",
        avatar: (firstName[0] + (lastName[0] || "")).toUpperCase(),
        cover_photo: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
        headline: "Trader at Tarapti Community",
        bio: "Sharing ideas and connecting with trade professionals.",
        trading_experience: "Beginner",
        trading_asset: "Forex",
        online_status: "online",
        followers_count: 0,
        following_count: 0,
        reputation_points: 10,
        latitude: req.body.latitude || 1.3521,
        longitude: req.body.longitude || 103.8198,
        timezone: "UTC",
        locale: "en-US",
        currency: "USD"
      };
      const { user } = await authService.register({
        firstName,
        lastName,
        username,
        email,
        password,
        whatsappNumber: whatsappNumber || "",
        country: country || "",
        province: province || "",
        city: city || ""
      }, profileData);
      await authService.verifyEmail(user.id);
      const accessToken = generateAccessToken(user.id);
      const responseUser = {
        id: user.id,
        email: user.email,
        ...profileData,
        // Map back to camelCase for client consistency
        firstName,
        lastName,
        whatsappNumber,
        tradingExperience: "Beginner",
        tradingAsset: "Forex",
        onlineStatus: "online",
        followersCount: 0,
        followingCount: 0,
        reputationPoints: 10,
        coverPhoto: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80"
      };
      res.json({ success: true, user: responseUser, token: accessToken });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message || "Failed to register" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const ip = req.ip || "unknown";
      const device = {
        device_name: req.headers["user-agent"] || "unknown",
        device_type: "web",
        browser: "unknown",
        os: "unknown"
      };
      const result = await authService.login(email, password, ip, device);
      const userObj = await authService.getCurrentUserByEmail(email);
      let responseUser = {
        ...userObj.user,
        ...userObj.profile
      };
      delete responseUser.password;
      const userRepo = new UserRepository();
      const existingUser = await userRepo.findById(responseUser.id);
      if (existingUser) {
        responseUser = {
          ...responseUser,
          ...existingUser,
          avatar: existingUser.avatar || responseUser.avatar,
          coverPhoto: existingUser.coverPhoto || existingUser.cover_photo || responseUser.coverPhoto || responseUser.cover_photo,
          cover_photo: existingUser.cover_photo || existingUser.coverPhoto || responseUser.cover_photo || responseUser.coverPhoto
        };
      }
      res.json({
        success: true,
        user: responseUser,
        token: result.accessToken,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: error.message || "Invalid email or password" });
    }
  });
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }
      const result = await authService.refreshToken(refreshToken);
      res.json({
        success: true,
        accessToken: result.accessToken,
        token: result.accessToken,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(401).json({ error: error.message || "Invalid or expired refresh token" });
    }
  });
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.json({ success: true, message: "Reset code sent to your registered email & WhatsApp." });
    } catch (error) {
      res.status(400).json({ error: error.message || "Email not found" });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to reset password" });
    }
  });
  app.get("/api/users/profile/:userId", async (req, res) => {
    const userRepo = new UserRepository();
    const user = await userRepo.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...safeUser } = user;
    if (!safeUser.coverPhoto && safeUser.cover_photo) safeUser.coverPhoto = safeUser.cover_photo;
    if (!safeUser.cover_photo && safeUser.coverPhoto) safeUser.cover_photo = safeUser.coverPhoto;
    res.json(safeUser);
  });
  app.put("/api/users/profile/:userId", async (req, res) => {
    const userId = req.params.userId;
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { firstName, lastName, username, headline, bio, country, province, city, tradingExperience, tradingAsset, latitude, longitude, avatar, coverPhoto, marketPulseEnabled, marketPulseAssets } = req.body;
    if (firstName) {
      user.firstName = firstName;
    }
    if (lastName) {
      user.lastName = lastName;
    }
    if (username) {
      user.username = username;
    }
    if (headline !== void 0) user.headline = headline;
    if (bio !== void 0) user.bio = bio;
    if (country) user.country = country;
    if (province !== void 0) user.province = province;
    if (city) user.city = city;
    if (tradingExperience) {
      user.tradingExperience = tradingExperience;
    }
    if (tradingAsset) {
      user.tradingAsset = tradingAsset;
    }
    if (avatar) user.avatar = avatar;
    if (coverPhoto) {
      user.coverPhoto = coverPhoto;
    }
    if (latitude !== void 0) user.latitude = latitude;
    if (longitude !== void 0) user.longitude = longitude;
    await userRepo.update(userId, user);
    const profileRepo = new ProfileRepository();
    const profileObj = {
      user_id: userId,
      first_name: user.firstName,
      last_name: user.lastName,
      headline: user.headline || void 0,
      bio: user.bio || void 0,
      avatar: user.avatar || void 0,
      cover_photo: user.coverPhoto || void 0,
      trading_experience: user.tradingExperience || void 0,
      trading_asset: user.tradingAsset || void 0,
      city: user.city || void 0,
      province: user.province || void 0,
      country: user.country || void 0,
      latitude: latitude !== void 0 ? latitude : void 0,
      longitude: longitude !== void 0 ? longitude : void 0
    };
    await profileRepo.update(userId, profileObj);
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });
  app.put("/api/users/profile/:userId/language", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { language } = req.body;
      if (!language) return res.status(400).json({ error: "Language is required" });
      const userRepo = new UserRepository();
      const user = await userRepo.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const profileRepo = new ProfileRepository();
      await profileRepo.update(userId, { locale: language });
      const updatedUser = await userRepo.findById(userId);
      if (updatedUser) {
        updatedUser.locale = language;
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } else {
        res.status(500).json({ error: "Failed to fetch updated user" });
      }
    } catch (e) {
      console.error("Failed to update language preference:", e);
      res.status(500).json({ error: e?.message || "Internal server error" });
    }
  });
  app.get("/api/users", async (req, res) => {
    const userRepo = new UserRepository();
    let list = await userRepo.list();
    if ((!list || list.length === 0) && req.db?.users && req.db.users.length > 0) {
      list = req.db.users;
    }
    const { search, country, province, city, experience, asset, online, lat, lng, radius } = req.query;
    console.log(`GET /api/users - Search: ${search}, Geo: ${lat}, ${lng}, Radius: ${radius}`);
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter((u) => {
        const firstName = u.firstName || "";
        const lastName = u.lastName || "";
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return fullName.includes(q) || firstName.toLowerCase().includes(q) || lastName.toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q) || (u.headline || "").toLowerCase().includes(q) || (u.city || "").toLowerCase().includes(q) || (u.country || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.tradingExperience || "").toLowerCase().includes(q) || (u.tradingAsset || "").toLowerCase().includes(q);
      });
    }
    if (country) list = list.filter((u) => (u.country || "").toLowerCase() === country.toLowerCase());
    if (province) list = list.filter((u) => (u.province || "").toLowerCase() === province.toLowerCase());
    if (city) list = list.filter((u) => (u.city || "").toLowerCase() === city.toLowerCase());
    if (experience) list = list.filter((u) => u.tradingExperience === experience);
    if (asset) list = list.filter((u) => u.tradingAsset === asset);
    if (online) list = list.filter((u) => u.onlineStatus === online);
    if (lat && lng && radius) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      const radKm = parseFloat(radius);
      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };
      list = list.map((u, index) => {
        const userObj = { ...u };
        if (!userObj.latitude || !userObj.longitude) {
          if (index === 0) {
            userObj.latitude = uLat + 0.02;
            userObj.longitude = uLng + 0.02;
          } else if (index === 1) {
            userObj.latitude = uLat - 0.04;
            userObj.longitude = uLng - 0.04;
          } else if (index === 2) {
            userObj.latitude = uLat + 0.08;
            userObj.longitude = uLng - 0.08;
          } else {
            if (u.city === "Tasikmalaya") {
              userObj.latitude = -7.3274;
              userObj.longitude = 108.2207;
            } else if (u.city === "Bandung") {
              userObj.latitude = -6.9175;
              userObj.longitude = 107.6191;
            } else if (u.city === "Jakarta Selatan" || u.city === "Jakarta") {
              userObj.latitude = -6.2615;
              userObj.longitude = 106.8106;
            } else if (u.city === "Surabaya") {
              userObj.latitude = -7.2575;
              userObj.longitude = 112.7521;
            } else if (u.city === "Semarang") {
              userObj.latitude = -6.9667;
              userObj.longitude = 110.4167;
            } else {
              userObj.latitude = -6.2088;
              userObj.longitude = 106.8456;
            }
          }
        }
        return userObj;
      });
      list = list.filter((u) => {
        if (!u.latitude || !u.longitude) return false;
        const dist = getDistance(uLat, uLng, u.latitude, u.longitude);
        u.distance = parseFloat(dist.toFixed(1));
        return dist <= radKm;
      });
    }
    const safeList = list.map((u) => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(safeList);
  });
  app.post("/api/users/:targetUserId/follow", async (req, res) => {
    const { currentUserId } = req.body;
    const targetId = req.params.targetUserId;
    if (!currentUserId || currentUserId === targetId) {
      return res.status(400).json({ error: "Invalid operation" });
    }
    const followRepo = new FollowRepository();
    const notifRepo = new NotificationRepository();
    const userRepo = new UserRepository();
    const following = await followRepo.listFollowing(currentUserId);
    const isFollowing = following.includes(targetId);
    let followed = false;
    if (isFollowing) {
      await followRepo.unfollow(currentUserId, targetId);
    } else {
      await followRepo.follow(currentUserId, targetId);
      followed = true;
      const sender = await userRepo.findById(currentUserId);
      if (sender) {
        await notifRepo.create({
          toUserId: targetId,
          fromUserId: currentUserId,
          fromUserName: `${sender.firstName} ${sender.lastName}`,
          fromUserAvatar: sender.avatar || "",
          type: "follow",
          message: "started following you",
          isRead: false,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    const followerUser = await userRepo.findById(currentUserId);
    const targetUser = await userRepo.findById(targetId);
    if (followerUser && targetUser) {
      const following2 = await followRepo.listFollowing(currentUserId);
      const followers = await followRepo.listFollowers(targetId);
      followerUser.followingCount = following2.length;
      targetUser.followersCount = followers.length;
      if (followed) {
        const currentRep = targetUser.reputationPoints || 0;
        const gain = calculateReputationGain(currentRep, 3);
        targetUser.reputationPoints = currentRep + gain;
      } else {
        targetUser.reputationPoints = Math.max(10, (targetUser.reputationPoints || 0) - 3);
      }
      await userRepo.update(currentUserId, followerUser);
      await userRepo.update(targetId, targetUser);
    }
    res.json({ success: true, followed });
  });
  app.get("/api/users/:userId/follows", async (req, res) => {
    const uid = req.params.userId;
    const followRepo = new FollowRepository();
    const userRepo = new UserRepository();
    const following = await followRepo.listFollowing(uid);
    const followers = await followRepo.listFollowers(uid);
    let allUsers = [];
    try {
      allUsers = await userRepo.list();
    } catch (e) {
      console.error("Could not fetch user list for follows:", e);
    }
    if ((!allUsers || allUsers.length === 0) && req.db?.users && req.db.users.length > 0) {
      allUsers = req.db.users;
    }
    const followingDetails = (allUsers || []).filter((u) => following.includes(u.id)).map(({ password, ...u }) => u);
    const followerDetails = (allUsers || []).filter((u) => followers.includes(u.id)).map(({ password, ...u }) => u);
    res.json({ following, followers, followingDetails, followerDetails });
  });
  app.post("/api/users/connect", async (req, res) => {
    const { requesterId, receiverId } = req.body;
    if (!requesterId || !receiverId || requesterId === receiverId) {
      return res.status(400).json({ error: "Invalid connection request" });
    }
    const connRepo = new ConnectionRepository();
    const userRepo = new UserRepository();
    const notifRepo = new NotificationRepository();
    const connections = await connRepo.list();
    const existing = connections.find(
      (c) => c.requesterId === requesterId && c.receiverId === receiverId || c.requesterId === receiverId && c.receiverId === requesterId
    );
    if (existing) {
      return res.status(400).json({ error: "Connection request already exists" });
    }
    const newConn = {
      requesterId,
      receiverId,
      status: "pending",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    await connRepo.create(newConn);
    const sender = await userRepo.findById(requesterId);
    if (sender) {
      await notifRepo.create({
        toUserId: receiverId,
        fromUserId: requesterId,
        fromUserName: `${sender.firstName} ${sender.lastName}`,
        fromUserAvatar: sender.avatar || "",
        type: "friend_request",
        message: "wants to connect with you",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({ success: true, connection: newConn });
  });
  app.put("/api/users/connect/accept", async (req, res) => {
    const { requesterId, receiverId } = req.body;
    const connRepo = new ConnectionRepository();
    const userRepo = new UserRepository();
    const notifRepo = new NotificationRepository();
    const connections = await connRepo.list();
    const conn = connections.find((c) => c.requesterId === requesterId && c.receiverId === receiverId);
    if (!conn) return res.status(404).json({ error: "Connection request not found" });
    await connRepo.updateStatus(requesterId, receiverId, "accepted");
    const receiver = await userRepo.findById(receiverId);
    if (receiver) {
      await notifRepo.create({
        toUserId: requesterId,
        fromUserId: receiverId,
        fromUserName: `${receiver.firstName} ${receiver.lastName}`,
        fromUserAvatar: receiver.avatar || "",
        type: "friend_accepted",
        message: "accepted your connection request",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({ success: true });
  });
  app.put("/api/users/connect/decline", async (req, res) => {
    const { requesterId, receiverId } = req.body;
    const connRepo = new ConnectionRepository();
    await connRepo.delete(requesterId, receiverId);
    res.json({ success: true });
  });
  app.get("/api/users/:userId/connection-status/:targetId", async (req, res) => {
    const { userId, targetId } = req.params;
    const connRepo = new ConnectionRepository();
    const connections = await connRepo.list();
    const conn = connections.find(
      (c) => c.requesterId === userId && c.receiverId === targetId || c.requesterId === targetId && c.receiverId === userId
    );
    if (!conn) return res.json({ status: "none" });
    if (conn.status === "accepted") return res.json({ status: "accepted" });
    if (conn.status === "pending") {
      if (conn.requesterId === userId) return res.json({ status: "pending" });
      return res.json({ status: "received_pending" });
    }
    res.json({ status: "none" });
  });
  app.get("/api/users/:userId/pending-connections", async (req, res) => {
    try {
      const { userId } = req.params;
      const connRepo = new ConnectionRepository();
      const userRepo = new UserRepository();
      const connections = await connRepo.list();
      const pending = connections.filter((c) => c.receiverId === userId && c.status === "pending");
      const result = [];
      for (const p of pending) {
        const sender = await userRepo.findById(p.requesterId);
        if (sender) {
          result.push({
            id: p.requesterId,
            requesterId: p.requesterId,
            receiverId: p.receiverId,
            firstName: sender.firstName,
            lastName: sender.lastName,
            avatar: sender.avatar,
            tradingExperience: sender.tradingExperience || "Trader",
            city: sender.city || "Jakarta",
            country: sender.country || "Indonesia",
            timestamp: p.timestamp || (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      res.json(result);
    } catch (e) {
      console.warn("Notice in /pending-connections:", e);
      res.json([]);
    }
  });
  app.get("/api/stories", async (req, res) => {
    const storyRepo = new StoryRepository();
    const userRepo = new UserRepository();
    try {
      const stories = await storyRepo.list();
      const users = await userRepo.list();
      const enrichedStories = await Promise.all(stories.map(async (story) => {
        const user = users.find((u) => u.id === story.userId);
        const rawViewers = await storyRepo.getViewers(story.id);
        const viewers = rawViewers.map((rv) => {
          const vUser = users.find((u) => u.id === rv.userId);
          return {
            userId: rv.userId,
            viewedAt: rv.viewedAt,
            user: vUser ? {
              id: vUser.id,
              firstName: vUser.firstName,
              lastName: vUser.lastName,
              username: vUser.username,
              avatar: vUser.avatar
            } : void 0
          };
        });
        return {
          ...story,
          viewers,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            avatar: user.avatar
          } : void 0
        };
      }));
      console.log("Fetching stories from Supabase, count:", enrichedStories.length);
      res.json(enrichedStories);
    } catch (e) {
      console.error("Error fetching stories:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/stories/:storyId/view", async (req, res) => {
    const { storyId } = req.params;
    const { viewerUserId } = req.body;
    if (!viewerUserId) {
      return res.status(400).json({ error: "viewerUserId is required" });
    }
    const storyRepo = new StoryRepository();
    const userRepo = new UserRepository();
    try {
      const rawViewers = await storyRepo.recordView(storyId, viewerUserId);
      const users = await userRepo.list();
      const enrichedViewers = rawViewers.map((rv) => {
        const vUser = users.find((u) => u.id === rv.userId);
        return {
          userId: rv.userId,
          viewedAt: rv.viewedAt,
          user: vUser ? {
            id: vUser.id,
            firstName: vUser.firstName,
            lastName: vUser.lastName,
            username: vUser.username,
            avatar: vUser.avatar
          } : void 0
        };
      });
      res.json({ success: true, viewers: enrichedViewers });
    } catch (e) {
      console.error("Error recording story view:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/stories", async (req, res) => {
    const { userId, imageUrl } = req.body;
    console.log("Posting story for user to Supabase:", userId);
    const storyRepo = new StoryRepository();
    const userRepo = new UserRepository();
    const followRepo = new FollowRepository();
    const notifRepo = new NotificationRepository();
    try {
      await storyRepo.deleteByUserId(userId);
      const newStory = await storyRepo.create({
        userId,
        imageUrl,
        viewed: false
      });
      const user = await userRepo.findById(userId);
      try {
        if (user) {
          const followerIds = await followRepo.listFollowers(userId);
          const authorFullName = `${user.firstName} ${user.lastName}`.trim();
          for (const followerId of followerIds) {
            const newNotif = {
              id: "notify_story_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              toUserId: followerId,
              fromUserId: userId,
              fromUserName: authorFullName,
              fromUserAvatar: user.avatar || "",
              type: "friend_post",
              message: `${authorFullName} (yang Anda ikuti) membagikan cerita (story) baru.`,
              isRead: false,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            };
            await notifRepo.create(newNotif);
            if (req.db) {
              if (!req.db.notifications) req.db.notifications = [];
              req.db.notifications.unshift(newNotif);
            }
          }
        }
      } catch (notifErr) {
        console.warn("Error sending story notification to followers:", notifErr);
      }
      const enrichedStory = {
        ...newStory,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar
        } : void 0
      };
      res.json(enrichedStory);
    } catch (e) {
      console.error("Error creating story:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/stories/:storyId", async (req, res) => {
    const { storyId } = req.params;
    const userId = req.body?.userId || req.query?.userId;
    const storyRepo = new StoryRepository();
    if (!userId) {
      return res.status(400).json({ error: "userId is required for deletion" });
    }
    try {
      await storyRepo.delete(storyId);
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting story:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/posts", async (req, res) => {
    try {
      const postRepo = new PostRepository();
      const followRepo = new FollowRepository();
      const { search, tag, userId, groupId, currentUserId, limit, type } = req.query;
      const page = req.query.page !== void 0 ? parseInt(req.query.page) : 0;
      const pageSize = req.query.pageSize !== void 0 ? parseInt(req.query.pageSize) : 15;
      const limitVal = limit ? parseInt(limit) : groupId || userId || search || tag ? 150 : 50;
      let posts = await postRepo.list(
        limitVal,
        groupId || (userId || search || tag ? void 0 : null),
        search,
        tag,
        userId,
        page,
        pageSize
      );
      if (type === "following" && currentUserId) {
        const followingIds = await followRepo.listFollowing(currentUserId);
        posts = posts.filter((p) => followingIds.includes(p.userId));
      }
      if (type === "popular") {
        posts = posts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
      } else {
        posts = sortPostsWithPinnedFirst(posts);
      }
      const enrichedPosts = posts.map((p) => {
        return {
          ...p,
          authorCity: p.authorCity || "Tasikmalaya",
          authorCountry: p.authorCountry || "Indonesia",
          authorVerified: !!p.authorVerified
        };
      });
      res.json(enrichedPosts);
    } catch (error) {
      console.error("Error in /api/posts:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.get("/api/posts/:postId", async (req, res) => {
    const postRepo = new PostRepository();
    const commentRepo = new CommentRepository();
    const userRepo = new UserRepository();
    const post = await postRepo.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const comments = await commentRepo.listByPostId(post.id);
    const author = await userRepo.findById(post.userId);
    const enrichedPost = {
      ...post,
      authorCity: author ? author.city : post.authorCity || "Tasikmalaya",
      authorCountry: author ? author.country : post.authorCountry || "Indonesia",
      authorVerified: author ? !!(author.mt5Connected || author.isVerified) : !!post.authorVerified
    };
    const enrichedComments = await Promise.all(comments.map(async (c) => {
      const cAuthor = await userRepo.findById(c.userId);
      return {
        ...c,
        authorCity: cAuthor ? cAuthor.city : c.authorCity || "Tasikmalaya",
        authorCountry: cAuthor ? cAuthor.country : c.authorCountry || "Indonesia",
        authorVerified: cAuthor ? !!(cAuthor.mt5Connected || cAuthor.isVerified) : !!c.authorVerified
      };
    }));
    res.json({ post: enrichedPost, comments: enrichedComments });
  });
  app.post("/api/posts", async (req, res) => {
    console.log("POST /api/posts received:", JSON.stringify(req.body).substring(0, 200) + "...");
    try {
      const { userId, content, images, chart, videoUrl, groupId, isOfficial, isPinned, marketBias } = req.body;
      console.log(`Received POST request for /api/posts: userId=${userId}, contentLen=${content?.length}, imagesLen=${images?.length}`);
      if (!userId) {
        console.warn("POST /api/posts failed: userId is missing");
        return res.status(400).json({ error: "Missing required fields: userId is required" });
      }
      if (!content?.trim() && !images?.length && !videoUrl && !chart) {
        console.warn("POST /api/posts failed: content and media are missing");
        return res.status(400).json({ error: "Missing required fields: content or media/chart is required" });
      }
      console.log("Creating post for user:", userId);
      const userRepo = new UserRepository();
      const postRepo = new PostRepository();
      let user = await userRepo.findById(userId);
      if (!user) {
        console.log("User not found in repo, fetching from authService...");
        try {
          const uObj = await authService.getCurrentUser(userId);
          if (uObj && uObj.user) {
            user = uObj.user;
          } else if (uObj && uObj.profile) {
            const p = uObj.profile;
            user = {
              id: userId,
              firstName: p.first_name || p.firstName || "Trader",
              lastName: p.last_name || p.lastName || "Member",
              username: p.username || "trader_" + userId.substring(0, 6),
              avatar: p.avatar || p.avatar_url || "\u{1F464}",
              city: p.city || "Jakarta",
              country: p.country || "Indonesia",
              tradingExperience: p.trading_experience || "Pro Trader"
            };
            console.log("Using profile data for post author:", JSON.stringify(user));
          }
        } catch (e) {
          console.error("Error getting current user from authService:", e);
        }
      }
      if (!user) {
        console.log("User still not found, using generic fallback for user:", userId);
        user = {
          id: userId,
          firstName: "Trader",
          lastName: "Member",
          username: "trader_" + userId.substring(0, 6),
          email: "member@tarapti.com",
          avatar: "\u{1F464}",
          tradingExperience: "Pro Trader",
          tradingAsset: "Forex",
          city: "Jakarta",
          country: "Indonesia",
          reputationPoints: 10
        };
        try {
          await userRepo.create(user);
        } catch (e) {
          console.error("Error creating fallback user record:", e);
        }
      }
      const hashtags = content ? (content.match(/#\w+/g) || []).map((t) => t.substring(1)) : [];
      const authorFirstName = user.firstName || user.first_name || "Trader";
      const authorLastName = user.lastName || user.last_name || "Member";
      const newPost = await postRepo.create({
        userId,
        authorName: `${authorFirstName} ${authorLastName}`.trim(),
        authorUsername: user.username || "trader_" + userId.substring(0, 6),
        authorAvatar: user.avatar || user.avatar_url || "",
        authorRole: user.tradingExperience || user.trading_experience || "Trader",
        authorCity: user.city || "Jakarta",
        authorCountry: user.country || "Indonesia",
        content: content || "",
        images: images || [],
        videoUrl: videoUrl || void 0,
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        repostsCount: 0,
        likedBy: [],
        bookmarkedBy: [],
        repostedBy: [],
        tags: hashtags,
        chart: chart || void 0,
        groupId: groupId || void 0,
        isOfficial: isOfficial || false,
        isPinned: isPinned || false,
        isRepost: false,
        marketBias: marketBias || void 0,
        authorVerified: !!(user.mt5Connected || user.isVerified)
      });
      console.log("Post creation result from repo:", JSON.stringify(newPost).substring(0, 200) + "...");
      console.log("Post created successfully in API:", newPost.id);
      if (req.db) {
        if (!req.db.posts) req.db.posts = [];
        if (!req.db.posts.some((p) => p.id === newPost.id)) {
          req.db.posts.unshift(newPost);
          console.log("Post synced to memory store, new count:", req.db.posts.length);
        }
        if (typeof req.save === "function") {
          if (typeof req.save === "function") req.save();
        }
      }
      const currentRep = user.reputationPoints || 0;
      const gain = calculateReputationGain(currentRep, 2);
      user.reputationPoints = currentRep + gain;
      try {
        await userRepo.update(userId, user);
      } catch (e) {
        console.error("Error updating user reputation:", e);
      }
      try {
        const notifRepo = new NotificationRepository();
        const followRepo = new FollowRepository();
        const authorFullName = `${authorFirstName} ${authorLastName}`.trim();
        const allUsers = await userRepo.list();
        const otherUsers = allUsers.filter((u) => u.id && u.id !== userId);
        const followerIds = await followRepo.listFollowers(userId);
        const snippet = content ? content.length > 50 ? content.substring(0, 50) + "..." : content : "postingan baru";
        for (const targetUser of otherUsers) {
          const isFollower = followerIds.includes(targetUser.id);
          const messageText = isFollower ? `${authorFullName} (yang Anda ikuti) membagikan postingan baru: "${snippet}"` : `${authorFullName} membagikan postingan baru: "${snippet}"`;
          const newNotif = {
            id: "notify_post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            toUserId: targetUser.id,
            fromUserId: userId,
            fromUserName: authorFullName,
            fromUserAvatar: user.avatar || "",
            type: "friend_post",
            message: messageText,
            isRead: false,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          await notifRepo.create(newNotif);
          if (req.db) {
            if (!req.db.notifications) req.db.notifications = [];
            req.db.notifications.unshift(newNotif);
          }
        }
      } catch (notifErr) {
        console.warn("Notice creating post notifications:", notifErr);
      }
      res.json(newPost);
    } catch (err) {
      console.error("Error creating post in /api/posts:", err);
      res.status(500).json({ error: err?.message || "Failed to create post" });
    }
  });
  app.put("/api/posts/:postId", async (req, res) => {
    const postRepo = new PostRepository();
    const post = await postRepo.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.body.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    post.content = req.body.content || post.content;
    post.tags = (post.content.match(/#\w+/g) || []).map((t) => t.substring(1));
    if (req.body.images) post.images = req.body.images;
    if (req.body.chart) post.chart = req.body.chart;
    await postRepo.update(post);
    res.json(post);
  });
  app.delete("/api/posts/:postId", async (req, res) => {
    const postRepo = new PostRepository();
    const commentRepo = new CommentRepository();
    const { postId } = req.params;
    const userId = req.body?.userId || req.query?.userId;
    console.log(`DELETE /api/posts/${postId} requested by userId: ${userId}`);
    let post = await postRepo.findById(postId);
    if (!post && req.db?.posts) {
      post = req.db.posts.find((p) => p.id === postId);
    }
    if (!post) {
      console.warn(`Delete failed: Post ${postId} not found`);
      return res.status(404).json({ error: "Post not found" });
    }
    if (!userId) {
      console.warn(`Delete failed: userId is missing for post ${postId}`);
      return res.status(400).json({ error: "userId is required for deletion" });
    }
    const userRepo = new UserRepository();
    const requester = await userRepo.findById(userId);
    const isAdmin = requester?.role === "admin" || requester?.isAdmin === true || requester?.username === "admin";
    if (post.userId !== userId && !isAdmin) {
      console.warn(`Delete failed: Unauthorized. Post owner is ${post.userId}, but requester is ${userId}`);
      return res.status(403).json({ error: "Unauthorized: Only the author or admin can delete this post" });
    }
    try {
      await postRepo.delete(postId);
      console.log(`Post ${postId} deleted from repository`);
      if (req.db && req.db.posts) {
        req.db.posts = req.db.posts.filter((p) => p.id !== postId);
        if (typeof req.save === "function") {
          req.save();
        }
      }
      const comments = await commentRepo.listByPostId(postId);
      console.log(`Cleaning up ${comments.length} comments for post ${postId}`);
      for (const c of comments) {
        await commentRepo.delete(c.id);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting post:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/posts/:postId/like", async (req, res) => {
    try {
      const { userId } = req.body;
      const postRepo = new PostRepository();
      const userRepo = new UserRepository();
      const notifRepo = new NotificationRepository();
      const post = await postRepo.findById(req.params.postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (!post.likedBy) post.likedBy = [];
      const likedIndex = post.likedBy.indexOf(userId);
      let liked = false;
      if (likedIndex >= 0) {
        post.likedBy.splice(likedIndex, 1);
      } else {
        post.likedBy.push(userId);
        liked = true;
        if (post.userId !== userId) {
          const sender = await userRepo.findById(userId);
          if (sender) {
            await notifRepo.create({
              toUserId: post.userId,
              fromUserId: userId,
              fromUserName: `${sender.firstName} ${sender.lastName}`,
              fromUserAvatar: sender.avatar,
              type: "like",
              message: "liked your post",
              isRead: false,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            const author = await userRepo.findById(post.userId);
            if (author) {
              const currentRep = author.reputationPoints || 0;
              const gain = calculateReputationGain(currentRep, 1);
              author.reputationPoints = currentRep + gain;
              await userRepo.update(post.userId, author);
            }
          }
        }
        try {
          const sender = await userRepo.findById(userId);
          if (sender) {
            const followRepo = new FollowRepository();
            const followerIds = await followRepo.listFollowers(userId);
            const authorFullName = `${sender.firstName} ${sender.lastName}`.trim();
            for (const followerId of followerIds) {
              const newNotif = {
                id: "notify_like_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
                toUserId: followerId,
                fromUserId: userId,
                fromUserName: authorFullName,
                fromUserAvatar: sender.avatar || "",
                type: "like",
                message: `${authorFullName} (yang Anda ikuti) menyukai postingan t\u1EEB ${post.authorName}.`,
                isRead: false,
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              };
              await notifRepo.create(newNotif);
              if (req.db) {
                if (!req.db.notifications) req.db.notifications = [];
                req.db.notifications.unshift(newNotif);
              }
            }
          }
        } catch (notifErr) {
          console.warn("Error sending like notification to followers:", notifErr);
        }
      }
      post.likesCount = post.likedBy.length;
      await postRepo.update(post);
      res.json({ success: true, likesCount: post.likesCount, liked });
    } catch (err) {
      console.error("Error in /api/posts/:postId/like:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      console.log(`Received POST request for /api/posts/${req.params.postId}/comments: body=${JSON.stringify(req.body)}`);
      const { userId, content } = req.body;
      const postId = req.params.postId;
      const postRepo = new PostRepository();
      const commentRepo = new CommentRepository();
      const userRepo = new UserRepository();
      const notifRepo = new NotificationRepository();
      const post = await postRepo.findById(postId);
      if (!post) {
        console.warn(`POST /api/posts/${postId}/comments failed: Post not found`);
        return res.status(404).json({ error: "Post not found" });
      }
      const user = await userRepo.findById(userId);
      if (!user) {
        console.warn(`POST /api/posts/${postId}/comments failed: User not found`);
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`Attempting to create comment in CommentRepository: ${JSON.stringify({
        postId,
        userId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorUsername: user.username,
        authorAvatar: user.avatar,
        content
      })}`);
      const newComment = await commentRepo.create({
        postId,
        userId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorUsername: user.username,
        authorAvatar: user.avatar,
        content
      });
      console.log(`Comment created successfully: ${JSON.stringify(newComment)}`);
      const comments = await commentRepo.listByPostId(postId);
      post.commentsCount = comments.length;
      await postRepo.update(post);
      if (post.userId !== userId) {
        await notifRepo.create({
          toUserId: post.userId,
          fromUserId: userId,
          fromUserName: `${user.firstName} ${user.lastName}`,
          fromUserAvatar: user.avatar,
          type: "comment",
          message: `commented on your post: "${content.substring(0, 30)}..."`,
          isRead: false,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        const author = await userRepo.findById(post.userId);
        if (author) {
          const currentRep = author.reputationPoints || 0;
          const gain = calculateReputationGain(currentRep, 2);
          author.reputationPoints = currentRep + gain;
          await userRepo.update(post.userId, author);
        }
      }
      try {
        if (user) {
          const followRepo = new FollowRepository();
          const followerIds = await followRepo.listFollowers(userId);
          const authorFullName = `${user.firstName} ${user.lastName}`.trim();
          const snippet = content.length > 20 ? content.substring(0, 20) + "..." : content;
          for (const followerId of followerIds) {
            const newNotif = {
              id: "notify_comment_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              toUserId: followerId,
              fromUserId: userId,
              fromUserName: authorFullName,
              fromUserAvatar: user.avatar || "",
              type: "comment",
              message: `${authorFullName} (yang Anda ikuti) mengomentari postingan ${post.authorName}: "${snippet}"`,
              isRead: false,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            };
            await notifRepo.create(newNotif);
            if (req.db) {
              if (!req.db.notifications) req.db.notifications = [];
              req.db.notifications.unshift(newNotif);
            }
          }
        }
      } catch (notifErr) {
        console.warn("Error sending comment notification to followers:", notifErr);
      }
      res.json(newComment);
    } catch (err) {
      console.error("Error in /api/posts/:postId/comments:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.delete("/api/posts/:postId/comments/:commentId", async (req, res) => {
    const userId = req.body?.userId || req.query?.userId;
    const { postId, commentId } = req.params;
    const postRepo = new PostRepository();
    const commentRepo = new CommentRepository();
    if (!userId) {
      return res.status(400).json({ error: "userId is required for deletion" });
    }
    const comment = await commentRepo.list().then((list) => list.find((c) => c.id === commentId));
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.userId !== userId) {
      const post = await postRepo.findById(postId);
      if (!post || post.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized: Only the author or post owner can delete this comment" });
      }
    }
    try {
      await commentRepo.delete(commentId);
      const post = await postRepo.findById(postId);
      if (post) {
        const comments = await commentRepo.listByPostId(postId);
        post.commentsCount = comments.length;
        await postRepo.update(post);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting comment:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/posts/:postId/bookmark", async (req, res) => {
    const { userId } = req.body;
    const postId = req.params.postId;
    const postRepo = new PostRepository();
    const post = await postRepo.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!post.bookmarkedBy) post.bookmarkedBy = [];
    const idx = post.bookmarkedBy.indexOf(userId);
    let bookmarked = false;
    if (idx >= 0) {
      post.bookmarkedBy.splice(idx, 1);
    } else {
      post.bookmarkedBy.push(userId);
      bookmarked = true;
    }
    post.bookmarksCount = post.bookmarkedBy.length;
    await postRepo.update(post);
    res.json({ success: true, bookmarksCount: post.bookmarksCount, bookmarked });
  });
  app.post("/api/posts/:postId/repost", async (req, res) => {
    const { userId } = req.body;
    const postId = req.params.postId;
    const postRepo = new PostRepository();
    const userRepo = new UserRepository();
    const notifRepo = new NotificationRepository();
    const originalPost = await postRepo.findById(postId);
    if (!originalPost) return res.status(404).json({ error: "Post not found" });
    const user = await userRepo.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!originalPost.repostedBy) originalPost.repostedBy = [];
    const idx = originalPost.repostedBy.indexOf(userId);
    if (idx >= 0) {
      originalPost.repostedBy.splice(idx, 1);
      const userPosts = await postRepo.list();
      const rp = userPosts.find((p) => p.userId === userId && p.isRepost && p.content.includes(originalPost.content));
      if (rp) await postRepo.delete(rp.id);
    } else {
      originalPost.repostedBy.push(userId);
      await postRepo.create({
        userId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorUsername: user.username,
        authorAvatar: user.avatar || "",
        authorRole: user.tradingExperience || "",
        authorCity: user.city || "",
        authorCountry: user.country || "",
        content: `\u{1F504} Reposted from @${originalPost.authorUsername}: 

${originalPost.content}`,
        images: originalPost.images || [],
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        repostsCount: 0,
        likedBy: [],
        bookmarkedBy: [],
        repostedBy: [],
        tags: originalPost.tags || [],
        chart: originalPost.chart,
        isRepost: true,
        originalAuthorName: originalPost.authorName,
        isOfficial: false,
        isPinned: false,
        authorVerified: !!(user.mt5Connected || user.isVerified)
      });
      if (originalPost.userId !== userId) {
        await notifRepo.create({
          toUserId: originalPost.userId,
          fromUserId: userId,
          fromUserName: `${user.firstName} ${user.lastName}`,
          fromUserAvatar: user.avatar || "",
          type: "repost",
          message: "reposted your analysis",
          isRead: false,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        const author = await userRepo.findById(originalPost.userId);
        if (author) {
          const currentRep = author.reputationPoints || 0;
          const gain = calculateReputationGain(currentRep, 3);
          author.reputationPoints = currentRep + gain;
          await userRepo.update(originalPost.userId, author);
        }
      }
      try {
        const followRepo = new FollowRepository();
        const followerIds = await followRepo.listFollowers(userId);
        const authorFullName = `${user.firstName} ${user.lastName}`.trim();
        for (const followerId of followerIds) {
          const newNotif = {
            id: "notify_repost_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            toUserId: followerId,
            fromUserId: userId,
            fromUserName: authorFullName,
            fromUserAvatar: user.avatar || "",
            type: "friend_post",
            message: `${authorFullName} (yang Anda ikuti) membagikan ulang postingan dari ${originalPost.authorName}.`,
            isRead: false,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          await notifRepo.create(newNotif);
          if (req.db) {
            if (!req.db.notifications) req.db.notifications = [];
            req.db.notifications.unshift(newNotif);
          }
        }
      } catch (notifErr) {
        console.warn("Error sending repost notification to followers:", notifErr);
      }
    }
    originalPost.repostsCount = originalPost.repostedBy.length;
    await postRepo.update(originalPost);
    res.json({ success: true, repostsCount: originalPost.repostsCount });
  });
  app.get("/api/posts/:postId/comments", async (req, res) => {
    const commentRepo = new CommentRepository();
    const userRepo = new UserRepository();
    const comments = await commentRepo.listByPostId(req.params.postId);
    const enrichedComments = await Promise.all(comments.map(async (c) => {
      const cAuthor = await userRepo.findById(c.userId);
      return {
        ...c,
        authorCity: cAuthor ? cAuthor.city : c.authorCity || "Tasikmalaya",
        authorCountry: cAuthor ? cAuthor.country : c.authorCountry || "Indonesia",
        authorVerified: cAuthor ? !!(cAuthor.mt5Connected || cAuthor.isVerified) : !!c.authorVerified
      };
    }));
    res.json(enrichedComments);
  });
  app.get("/api/messages/sessions/:userId", async (req, res) => {
    const uid = req.params.userId;
    const userRepo = new UserRepository();
    const messageRepo = new MessageRepository();
    const connRepo = new ConnectionRepository();
    const user = await userRepo.findById(uid);
    if (!user) return res.status(404).json({ error: "User not found" });
    const msgs = await messageRepo.listAllForUser(uid);
    const connections = await connRepo.list();
    const acceptedPartners = new Set(
      connections.filter((c) => c.status === "accepted").map((c) => c.requesterId === uid ? c.receiverId : c.receiverId === uid ? c.requesterId : null).filter(Boolean)
    );
    const partnerIds = Array.from(new Set(msgs.map((m) => m.senderId === uid ? m.receiverId : m.senderId))).filter((pId) => pId && typeof pId === "string" && !pId.startsWith("group_"));
    const sessions = await Promise.all(partnerIds.map(async (pId) => {
      const partner = await userRepo.findById(pId);
      if (!partner) return null;
      const userMsgs = msgs.filter((m) => m.senderId === uid && m.receiverId === pId || m.senderId === pId && m.receiverId === uid);
      userMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastMsg = userMsgs[userMsgs.length - 1];
      const unreadCount = userMsgs.filter((m) => m.senderId === pId && m.receiverId === uid && !m.isRead).length;
      const isConnected = acceptedPartners.has(partner.id);
      return {
        userId: partner.id,
        username: partner.username,
        firstName: partner.firstName,
        lastName: partner.lastName,
        city: partner.city,
        country: partner.country,
        avatar: partner.avatar,
        lastMessage: lastMsg ? lastMsg.content : "",
        lastMessageTime: lastMsg ? lastMsg.timestamp : "",
        unreadCount,
        isGroup: false,
        isConnected
      };
    }));
    const filteredSessions = sessions.filter((s) => s !== null);
    if (user.city) {
      const cityKey = user.city.toLowerCase().replace(/\s+/g, "_");
      const cityGroupId = `group_city_${cityKey}`;
      const cityGroupMsgs = msgs.filter((m) => m.receiverId === cityGroupId);
      cityGroupMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastCityMsg = cityGroupMsgs[cityGroupMsgs.length - 1];
      filteredSessions.unshift({
        userId: cityGroupId,
        username: cityGroupId,
        firstName: `Grup ${user.city}`,
        lastName: "",
        city: user.city,
        country: user.country || "Indonesia",
        province: user.province || "",
        avatar: "GC",
        lastMessage: lastCityMsg ? lastCityMsg.content : `Selamat datang di grup chat ${user.city}!`,
        lastMessageTime: lastCityMsg ? lastCityMsg.timestamp : (/* @__PURE__ */ new Date()).toISOString(),
        unreadCount: 0,
        isGroup: true,
        groupType: "city"
      });
    }
    if (user.province) {
      const provinceKey = user.province.toLowerCase().replace(/\s+/g, "_");
      const provinceGroupId = `group_province_${provinceKey}`;
      const provinceGroupMsgs = msgs.filter((m) => m.receiverId === provinceGroupId);
      provinceGroupMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastProvinceMsg = provinceGroupMsgs[provinceGroupMsgs.length - 1];
      filteredSessions.unshift({
        userId: provinceGroupId,
        username: provinceGroupId,
        firstName: `Grup ${user.province}`,
        lastName: "",
        city: user.city || "Singapore",
        country: user.country || "Indonesia",
        province: user.province,
        avatar: "GP",
        lastMessage: lastProvinceMsg ? lastProvinceMsg.content : `Selamat datang di grup chat ${user.province}!`,
        lastMessageTime: lastProvinceMsg ? lastProvinceMsg.timestamp : (/* @__PURE__ */ new Date()).toISOString(),
        unreadCount: 0,
        isGroup: true,
        groupType: "province"
      });
    }
    res.json(filteredSessions);
  });
  app.get("/api/messages/history", async (req, res) => {
    const { userId, partnerId } = req.query;
    if (!userId || !partnerId) return res.status(400).json({ error: "Missing parameters" });
    const messageRepo = new MessageRepository();
    const userRepo = new UserRepository();
    const isGroup = partnerId.startsWith("group_");
    let chatHistory = await messageRepo.listHistory(userId, partnerId);
    chatHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let enrichedHistory = await Promise.all(chatHistory.map(async (m) => {
      const sender = await userRepo.findById(m.senderId);
      return {
        ...m,
        senderName: sender ? `${sender.firstName} ${sender.lastName}` : m.senderId === "tarapti_official" ? "Tarapti Official" : "Trader",
        senderAvatar: sender ? sender.avatar : m.senderId === "tarapti_official" ? "TO" : "TR"
      };
    }));
    if (isGroup) {
      const groupName = partnerId.replace("group_city_", "").replace("group_province_", "").replace(/_/g, " ");
      const uppercaseGroupName = groupName.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const welcomeMessage = {
        id: `welcome_${partnerId}`,
        senderId: "tarapti_official",
        receiverId: partnerId,
        content: `Selamat datang di grup chat ${uppercaseGroupName}! Grup ini dirancang sebagai wadah komunikasi, berbagi sinyal, dan diskusi analisa market bagi para trader yang berdomisili di wilayah yang sama. Tetap patuhi aturan, hargai sesama trader, dan selamat bertransaksi!`,
        timestamp: new Date((/* @__PURE__ */ new Date()).getTime() - 365 * 24 * 3600 * 1e3).toISOString(),
        // 1 year ago to keep it at the top
        isRead: true,
        senderName: "Tarapti Official",
        senderAvatar: "TO"
      };
      if (!enrichedHistory.some((m) => m.id === `welcome_${partnerId}`)) {
        enrichedHistory = [welcomeMessage, ...enrichedHistory];
      }
    }
    if (!isGroup) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await messageRepo.markAsRead(partnerId, userId);
      enrichedHistory = enrichedHistory.map((m) => {
        if (m.senderId === partnerId && m.receiverId === userId && !m.isRead) {
          return { ...m, isRead: true, read_at: now, readAt: now };
        }
        return m;
      });
      if (req.db && req.db.messages) {
        req.db.messages.forEach((m) => {
          if (m.senderId === partnerId && m.receiverId === userId && !m.isRead) {
            m.isRead = true;
            m.read_at = now;
            m.readAt = now;
          }
        });
      }
    }
    res.json(enrichedHistory);
  });
  app.post("/api/messages", async (req, res) => {
    try {
      const { senderId, receiverId, content, image, fileUrl, fileName } = req.body;
      if (!senderId || !receiverId || !content && !image && !fileUrl) {
        return res.status(400).json({ error: "Missing message payload" });
      }
      const messageRepo = new MessageRepository();
      const userRepo = new UserRepository();
      const notifRepo = new NotificationRepository();
      const newMessage = await messageRepo.create({
        senderId,
        receiverId,
        content: content || "",
        image: image || void 0,
        fileUrl: fileUrl || void 0,
        fileName: fileName || void 0,
        reactions: [],
        isRead: false,
        isDelivered: true,
        read_at: null,
        readAt: null
      });
      let sender = await userRepo.findById(senderId);
      if (!sender) {
        try {
          const uObj = await authService.getCurrentUser(senderId);
          if (uObj) {
            sender = { ...uObj.user, ...uObj.profile };
            await userRepo.create(sender);
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (!sender) return res.status(404).json({ error: "Sender not found" });
      if (receiverId.startsWith("group_")) {
        const isCity = receiverId.startsWith("group_city_");
        const groupValue = receiverId.replace("group_city_", "").replace("group_province_", "").replace(/_/g, " ").toLowerCase();
        const allUsers = await userRepo.list();
        const groupUsers = allUsers.filter((u) => {
          if (u.id === senderId) return false;
          if (isCity) {
            return u.city && u.city.toLowerCase() === groupValue;
          } else {
            return u.province && u.province.toLowerCase() === groupValue;
          }
        });
        for (const targetUser of groupUsers) {
          await notifRepo.create({
            toUserId: targetUser.id,
            fromUserId: senderId,
            fromUserName: `${sender.firstName} ${sender.lastName}`,
            fromUserAvatar: sender.avatar || "",
            type: "message",
            message: `mengirim pesan di grup ${isCity ? sender.city : sender.province}: "${content ? content.substring(0, 30) : "Gambar"}"`,
            isRead: false,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } else {
        const receiver = await userRepo.findById(receiverId);
        if (receiver) {
          await notifRepo.create({
            toUserId: receiverId,
            fromUserId: senderId,
            fromUserName: `${sender.firstName} ${sender.lastName}`,
            fromUserAvatar: sender.avatar || "",
            type: "message",
            message: `sent you a message: "${content ? content.substring(0, 30) : "Image"}"`,
            isRead: false,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      res.json(newMessage);
    } catch (err) {
      console.error("Error in POST /api/messages:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.post("/api/messages/:messageId/react", async (req, res) => {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;
    if (!userId || !emoji) {
      return res.status(400).json({ error: "Missing user ID or emoji" });
    }
    const messageRepo = new MessageRepository();
    const message = await messageRepo.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (!message.reactions) message.reactions = [];
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId === userId && r.emoji === emoji
    );
    if (existingReactionIndex >= 0) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions.push({ userId, emoji });
    }
    await messageRepo.update(message);
    res.json({ success: true, reactions: message.reactions });
  });
  app.delete("/api/messages/:messageId", async (req, res) => {
    const { messageId } = req.params;
    const userId = req.body?.userId || req.query?.userId;
    const messageRepo = new MessageRepository();
    if (!userId) {
      return res.status(400).json({ error: "userId is required for deletion" });
    }
    const message = await messageRepo.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.senderId !== userId) {
      return res.status(403).json({ error: "Unauthorized: Only the sender can delete this message" });
    }
    try {
      await messageRepo.delete(messageId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/notifications", async (req, res) => {
    const { toUserId, fromUserId, fromUserName, fromUserAvatar, type, message } = req.body;
    const notifRepo = new NotificationRepository();
    const newNotification = await notifRepo.create({
      toUserId,
      fromUserId: fromUserId || "system",
      fromUserName: fromUserName || "Tarapti Alert",
      fromUserAvatar: fromUserAvatar || "\u{1F6A8}",
      type: type || "market_pulse",
      message,
      isRead: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json(newNotification);
  });
  app.get("/api/notifications/:userId", async (req, res) => {
    const notifRepo = new NotificationRepository();
    const userNotifications = await notifRepo.listByUserId(req.params.userId);
    userNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(userNotifications);
  });
  app.put("/api/notifications/:notificationId/read", async (req, res) => {
    const notifRepo = new NotificationRepository();
    const notification = await notifRepo.findById(req.params.notificationId);
    if (notification) {
      notification.isRead = true;
      await notifRepo.update(notification.id, notification);
    }
    res.json({ success: true });
  });
  app.put("/api/notifications/user/:userId/read-all", async (req, res) => {
    const notifRepo = new NotificationRepository();
    await notifRepo.markAllAsRead(req.params.userId);
    res.json({ success: true });
  });
  app.delete("/api/notifications/user/:userId/market_pulse", async (req, res) => {
    const notifRepo = new NotificationRepository();
    const notifs = await notifRepo.listByUserId(req.params.userId);
    const toDelete = notifs.filter((n) => n.type === "market_pulse");
    for (const n of toDelete) {
      await notifRepo.delete(n.id);
    }
    res.json({ success: true });
  });
  app.get("/api/leaderboard", async (req, res) => {
    const { period } = req.query;
    const userRepo = new UserRepository();
    const sortedUsers = (await userRepo.list()).sort((a, b) => (b.reputationPoints || 0) - (a.reputationPoints || 0));
    const contributors = sortedUsers.map((u, i) => {
      const scale = period === "weekly" ? 0.3 : period === "monthly" ? 0.7 : 1;
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        city: u.city,
        country: u.country,
        avatar: u.avatar,
        experience: u.tradingExperience,
        reputation: Math.round(u.reputationPoints * scale),
        postsCount: req.db.posts.filter((p) => p.userId === u.id).length,
        rank: i + 1
      };
    });
    const helpful = [...sortedUsers].sort((a, b) => b.reputationPoints * 1.2 - a.reputationPoints * 0.9).map((u, i) => {
      const scale = period === "weekly" ? 0.25 : period === "monthly" ? 0.65 : 1;
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        city: u.city,
        country: u.country,
        avatar: u.avatar,
        experience: u.tradingExperience,
        score: Math.round((u.reputationPoints + 50) * scale),
        rank: i + 1
      };
    });
    const active = [...sortedUsers].sort((a, b) => uOnlineWeight(b) - uOnlineWeight(a)).map((u, i) => {
      const scale = period === "weekly" ? 0.4 : period === "monthly" ? 0.8 : 1;
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        city: u.city,
        country: u.country,
        avatar: u.avatar,
        experience: u.tradingExperience,
        activityIndex: Math.round((u.reputationPoints * 0.1 + 15) * scale),
        rank: i + 1
      };
    });
    function uOnlineWeight(u) {
      let weight = u.reputationPoints;
      if (u.onlineStatus === "online") weight += 500;
      return weight;
    }
    res.json({ contributors, helpful, active });
  });
  const VOLATILITY_EVENTS = {
    "Forex": [
      "US Dollar Index (DXY) surges +1.5% following hot inflation print!",
      "GBP/USD drops 120 pips as Bank of England shifts dovish.",
      "EUR/USD spikes to 3-week highs on unexpected Eurozone GDP growth.",
      "USD/JPY breaks above 150.00, triggering suspected government intervention warnings!"
    ],
    "Crypto": [
      "Bitcoin drops 6.5% in 20 minutes as long liquidations top $300M!",
      "Ethereum gas fees surge 400% amid high volume decentralized exchange swaps.",
      "Solana spikes +12% breaking key resistance at $160.",
      "Crypto market cap gains $80B in 2 hours as ETF inflows reach record highs."
    ],
    "Stocks": [
      "NVIDIA shares jump +8.2% in pre-market trading after blowout earnings!",
      "Tech sector sell-off drags S&P 500 down by 1.8% at the market open.",
      "Tesla drops 5% on regulatory filing showing margin contractions.",
      "Apple reaches new record high, leading a broad-based equities rally."
    ],
    "Indices": [
      "NASDAQ 100 VIX index rises by 25%, marking extreme intraday swings!",
      "Dow Jones Industrial Average drops 500 points on hawkish Fed minutes.",
      "Nikkei 225 drops 3% overnight following monetary policy rate hike.",
      "S&P 500 breaks historic 5,500 milestone with high sector rotation volatility."
    ],
    "Commodities": [
      "Crude Oil spikes +4.5% due to Middle East supply disruption concerns.",
      "Gold (XAU/USD) shoots past $2,450 to all-time high on safe haven inflows!",
      "Natural Gas down 7.2% as weather forecasts predict milder temperatures.",
      "Silver gains +5% in heavy volume breakout, catching up to Gold's bull run."
    ]
  };
  function triggerMarketPulse(db, saveFn, assetClass, customMsg) {
    const assets = ["Forex", "Crypto", "Stocks", "Indices", "Commodities"];
    const chosenAsset = assetClass || assets[Math.floor(Math.random() * assets.length)];
    const events = VOLATILITY_EVENTS[chosenAsset] || [];
    const messageText = customMsg || events[Math.floor(Math.random() * events.length)];
    const usersToNotify = db.users.filter((u) => {
      if (!u.marketPulseEnabled) return false;
      const followedAssets = u.marketPulseAssets || [u.tradingAsset];
      return followedAssets.includes(chosenAsset);
    });
    if (usersToNotify.length === 0) return { chosenAsset, notifiedCount: 0, messageText };
    usersToNotify.forEach((user) => {
      db.notifications.push({
        id: "notify_mp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        toUserId: user.id,
        fromUserId: "system",
        fromUserName: "Market Pulse",
        fromUserAvatar: "\u26A1",
        type: "market_pulse",
        message: `High Volatility Alert (${chosenAsset}): ${messageText}`,
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        assetClass: chosenAsset
      });
    });
    saveFn();
    return { chosenAsset, notifiedCount: usersToNotify.length, messageText };
  }
  app.post("/api/pwa/subscribe", (req, res) => {
    const { subscription } = req.body;
    if (subscription) {
      req.db.pushSubscriptions = req.db.pushSubscriptions || [];
      req.db.pushSubscriptions.push(subscription);
      if (typeof req.save === "function") req.save();
    }
    res.json({ success: true });
  });
  app.post("/api/pwa/market-pulse/simulate", (req, res) => {
    const { assetClass, message } = req.body;
    const result = triggerMarketPulse(req.db, req.save, assetClass, message);
    res.json({ success: true, ...result });
  });
  setInterval(() => {
    try {
      const db = loadDb();
      const hasEnabledUsers = db.users.some((u) => u.marketPulseEnabled);
      if (hasEnabledUsers) {
        const result = triggerMarketPulse(db, () => saveDb(db));
        console.log(`[Market Pulse Background] Triggered volatility spike for ${result.chosenAsset}. Notified ${result.notifiedCount} traders.`);
      }
    } catch (e) {
      console.error("[Market Pulse Background Error]:", e);
    }
  }, 45e3);
  const getAdminSettings = (db) => {
    if (!db.adminSettings) {
      db.adminSettings = {
        mt5Server: "axi-live-server",
        mt5Login: "2091384",
        mt5Password: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
        mt5Port: "443",
        mt5Status: "connected",
        newsProvider: "rss",
        newsRssUrl: "https://www.forexlive.com/rss",
        newsApiKey: "",
        telegramBotToken: "",
        telegramChatId: "",
        fcmServerKey: ""
      };
    }
    return db.adminSettings;
  };
  app.get("/api/admin/settings", authenticate, (req, res) => {
    res.json(getAdminSettings(req.db));
  });
  app.post("/api/admin/settings", authenticate, (req, res) => {
    const settings = getAdminSettings(req.db);
    Object.assign(settings, req.body);
    if (typeof req.save === "function") req.save();
    res.json({ success: true, settings });
  });
  app.post("/api/admin/mt5/test", authenticate, (req, res) => {
    const { mt5Server, mt5Login, mt5Password, mt5Port } = req.body;
    if (!mt5Server || !mt5Login || !mt5Password) {
      return res.status(400).json({ error: "Missing required MT5 configuration fields" });
    }
    setTimeout(() => {
      try {
        const isSuccess = mt5Login !== "fail";
        if (isSuccess) {
          req.db.adminSettings = req.db.adminSettings || {};
          req.db.adminSettings.mt5Status = "connected";
          if (typeof req.save === "function") req.save();
          res.json({ success: true, message: `Successfully connected to MetaTrader 5 server: ${mt5Server} for Login ID: ${mt5Login}` });
        } else {
          res.status(400).json({ error: "Failed to establish socket connection with MT5 server. Please verify credentials and server state." });
        }
      } catch (err) {
        console.error("Error in MT5 test simulation:", err);
        if (!res.headersSent) res.status(500).json({ error: "Internal server error during simulation" });
      }
    }, 800);
  });
  app.get("/api/metatrader/account", authenticate, async (req, res) => {
    try {
      const mtService = new MetaTraderService();
      const account = await mtService.getConnectedAccount(req.userId);
      res.json({ account });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/metatrader/connect", authenticate, async (req, res) => {
    const { platform, login, password, server, broker } = req.body;
    if (!platform || !login || !password || !server) {
      return res.status(400).json({ error: "Missing required connection details" });
    }
    try {
      const mtService = new MetaTraderService();
      const account = await mtService.connectAccount(req.userId, platform, login, server, broker);
      try {
        const userRepo = new UserRepository();
        const user = await userRepo.findById(req.userId);
        if (user) {
          const followRepo = new FollowRepository();
          const notifRepo = new NotificationRepository();
          const followerIds = await followRepo.listFollowers(req.userId);
          const authorFullName = `${user.firstName} ${user.lastName}`.trim();
          for (const followerId of followerIds) {
            const newNotif = {
              id: "notify_mt5_connect_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              toUserId: followerId,
              fromUserId: req.userId,
              fromUserName: authorFullName,
              fromUserAvatar: user.avatar || "",
              type: "friend_post",
              message: `${authorFullName} (yang Anda ikuti) baru saja menghubungkan akun trading MetaTrader (${platform}) baru!`,
              isRead: false,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            };
            await notifRepo.create(newNotif);
            if (req.db) {
              if (!req.db.notifications) req.db.notifications = [];
              req.db.notifications.unshift(newNotif);
            }
          }
        }
      } catch (notifErr) {
        console.warn("Error notifying followers of MT5 connection:", notifErr);
      }
      res.json({ success: true, account });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/metatrader/disconnect", authenticate, async (req, res) => {
    try {
      const mtService = new MetaTraderService();
      await mtService.disconnectAccount(req.userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/metatrader/trades", authenticate, async (req, res) => {
    try {
      const mtService = new MetaTraderService();
      const trades = await mtService.getTrades(req.userId);
      res.json({ trades });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/metatrader/sync", authenticate, async (req, res) => {
    try {
      const mtService = new MetaTraderService();
      const result = await mtService.syncTrades(req.userId);
      try {
        const userRepo = new UserRepository();
        const user = await userRepo.findById(req.userId);
        if (user) {
          const followRepo = new FollowRepository();
          const notifRepo = new NotificationRepository();
          const followerIds = await followRepo.listFollowers(req.userId);
          const authorFullName = `${user.firstName} ${user.lastName}`.trim();
          for (const followerId of followerIds) {
            const newNotif = {
              id: "notify_mt5_sync_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              toUserId: followerId,
              fromUserId: req.userId,
              fromUserName: authorFullName,
              fromUserAvatar: user.avatar || "",
              type: "friend_post",
              message: `${authorFullName} (yang Anda ikuti) baru saja menyinkronkan aktivitas trading terbarunya.`,
              isRead: false,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            };
            await notifRepo.create(newNotif);
            if (req.db) {
              if (!req.db.notifications) req.db.notifications = [];
              req.db.notifications.unshift(newNotif);
            }
          }
        }
      } catch (notifErr) {
        console.warn("Error notifying followers of MT5 sync:", notifErr);
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/news/sync", authenticate, (req, res) => {
    const { newsProvider, newsRssUrl, newsApiKey } = req.body;
    setTimeout(() => {
      try {
        const articles = [
          { title: "USD/JPY Breaks 158.50 as Yield Differentials Diverge", source: "ForexLive", time: "Just Now" },
          { title: "ECB Policymakers Signal Cautious Approach on Upcoming Rate Cuts", source: "Tarapti News Feed", time: "15 mins ago" },
          { title: "Gold Consolidation Continues Ahead of US Retail Sales Report", source: newsProvider === "rss" ? "Custom RSS" : "NewsAPI", time: "45 mins ago" }
        ];
        res.json({
          success: true,
          message: `Successfully synchronized news from ${newsProvider === "rss" ? newsRssUrl : "NewsAPI"}`,
          articles
        });
      } catch (err) {
        console.error("Error in news sync simulation:", err);
        if (!res.headersSent) res.status(500).json({ error: "Internal server error during news sync" });
      }
    }, 600);
  });
  app.get("/api/admin/users", authenticate, async (req, res) => {
    const userRepo = new UserRepository();
    const users = await userRepo.list();
    const safeUsers = (users || []).map(({ password, ...u }) => u);
    res.json(safeUsers);
  });
  app.put("/api/admin/users/:userId", authenticate, async (req, res) => {
    const { userId } = req.params;
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { firstName, lastName, username, email, tradingExperience, tradingAsset, reputationPoints, role, onlineStatus } = req.body;
    const updatedFields = {};
    if (firstName !== void 0) updatedFields.firstName = firstName;
    if (lastName !== void 0) updatedFields.lastName = lastName;
    if (username !== void 0) updatedFields.username = username;
    if (email !== void 0) updatedFields.email = email;
    if (tradingExperience !== void 0) updatedFields.tradingExperience = tradingExperience;
    if (tradingAsset !== void 0) updatedFields.tradingAsset = tradingAsset;
    if (reputationPoints !== void 0) updatedFields.reputationPoints = Number(reputationPoints);
    if (role !== void 0) updatedFields.role = role;
    if (onlineStatus !== void 0) updatedFields.onlineStatus = onlineStatus;
    await userRepo.update(userId, updatedFields);
    res.json({ success: true, user: { ...user, ...updatedFields } });
  });
  app.delete("/api/admin/users/:userId", authenticate, async (req, res) => {
    const { userId } = req.params;
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await userRepo.delete(userId);
    res.json({ success: true, message: "User deleted successfully" });
  });
  app.post("/api/notifications/test-trigger", async (req, res) => {
    const { userId, eventType } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const userRepo = new UserRepository();
    const targetUser = await userRepo.findById(userId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    const allUsers = await userRepo.list();
    const sampleSender = (allUsers || []).find((u) => u.id !== userId) || {
      id: "user_sim",
      firstName: "Sarah",
      lastName: "Jenkins",
      username: "sarah_trades",
      avatar: "SJ"
    };
    let notification;
    let eventName = "NOTIFICATION";
    if (eventType === "friend_request") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "friend_request",
        message: "wants to connect with you",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "FRIEND_REQUEST";
    } else if (eventType === "friend_accepted") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "friend_accepted",
        message: "accepted your connection request!",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "FRIEND_ACCEPTED";
    } else if (eventType === "new_message") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "message",
        message: "sent you a message: 'Hello! How is your XAUUSD market setup today?'",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "NEW_MESSAGE";
    } else if (eventType === "profit_target_daily") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "\u{1F3AF}",
        type: "profit_target_daily",
        message: "\u{1F3AF} Target Profit Harian Tercapai! Selama sesi ini Anda menghasilkan +$520.00 (+5.2%).",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === "profit_target_weekly") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "\u{1F680}",
        type: "profit_target_weekly",
        message: "\u{1F680} Target Profit Mingguan Tercapai! Akumulasi minggu ini: +$1,850.00 (+18.5%). Performa luar biasa!",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === "drawdown_daily") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "\u26A0\uFE0F",
        type: "drawdown_daily",
        message: "\u26A0\uFE0F Peringatan Drawdown Harian! Loss harian mencapai -2.8% (mendekati batas toleransi -3.0%).",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === "drawdown_weekly") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_risk_guard",
        fromUserName: "Risk Guard Engine",
        fromUserAvatar: "\u{1F6A8}",
        type: "drawdown_weekly",
        message: "\u{1F6A8} Batas Max Drawdown Mingguan Reached! Drawdown -5.1% tercapai. Proteksi posisi otomatis aktif.",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "NOTIFICATION";
    } else if (eventType === "high_news") {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: "system_news_radar",
        fromUserName: "Economic News Radar",
        fromUserAvatar: "\u{1F534}",
        type: "high_news",
        message: "\u{1F534} High Impact Economic News: US Non-Farm Payrolls (NFP) & Unemployment Rate rilis dalam 15 menit!",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "NOTIFICATION";
    } else {
      notification = {
        id: "notify_test_" + Date.now(),
        toUserId: userId,
        fromUserId: sampleSender.id,
        fromUserName: `${sampleSender.firstName} ${sampleSender.lastName}`,
        fromUserAvatar: sampleSender.avatar,
        type: "like",
        message: "liked your technical analysis post",
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      eventName = "NOTIFICATION";
    }
    req.db.notifications.push(notification);
    if (typeof req.save === "function") req.save();
    res.json({ success: true, notification, eventName });
  });
  app.post("/api/admin/broadcast", authenticate, async (req, res) => {
    const { message, type } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Broadcast message cannot be empty" });
    }
    const senderId = "user_1";
    const userRepo = new UserRepository();
    const notificationRepo = new NotificationRepository();
    const sender = await userRepo.findById(senderId) || { firstName: "System", lastName: "Admin", avatar: "SA" };
    const allUsers = await userRepo.list();
    let count = 0;
    for (const user of allUsers || []) {
      const notification = {
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        toUserId: user.id,
        fromUserId: senderId,
        fromUserName: `${sender.firstName} ${sender.lastName}`,
        fromUserAvatar: sender.avatar,
        type: type || "market_pulse",
        message,
        isRead: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      await notificationRepo.create(notification);
      count++;
    }
    res.json({ success: true, message: `Successfully broadcasted to ${count} users.` });
  });
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = await authService.getCurrentUser(req.userId);
      res.json({ success: true, data: user, error: null });
    } catch (e) {
      res.status(500).json({ success: false, data: null, error: { code: "AUTH_INTERNAL_ERROR", message: e.message } });
    }
  });
  app.get("/api/auth/sessions", authenticate, async (req, res) => {
    try {
      const sessions = await authService.listSessions(req.userId);
      res.json({ success: true, data: sessions, error: null });
    } catch (e) {
      res.status(500).json({ success: false, data: null, error: { code: "AUTH_INTERNAL_ERROR", message: e.message } });
    }
  });
  app.delete("/api/auth/sessions/:id", authenticate, async (req, res) => {
    try {
      await authService.revokeSession(req.params.id);
      res.json({ success: true, data: null, error: null });
    } catch (e) {
      res.status(500).json({ success: false, data: null, error: { code: "AUTH_INTERNAL_ERROR", message: e.message } });
    }
  });
  app.delete("/api/auth/sessions", authenticate, async (req, res) => {
    try {
      await authService.revokeAllSessions(req.userId);
      res.json({ success: true, data: null, error: null });
    } catch (e) {
      res.status(500).json({ success: false, data: null, error: { code: "AUTH_INTERNAL_ERROR", message: e.message } });
    }
  });
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "API_NOT_FOUND",
        message: `API route not found: ${req.originalUrl}`
      }
    });
  });
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "API_NOT_FOUND",
        message: `API route not found: ${req.originalUrl}`
      }
    });
  });
  app.use((err, req, res, next) => {
    console.error("Global express error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  });
  app.use(import_express.default.static(import_path.default.join(process.cwd(), "public")));
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        hmr: false
        // Disable HMR WebSocket creation to prevent socket connection errors
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Tarapti Server running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("FATAL: Failed to start express server:", err);
});
//# sourceMappingURL=server.cjs.map
