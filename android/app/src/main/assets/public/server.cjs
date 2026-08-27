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
var import_path5 = __toESM(require("path"), 1);
var import_fs5 = __toESM(require("fs"), 1);
var import_vite = require("vite");

// src/lib/supabaseClient.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseClient = null;
var warnLogged = false;
var getSupabase = () => {
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
  if (!supabaseUrl && process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    console.log("SUPABASE_URL not set directly, attempting derivation from DATABASE_URL...");
    const supabaseCoMatch = dbUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/) || dbUrl.match(/db\.([a-z0-9]+)\.supabase\.co/);
    const poolerMatch = dbUrl.match(/postgres\.([a-z0-9]+):/);
    if (supabaseCoMatch && supabaseCoMatch[1]) {
      supabaseUrl = `https://${supabaseCoMatch[1]}.supabase.co`;
    } else if (poolerMatch && poolerMatch[1]) {
      supabaseUrl = `https://${poolerMatch[1]}.supabase.co`;
    }
    if (supabaseUrl) {
      console.log(`Successfully derived Supabase API URL: ${supabaseUrl}`);
    }
  }
  if (supabaseUrl && (supabaseUrl.startsWith("postgresql://") || supabaseUrl.startsWith("postgres://"))) {
    console.log("Detected PostgreSQL URL in SUPABASE_URL, attempting to extract Supabase API URL...");
    const match = supabaseUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/) || supabaseUrl.match(/db\.([a-z0-9]+)\.supabase\.co/) || supabaseUrl.match(/postgres\.([a-z0-9]+):/);
    if (match && match[1]) {
      const ref = match[1];
      supabaseUrl = `https://${ref}.supabase.co`;
      console.log(`Derived Supabase API URL: ${supabaseUrl}`);
    } else {
      console.warn("Could not derive Supabase API URL from PostgreSQL string.");
    }
  }
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    if (!warnLogged) {
      console.warn("Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY) are missing or incomplete. Operating in robust local/mock fallback mode.");
      warnLogged = true;
    }
    return null;
  }
  try {
    console.log(`Initializing Supabase client with URL: ${supabaseUrl}`);
    supabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return supabaseClient;
  } catch (err) {
    console.error("Failed to create Supabase client:", err);
    return null;
  }
};
var createMockChain = () => {
  const target = () => {
  };
  const realPromise = Promise.resolve({ data: null, error: { message: "Supabase credentials not configured" } });
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
        return () => realPromise;
      }
      return () => proxy;
    }
  });
  return proxy;
};
var supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      if (prop === "from") {
        return () => createMockChain();
      }
      return void 0;
    }
    const value = client[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});

// src/repositories/AuthRepositories.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DB_FILE = import_path.default.join(process.cwd(), "db_store.json");
function readLocalUsers() {
  if (import_fs.default.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(import_fs.default.readFileSync(DB_FILE, "utf-8"));
      return data.users || [];
    } catch (e) {
      console.error("Failed to read local users:", e);
    }
  }
  return [];
}
function writeLocalUsers(users) {
  if (import_fs.default.existsSync(DB_FILE)) {
    try {
      const db = JSON.parse(import_fs.default.readFileSync(DB_FILE, "utf-8"));
      db.users = users;
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error("Failed to write local users:", e);
    }
  }
}
var UserRepository = class {
  async findByEmail(email) {
    try {
      const { data, error } = await supabase.from("User").select("*").eq("email", email).maybeSingle();
      if (!error && data) {
        return data;
      }
      throw error || new Error("No user data returned from Supabase");
    } catch (e) {
      console.warn("Supabase findByEmail failed, attempting local fallback:", e?.message || e);
      const localUsers = readLocalUsers();
      const user = localUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    }
  }
  async findById(id) {
    try {
      const { data, error } = await supabase.from("User").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        return data;
      }
      throw error || new Error("No user data returned from Supabase");
    } catch (e) {
      console.warn("Supabase findById failed, attempting local fallback:", e?.message || e);
      const localUsers = readLocalUsers();
      const user = localUsers.find((u) => u.id === id);
      return user || null;
    }
  }
  async create(user) {
    const userId = import_crypto.default.randomUUID();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const updatedAt = createdAt;
    const userToSave = {
      id: userId,
      ...user,
      createdAt,
      updatedAt
    };
    try {
      const payload = { ...userToSave };
      delete payload.status;
      const { data, error } = await supabase.from("User").insert(payload).select().single();
      if (!error && data) {
        return data;
      }
      throw error || new Error("Failed to create user in Supabase");
    } catch (e) {
      console.error("Supabase user creation threw error, saving locally:", e?.message || e);
      const localUsers = readLocalUsers();
      localUsers.push(userToSave);
      writeLocalUsers(localUsers);
      return userToSave;
    }
  }
  async updateStatus(id, status) {
    try {
      const { error } = await supabase.from("User").update({ status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update status in Supabase, updating locally:", e?.message || e);
      const localUsers = readLocalUsers();
      const user = localUsers.find((u) => u.id === id);
      if (user) {
        user.status = status;
        user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        writeLocalUsers(localUsers);
      }
    }
  }
  async updateLastLogin(id) {
    try {
      const { error } = await supabase.from("User").update({ updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update last login in Supabase, updating locally:", e?.message || e);
      const localUsers = readLocalUsers();
      const user = localUsers.find((u) => u.id === id);
      if (user) {
        user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        writeLocalUsers(localUsers);
      }
    }
  }
  async updatePassword(id, passwordHash) {
    try {
      const { error } = await supabase.from("User").update({ password: passwordHash, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update password in Supabase, updating locally:", e?.message || e);
      const localUsers = readLocalUsers();
      const user = localUsers.find((u) => u.id === id);
      if (user) {
        user.password = passwordHash;
        user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        writeLocalUsers(localUsers);
      }
    }
  }
  async list() {
    try {
      const { data, error } = await supabase.from("User").select("*");
      if (!error && data) {
        return data;
      }
      throw error || new Error("Failed to list users from Supabase");
    } catch (e) {
      console.warn("Supabase list users failed, returning local list fallback:", e?.message || e);
      return readLocalUsers();
    }
  }
  async update(id, updates) {
    try {
      const payload = { ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      const { error } = await supabase.from("User").update(payload).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update user in Supabase, updating locally:", e?.message || e);
      const localUsers = readLocalUsers();
      const userIndex = localUsers.findIndex((u) => u.id === id);
      if (userIndex !== -1) {
        localUsers[userIndex] = {
          ...localUsers[userIndex],
          ...updates,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        writeLocalUsers(localUsers);
      }
    }
  }
  async delete(id) {
    try {
      const { error } = await supabase.from("User").delete().eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to delete user in Supabase, deleting locally:", e?.message || e);
      const localUsers = readLocalUsers();
      const updated = localUsers.filter((u) => u.id !== id);
      writeLocalUsers(updated);
    }
  }
};
var ProfileRepository = class {
  async create(profile) {
    try {
      const payload = { ...profile };
      await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
    } catch (e) {
      console.error("Failed to upsert profile in Supabase:", e?.message || e);
    }
  }
  async getByUserId(userId) {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase getByUserId failed:", e?.message || e);
    }
    return null;
  }
  async update(userId, updates) {
    try {
      await supabase.from("profiles").update(updates).eq("user_id", userId);
    } catch (e) {
      console.error("Failed to update profile in Supabase:", e?.message || e);
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

// src/repositories/PostRepository.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var DB_FILE2 = import_path2.default.join(process.cwd(), "db_store.json");
var PostRepository = class {
  async list() {
    try {
      const { data, error } = await supabase.from("Post").select("*").order("timestamp", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Failed to list posts from Supabase, attempting local fallback:", e?.message || e);
      if (import_fs2.default.existsSync(DB_FILE2)) {
        try {
          const data = JSON.parse(import_fs2.default.readFileSync(DB_FILE2, "utf-8"));
          return data.posts || [];
        } catch (e2) {
          console.error("Failed to load local posts:", e2);
        }
      }
      return [];
    }
  }
  async create(post) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const id = "post_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const record = { ...post, id, timestamp };
    try {
      const { data, error } = await supabase.from("Post").insert(record).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Failed to create post in Supabase, saving locally:", e);
      if (import_fs2.default.existsSync(DB_FILE2)) {
        try {
          const db = JSON.parse(import_fs2.default.readFileSync(DB_FILE2, "utf-8"));
          if (!db.posts) {
            db.posts = [];
          }
          db.posts.push(record);
          import_fs2.default.writeFileSync(DB_FILE2, JSON.stringify(db, null, 2));
        } catch (err) {
          console.error("Failed to save post locally:", err);
        }
      }
      return record;
    }
  }
  async findById(id) {
    try {
      const { data, error } = await supabase.from("Post").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Failed to find post by id in Supabase:", e);
      return null;
    }
  }
  async delete(id) {
    try {
      const { error } = await supabase.from("Post").delete().eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to delete post in Supabase:", e);
    }
  }
  async update(post) {
    try {
      const { error } = await supabase.from("Post").update(post).eq("id", post.id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update post in Supabase:", e);
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
      const { data, error } = await supabase.from("Message").select("*").order("timestamp", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Failed to list messages from Supabase:", e);
      return [];
    }
  }
  async listAllForUser(userId) {
    try {
      const { data, error } = await supabase.from("Message").select("*").or(`senderId.eq.${userId},receiverId.eq.${userId}`);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Failed to list messages for user from Supabase:", e?.message || e);
      return [];
    }
  }
  async listHistory(userId, partnerId) {
    const isGroup = partnerId.startsWith("group_");
    try {
      if (isGroup) {
        const { data, error } = await supabase.from("Message").select("*").eq("receiverId", partnerId);
        if (error) throw error;
        return data || [];
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
      const { data, error } = await supabase.from("Message").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Failed to find message by id from Supabase:", e);
      return null;
    }
  }
  async create(message) {
    const id = "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const record = { ...message, id, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    try {
      const { data, error } = await supabase.from("Message").insert(record).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Failed to create message in Supabase, using local fallback:", e);
      return record;
    }
  }
  async update(message) {
    try {
      const { error } = await supabase.from("Message").update(message).eq("id", message.id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update message in Supabase:", e);
    }
  }
  async markAsRead(senderId, receiverId) {
    try {
      const { error } = await supabase.from("Message").update({ isRead: true }).match({ senderId, receiverId, isRead: false });
      if (error) throw error;
    } catch (e) {
      console.error("Failed to mark messages as read in Supabase:", e);
    }
  }
};

// src/repositories/NotificationRepository.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var DB_FILE3 = import_path3.default.join(process.cwd(), "db_store.json");
function getLocalNotifications() {
  try {
    if (import_fs3.default.existsSync(DB_FILE3)) {
      const content = import_fs3.default.readFileSync(DB_FILE3, "utf-8");
      if (content && content.trim()) {
        const db = JSON.parse(content);
        return db.notifications || [];
      }
    }
  } catch (e) {
    console.error("Error reading local notifications:", e);
  }
  return [];
}
function saveLocalNotifications(notifications) {
  try {
    if (import_fs3.default.existsSync(DB_FILE3)) {
      const content = import_fs3.default.readFileSync(DB_FILE3, "utf-8");
      const db = content && content.trim() ? JSON.parse(content) : {};
      db.notifications = notifications;
      import_fs3.default.writeFileSync(DB_FILE3, JSON.stringify(db, null, 2));
    } else {
      const db = { notifications };
      import_fs3.default.writeFileSync(DB_FILE3, JSON.stringify(db, null, 2));
    }
  } catch (e) {
    console.error("Error saving local notifications:", e);
  }
}
var NotificationRepository = class {
  async list() {
    try {
      const { data, error } = await supabase.from("Notification").select("*").order("timestamp", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Failed to list notifications from Supabase, returning local fallback:", e);
      return getLocalNotifications().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }
  async listByUserId(userId) {
    try {
      const { data, error } = await supabase.from("Notification").select("*").eq("toUserId", userId).order("timestamp", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Failed to list notifications by user from Supabase, returning local fallback:", e?.message || e);
      return getLocalNotifications().filter((n) => n.toUserId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }
  async findById(id) {
    try {
      const { data, error } = await supabase.from("Notification").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Failed to find notification by id from Supabase, returning local fallback:", e);
      return getLocalNotifications().find((n) => n.id === id) || null;
    }
  }
  async create(notification) {
    const id = notification.id || "notify_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const record = { ...notification, id };
    try {
      const localNotifs = getLocalNotifications();
      localNotifs.push(record);
      saveLocalNotifications(localNotifs);
      const { data, error } = await supabase.from("Notification").insert(record).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Failed to create notification in Supabase, using local fallback:", e);
      return record;
    }
  }
  async markAllAsRead(userId) {
    try {
      const localNotifs = getLocalNotifications();
      localNotifs.forEach((n) => {
        if (n.toUserId === userId) {
          n.isRead = true;
        }
      });
      saveLocalNotifications(localNotifs);
      await supabase.from("Notification").update({ isRead: true }).eq("toUserId", userId);
    } catch (e) {
      console.warn("Failed to mark notifications as read in Supabase:", e);
    }
  }
  async delete(id) {
    try {
      const localNotifs = getLocalNotifications().filter((n) => n.id !== id);
      saveLocalNotifications(localNotifs);
      await supabase.from("Notification").delete().eq("id", id);
    } catch (e) {
      console.warn("Failed to delete notification in Supabase:", e);
    }
  }
  async update(id, updates) {
    try {
      const localNotifs = getLocalNotifications();
      const index = localNotifs.findIndex((n) => n.id === id);
      if (index !== -1) {
        localNotifs[index] = { ...localNotifs[index], ...updates };
        saveLocalNotifications(localNotifs);
      }
      await supabase.from("Notification").update(updates).eq("id", id);
    } catch (e) {
      console.warn("Failed to update notification in Supabase:", e);
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
    const record = { ...comment, id, timestamp };
    try {
      const { data, error } = await supabase.from("Comment").insert(record).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Failed to create comment in Supabase, using local fallback:", e?.message || e);
      return record;
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
var import_fs4 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
var DB_FILE4 = import_path4.default.join(process.cwd(), "db_store.json");
function getLocalFollows() {
  try {
    if (import_fs4.default.existsSync(DB_FILE4)) {
      const content = import_fs4.default.readFileSync(DB_FILE4, "utf-8");
      if (content && content.trim()) {
        const db = JSON.parse(content);
        return db.follows || [];
      }
    }
  } catch (e) {
  }
  return [];
}
function saveLocalFollows(follows) {
  try {
    if (import_fs4.default.existsSync(DB_FILE4)) {
      const content = import_fs4.default.readFileSync(DB_FILE4, "utf-8");
      const db = content && content.trim() ? JSON.parse(content) : {};
      db.follows = follows;
      import_fs4.default.writeFileSync(DB_FILE4, JSON.stringify(db, null, 2));
    } else {
      const db = { follows };
      import_fs4.default.writeFileSync(DB_FILE4, JSON.stringify(db, null, 2));
    }
  } catch (e) {
  }
}
var FollowRepository = class {
  async listFollowers(userId) {
    try {
      const { data, error } = await supabase.from("Follow").select("followerId").eq("followingId", userId);
      if (error) throw error;
      return (data || []).map((f) => f.followerId);
    } catch (e) {
      const local = getLocalFollows();
      return local.filter((f) => f.followingId === userId).map((f) => f.followerId);
    }
  }
  async listFollowing(userId) {
    try {
      const { data, error } = await supabase.from("Follow").select("followingId").eq("followerId", userId);
      if (error) throw error;
      return (data || []).map((f) => f.followingId);
    } catch (e) {
      const local = getLocalFollows();
      return local.filter((f) => f.followerId === userId).map((f) => f.followingId);
    }
  }
  async list() {
    try {
      const { data, error } = await supabase.from("Follow").select("followerId, followingId");
      if (error) throw error;
      return data || [];
    } catch (e) {
      return getLocalFollows();
    }
  }
  async follow(followerId, followingId) {
    const local = getLocalFollows();
    if (!local.some((f) => f.followerId === followerId && f.followingId === followingId)) {
      local.push({ followerId, followingId });
      saveLocalFollows(local);
    }
    try {
      const { error } = await supabase.from("Follow").insert({ followerId, followingId });
      if (error) throw error;
    } catch (e) {
    }
  }
  async unfollow(followerId, followingId) {
    const local = getLocalFollows();
    const filtered = local.filter((f) => !(f.followerId === followerId && f.followingId === followingId));
    saveLocalFollows(filtered);
    try {
      const { error } = await supabase.from("Follow").delete().eq("followerId", followerId).eq("followingId", followingId);
      if (error) throw error;
    } catch (e) {
    }
  }
};

// src/repositories/ConnectionRepository.ts
var ConnectionRepository = class {
  async list() {
    try {
      const { data, error } = await supabase.from("Connection").select("*");
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Supabase list connections failed:", e?.message || e);
    }
    return [];
  }
  async create(connection) {
    try {
      const { error } = await supabase.from("Connection").insert(connection);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to create connection in Supabase:", e?.message || e);
    }
  }
  async delete(requesterId, receiverId) {
    try {
      const { error } = await supabase.from("Connection").delete().match({ requesterId, receiverId });
      if (error) throw error;
    } catch (e) {
      console.error("Failed to delete connection in Supabase:", e?.message || e);
    }
  }
  async updateStatus(requesterId, receiverId, status) {
    try {
      const { error } = await supabase.from("Connection").update({ status }).match({ requesterId, receiverId });
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update connection status in Supabase:", e?.message || e);
    }
  }
};

// src/services/AuthService.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_crypto2 = __toESM(require("crypto"), 1);

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
    const token = import_crypto2.default.randomBytes(32).toString("hex");
    try {
      await this.verificationRepo.create({
        user_id: user.id,
        token_hash: import_crypto2.default.createHash("sha256").update(token).digest("hex"),
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
    if (!await import_bcryptjs.default.compare(password, user.password)) throw new Error("AUTH_INVALID_CREDENTIALS");
    const refreshToken = import_crypto2.default.randomBytes(32).toString("hex");
    try {
      await this.sessionRepo.create({
        user_id: user.id,
        refresh_token_hash: import_crypto2.default.createHash("sha256").update(refreshToken).digest("hex"),
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
    const token = import_crypto2.default.randomBytes(32).toString("hex");
    try {
      await this.passwordResetRepo.create({
        user_id: user.id,
        token_hash: import_crypto2.default.createHash("sha256").update(token).digest("hex"),
        expires_at: new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
        used_at: null
      });
    } catch (e) {
      console.warn("Password reset record creation skipped or failed:", e instanceof Error ? e.message : String(e));
    }
    return token;
  }
  async resetPassword(token, newPassword) {
    const tokenHash = import_crypto2.default.createHash("sha256").update(token).digest("hex");
    const reset = await this.passwordResetRepo.getByTokenHash(tokenHash);
    if (!reset || new Date(reset.expires_at) < /* @__PURE__ */ new Date() || reset.used_at) throw new Error("AUTH_INVALID_TOKEN");
    const passwordHash = await import_bcryptjs.default.hash(newPassword, 12);
    await this.userRepo.updatePassword(reset.user_id, passwordHash);
    await this.passwordResetRepo.markUsed(reset.id);
    return true;
  }
  async logout(refreshToken) {
    const hash = import_crypto2.default.createHash("sha256").update(refreshToken).digest("hex");
    const session = await this.sessionRepo.getByRefreshTokenHash(hash);
    if (session) await this.sessionRepo.revoke(session.id);
    return true;
  }
  async refreshToken(refreshToken) {
    const hash = import_crypto2.default.createHash("sha256").update(refreshToken).digest("hex");
    const session = await this.sessionRepo.getByRefreshTokenHash(hash);
    if (!session || session.revoked_at || new Date(session.expires_at) < /* @__PURE__ */ new Date()) throw new Error("AUTH_TOKEN_EXPIRED");
    await this.sessionRepo.revoke(session.id);
    const newRefreshToken = import_crypto2.default.randomBytes(32).toString("hex");
    await this.sessionRepo.create({
      ...session,
      refresh_token_hash: import_crypto2.default.createHash("sha256").update(newRefreshToken).digest("hex"),
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
      const tokenHash = import_crypto2.default.createHash("sha256").update(tokenOrUserId).digest("hex");
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
  { id: 1, name: "Indonesia", iso_code: "ID", dial_code: "+62" },
  { id: 2, name: "Malaysia", iso_code: "MY", dial_code: "+60" },
  { id: 3, name: "Singapore", iso_code: "SG", dial_code: "+65" }
];
var MOCK_PROVINCES = {
  1: [
    { id: 10, country_id: 1, name: "DKI Jakarta" },
    { id: 11, country_id: 1, name: "Jawa Barat" },
    { id: 12, country_id: 1, name: "Jawa Timur" },
    { id: 13, country_id: 1, name: "Banten" },
    { id: 14, country_id: 1, name: "Bali" }
  ],
  2: [
    { id: 20, country_id: 2, name: "Selangor" },
    { id: 21, country_id: 2, name: "Kuala Lumpur" },
    { id: 22, country_id: 2, name: "Penang" }
  ],
  3: [
    { id: 30, country_id: 3, name: "Central Region" },
    { id: 31, country_id: 3, name: "East Region" }
  ]
};
var MOCK_CITIES = {
  10: [
    { id: 100, province_id: 10, name: "Jakarta Selatan" },
    { id: 101, province_id: 10, name: "Jakarta Pusat" },
    { id: 102, province_id: 10, name: "Jakarta Barat" }
  ],
  11: [
    { id: 110, province_id: 11, name: "Bandung" },
    { id: 111, province_id: 11, name: "Bekasi" },
    { id: 112, province_id: 11, name: "Depok" },
    { id: 113, province_id: 11, name: "Bogor" }
  ],
  12: [
    { id: 120, province_id: 12, name: "Surabaya" },
    { id: 121, province_id: 12, name: "Malang" }
  ],
  13: [
    { id: 130, province_id: 13, name: "Tangerang" },
    { id: 131, province_id: 13, name: "Serang" }
  ],
  14: [
    { id: 140, province_id: 14, name: "Denpasar" },
    { id: 141, province_id: 14, name: "Kuta" }
  ],
  20: [
    { id: 200, province_id: 20, name: "Petaling Jaya" },
    { id: 201, province_id: 20, name: "Shah Alam" }
  ],
  21: [
    { id: 210, province_id: 21, name: "Kuala Lumpur City" }
  ],
  22: [
    { id: 220, province_id: 22, name: "George Town" }
  ],
  30: [
    { id: 300, province_id: 30, name: "Downtown Core" }
  ],
  31: [
    { id: 310, province_id: 31, name: "Changi" }
  ]
};
var LocationRepository = class {
  async getAllCountries() {
    try {
      const { data, error } = await supabase.from("countries").select("id, name, iso_code, dial_code").order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("getAllCountries fallback to mock data:", e);
      return MOCK_COUNTRIES;
    }
  }
  async getProvincesByCountryId(countryId) {
    try {
      const { data, error } = await supabase.from("provinces").select("id, country_id, name").eq("country_id", countryId).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("getProvincesByCountryId fallback to mock data:", e);
      const cId = typeof countryId === "string" ? parseInt(countryId, 10) : countryId;
      return MOCK_PROVINCES[cId] || [];
    }
  }
  async getCitiesByProvinceId(provinceId) {
    try {
      const { data, error } = await supabase.from("cities").select("id, province_id, name").eq("province_id", provinceId).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("getCitiesByProvinceId fallback to mock data:", e);
      const pId = typeof provinceId === "string" ? parseInt(provinceId, 10) : provinceId;
      return MOCK_CITIES[pId] || [];
    }
  }
  async searchCountries(keyword, limit) {
    try {
      const { data, error } = await supabase.from("countries").select("id, name, iso_code, dial_code").ilike("name", `%${keyword}%`).limit(limit).order("name", { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) {
      return MOCK_COUNTRIES.filter((c) => c.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
    }
  }
  async getCountryByIso2(iso2) {
    try {
      const { data, error } = await supabase.from("countries").select("id, name, iso_code, dial_code").eq("iso_code", iso2).single();
      if (error) throw error;
      return data;
    } catch (e) {
      return MOCK_COUNTRIES.find((c) => c.iso_code.toLowerCase() === iso2.toLowerCase()) || null;
    }
  }
  async getProvinces(countryId) {
    return this.getProvincesByCountryId(countryId);
  }
  async searchProvinces(countryId, keyword, limit) {
    try {
      const { data, error } = await supabase.from("provinces").select("id, country_id, name").eq("country_id", countryId).ilike("name", `%${keyword}%`).limit(limit).order("name", { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) {
      const provs = MOCK_PROVINCES[countryId] || [];
      return provs.filter((p) => p.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
    }
  }
  async getCities(provinceId) {
    return this.getCitiesByProvinceId(provinceId);
  }
  async searchCities(provinceId, keyword, limit) {
    try {
      const { data, error } = await supabase.from("cities").select("id, province_id, name").eq("province_id", provinceId).ilike("name", `%${keyword}%`).limit(limit).order("name", { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) {
      const cts = MOCK_CITIES[provinceId] || [];
      return cts.filter((c) => c.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
    }
  }
};

// server.ts
process.on("unhandledRejection", (reason, promise) => {
  console.warn("GLOBAL UNHANDLED REJECTION caught gracefully:", reason);
});
process.on("uncaughtException", (err, origin) => {
  console.error("GLOBAL UNCAUGHT EXCEPTION caught gracefully:", err, "at origin:", origin);
});
var PORT = 3e3;
var DB_FILE5 = import_path5.default.join(process.cwd(), "db_store.json");
function calculateReputationGain(currentRep, basePoints) {
  const factor = 300 / (300 + Math.max(0, currentRep));
  const gain = basePoints * factor;
  return Math.max(1, Math.round(gain));
}
function loadDb() {
  if (import_fs5.default.existsSync(DB_FILE5)) {
    try {
      const data = import_fs5.default.readFileSync(DB_FILE5, "utf-8");
      if (data && data.trim()) {
        const db = JSON.parse(data);
        const defaults = { users: [], posts: [], comments: [], follows: [], notifications: [], messages: [], connections: [], bookmarks: [], reposts: [], pushSubscriptions: [], countries: [], provinces: [], cities: [], profiles: [], sessions: [], email_verifications: [], password_resets: [], login_history: [], audit_logs: [] };
        return { ...defaults, ...db };
      }
    } catch (err) {
      console.error("Error reading/parsing db_store.json:", err);
    }
  }
  const initialDb = {
    users: [
      {
        id: "user_budi",
        firstName: "Budi",
        lastName: "Santoso",
        username: "budisantoso",
        email: "budi@tarapti.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80",
        tradingExperience: "Pro Trader",
        tradingAsset: "Forex",
        city: "Tasikmalaya",
        province: "Jawa Barat",
        country: "Indonesia",
        reputationPoints: 250,
        headline: "FX Swing Trader | Tasikmalaya Community Lead",
        onlineStatus: "online"
      },
      {
        id: "user_siti",
        firstName: "Siti",
        lastName: "Rahma",
        username: "sitirahma",
        email: "siti@tarapti.com",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80",
        tradingExperience: "Expert",
        tradingAsset: "Gold (XAUUSD)",
        city: "Bandung",
        province: "Jawa Barat",
        country: "Indonesia",
        reputationPoints: 420,
        headline: "XAUUSD Scalper | Risk Management Enthusiast",
        onlineStatus: "online"
      },
      {
        id: "user_rian",
        firstName: "Rian",
        lastName: "Hidayat",
        username: "rianhidayat",
        email: "rian@tarapti.com",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80",
        tradingExperience: "Intermediate",
        tradingAsset: "Crypto",
        city: "Jakarta Selatan",
        province: "DKI Jakarta",
        country: "Indonesia",
        reputationPoints: 180,
        headline: "Crypto & BTC Specialist | Tech Analysis",
        onlineStatus: "online"
      },
      {
        id: "user_diana",
        firstName: "Diana",
        lastName: "Putri",
        username: "dianaputri",
        email: "diana@tarapti.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
        tradingExperience: "Pro Trader",
        tradingAsset: "Saham (IDX)",
        city: "Surabaya",
        province: "Jawa Timur",
        country: "Indonesia",
        reputationPoints: 310,
        headline: "Equity & Index Trader Surabaya",
        onlineStatus: "offline"
      },
      {
        id: "user_eka",
        firstName: "Eka",
        lastName: "Kurniawan",
        username: "ekakurnia",
        email: "eka@tarapti.com",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80",
        tradingExperience: "Beginner",
        tradingAsset: "Forex",
        city: "Tasikmalaya",
        province: "Jawa Barat",
        country: "Indonesia",
        reputationPoints: 95,
        headline: "Learning Price Action & Smart Money Concepts",
        onlineStatus: "online"
      },
      {
        id: "user_maya",
        firstName: "Maya",
        lastName: "Indah",
        username: "mayaindah",
        email: "maya@tarapti.com",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80",
        tradingExperience: "Expert",
        tradingAsset: "Gold (XAUUSD)",
        city: "Semarang",
        province: "Jawa Tengah",
        country: "Indonesia",
        reputationPoints: 380,
        headline: "Gold Intraday Trader | Price Action",
        onlineStatus: "online"
      }
    ],
    posts: [
      {
        id: "post_sample_1",
        userId: "user_budi",
        authorName: "Budi Santoso",
        authorUsername: "budisantoso",
        authorAvatar: "BS",
        authorRole: "Pro Trader",
        authorCity: "Tasikmalaya",
        authorCountry: "Indonesia",
        content: "[Bullish] Analisa XAUUSD hari ini potensi rebound dari area support 2380. Target profit di 2415. Tetap gunakan risk management yang ketat! #XAUUSD #Forex",
        images: [],
        likesCount: 14,
        commentsCount: 3,
        bookmarksCount: 5,
        repostsCount: 2,
        likedBy: [],
        bookmarkedBy: [],
        repostedBy: [],
        timestamp: new Date(Date.now() - 36e5 * 2).toISOString(),
        tags: ["XAUUSD", "Forex"],
        isOfficial: false,
        isPinned: false
      }
    ],
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
      { "id": 3, "name": "Singapore", "iso2": "SG", "phone_code": "+65", "is_supported": true, "sort_order": 3 }
    ],
    provinces: [],
    cities: [],
    profiles: [],
    sessions: [],
    email_verifications: [],
    password_resets: [],
    login_history: [],
    audit_logs: []
  };
  import_fs5.default.writeFileSync(DB_FILE5, JSON.stringify(initialDb, null, 2));
  return initialDb;
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
  try {
    import_fs5.default.writeFileSync(DB_FILE5, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing db_store.json:", err);
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  const httpServer = (0, import_http.createServer)(app);
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use((req, res, next) => {
    const db = loadDb();
    req.db = db;
    req.save = () => saveDb(db);
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
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
    let items = [];
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (finnhubKey) {
      try {
        console.log("Fetching news from Finnhub API...");
        const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            items = data.slice(0, 12).map((item, idx) => {
              const pubDate = item.datetime ? new Date(item.datetime * 1e3) : /* @__PURE__ */ new Date();
              return {
                id: item.id || `finnhub_${idx}_${Date.now()}`,
                title: item.headline || "No Title",
                source: item.source || "Finnhub",
                time: getRelativeTime(pubDate),
                url: item.url || "#",
                sentiment: getSentiment(item.headline || "")
              };
            });
            console.log(`Successfully retrieved ${items.length} news items from Finnhub.`);
          }
        } else {
          console.warn(`Finnhub returned status ${response.status}.`);
        }
      } catch (err) {
        console.error("Error communicating with Finnhub:", err);
      }
    } else {
      console.log("FINNHUB_API_KEY is not configured.");
    }
    try {
      let calendarEvents = [];
      if (finnhubKey) {
        try {
          const todayDate = /* @__PURE__ */ new Date();
          const todayStr = todayDate.toISOString().split("T")[0];
          const futureDate = /* @__PURE__ */ new Date();
          futureDate.setDate(todayDate.getDate() + 7);
          const futureStr = futureDate.toISOString().split("T")[0];
          console.log(`Fetching economic calendar from Finnhub: from ${todayStr} to ${futureStr}...`);
          const calResponse = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${todayStr}&to=${futureStr}&token=${finnhubKey}`);
          if (calResponse.ok) {
            const calData = await calResponse.json();
            if (calData && Array.isArray(calData.economicCalendar)) {
              calendarEvents = calData.economicCalendar.slice(0, 12).map((item, idx) => {
                const impactRaw = item.impact ? item.impact.toLowerCase() : "medium";
                const impact = impactRaw === "high" || impactRaw === "critical" ? "High" : impactRaw === "low" ? "Low" : "Medium";
                let eventDate = /* @__PURE__ */ new Date();
                if (item.time) {
                  eventDate = new Date(item.time.replace(" ", "T"));
                }
                const timeStr = eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                const conditionUp = `Ekonomi ${item.country || "global"} kuat. Investor optimis, ${item.currency || "USD"} berpotensi MENGUAT (Naik). Gold berpotensi TURUN.`;
                const conditionDown = `Ekonomi ${item.country || "global"} melemah. Investor pesimis, ${item.currency || "USD"} berpotensi MELEMAH (Turun). Gold berpotensi NAIK.`;
                return {
                  id: idx + 1,
                  time: timeStr,
                  datetime: eventDate.toISOString(),
                  currency: item.currency || item.country || "USD",
                  impact,
                  event: item.event || "Economic Release",
                  actual: item.actual !== null && item.actual !== void 0 ? String(item.actual) : "-",
                  forecast: item.forecast !== null && item.forecast !== void 0 ? String(item.forecast) : "-",
                  previous: item.prev !== null && item.prev !== void 0 ? String(item.prev) : "-",
                  insight: {
                    title: `Analisa ${item.event || "Rilis Ekonomi"}`,
                    desc: `${item.event || "Indikator ini"} mengukur kesehatan ekonomi di negara ${item.country || "Global"}. Rilis data ini sangat mempengaruhi volatilitas instrumen keuangan global.`,
                    conditionUp,
                    conditionDown
                  }
                };
              });
              console.log(`Successfully retrieved ${calendarEvents.length} calendar events from Finnhub.`);
            }
          } else {
            console.warn(`Finnhub economic calendar returned status ${calResponse.status}. Using fallback.`);
          }
        } catch (err) {
          console.error("Error communicating with Finnhub Economic Calendar:", err);
        }
      }
      if (calendarEvents.length === 0) {
        const createFutureDate = (hoursOffset) => {
          const d = /* @__PURE__ */ new Date();
          d.setHours(d.getHours() + hoursOffset);
          return d;
        };
        calendarEvents = [
          {
            id: 1,
            time: createFutureDate(2).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            datetime: createFutureDate(2).toISOString(),
            currency: "USD",
            impact: "High",
            event: "Non-Farm Employment Change",
            actual: "272K",
            forecast: "185K",
            previous: "165K",
            insight: {
              title: "Apa itu NFP (Non-Farm Payroll)?",
              desc: "NFP adalah laporan jumlah tenaga kerja baru di AS (di luar sektor pertanian). Ini adalah indikator utama kesehatan ekonomi AS dan sangat mempengaruhi kebijakan suku bunga The Fed.",
              conditionUp: "Ekonomi AS kuat. Investor optimis, USD berpotensi MENGUAT (Naik). Gold (XAUUSD) berpotensi TURUN.",
              conditionDown: "Ekonomi AS melemah. Investor pesimis, USD berpotensi MELEMAH (Turun). Gold (XAUUSD) berpotensi NAIK."
            }
          },
          {
            id: 2,
            time: createFutureDate(4.5).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            datetime: createFutureDate(4.5).toISOString(),
            currency: "USD",
            impact: "High",
            event: "Unemployment Rate",
            actual: "4.0%",
            forecast: "3.9%",
            previous: "3.9%",
            insight: {
              title: "Apa itu Unemployment Rate?",
              desc: "Unemployment Rate mengukur persentase angkatan kerja yang tidak memiliki pekerjaan dan aktif mencari pekerjaan. Indikator ini mencerminkan kondisi lapangan kerja.",
              conditionUp: "Tingkat pengangguran tinggi menunjukkan ekonomi melambat. USD berpotensi MELEMAH. Gold (XAUUSD) berpotensi NAIK.",
              conditionDown: "Tingkat pengangguran rendah menunjukkan ekonomi kuat. USD berpotensi MENGUAT. Gold (XAUUSD) berpotensi TURUN."
            }
          },
          {
            id: 3,
            time: createFutureDate(8).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            datetime: createFutureDate(8).toISOString(),
            currency: "EUR",
            impact: "Medium",
            event: "Flash Manufacturing PMI",
            actual: "-",
            forecast: "47.5",
            previous: "47.2",
            insight: {
              title: "Apa itu Manufacturing PMI?",
              desc: "Purchasing Managers Index (PMI) Manufaktur memberikan gambaran aktivitas bisnis di sektor manufaktur Zona Euro. Angka di atas 50 menunjukkan ekspansi.",
              conditionUp: "PMI meningkat menunjukkan ekspansi manufaktur yang sehat. EUR menguat.",
              conditionDown: "PMI menurun menunjukkan kontraksi manufaktur. EUR melemah."
            }
          }
        ];
      }
      res.json({ news: items, economicEvents: calendarEvents });
    } catch (error) {
      console.error("Finnhub fetch error:", error);
      res.json({
        news: [],
        economicEvents: [
          { id: 1, date: "Today", time: "14:30", currency: "USD", event: "Economic news updates loading...", impact: "Medium", actual: "-", forecast: "-", previous: "-" }
        ]
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
      if (!username || !email) {
        return res.status(400).json({ error: "username and email are required" });
      }
      console.log(`Checking availability for username: ${username}, email: ${email}`);
      const { data: userWithUsername } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
      const { data: userWithEmail } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
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
    const { firstName, lastName, headline, bio, country, province, city, tradingExperience, tradingAsset, latitude, longitude, avatar, coverPhoto, marketPulseEnabled, marketPulseAssets } = req.body;
    if (firstName) {
      user.firstName = firstName;
    }
    if (lastName) {
      user.lastName = lastName;
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
  app.get("/api/users", async (req, res) => {
    const userRepo = new UserRepository();
    let list = await userRepo.list();
    const { search, country, province, city, experience, asset, online, lat, lng, radius } = req.query;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) => u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.headline.toLowerCase().includes(q)
      );
    }
    if (country) list = list.filter((u) => u.country.toLowerCase() === country.toLowerCase());
    if (province) list = list.filter((u) => u.province?.toLowerCase() === province.toLowerCase());
    if (city) list = list.filter((u) => u.city.toLowerCase() === city.toLowerCase());
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
    const following = await followRepo.listFollowing(uid);
    const followers = await followRepo.listFollowers(uid);
    res.json({ following, followers });
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
  app.get("/api/posts", async (req, res) => {
    try {
      const postRepo = new PostRepository();
      let posts = await postRepo.list();
      const { search, tag, userId, groupId } = req.query;
      if (groupId) {
        posts = posts.filter((p) => p.groupId === groupId);
      } else {
        posts = posts.filter((p) => !p.groupId);
      }
      if (search) {
        const q = search.toLowerCase();
        posts = posts.filter(
          (p) => p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q) || p.authorUsername.toLowerCase().includes(q)
        );
      }
      if (tag) {
        posts = posts.filter((p) => p.tags && p.tags.includes(tag));
      }
      if (userId) {
        posts = posts.filter((p) => p.userId === userId);
      }
      posts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      const enrichedPosts = posts.map((p) => {
        const author = req.db.users.find((u) => u.id === p.userId);
        return {
          ...p,
          authorCity: author ? author.city : p.authorCity || "Tasikmalaya",
          authorCountry: author ? author.country : p.authorCountry || "Indonesia",
          authorVerified: author ? !!(author.mt5Connected || author.isVerified) : !!p.authorVerified
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
    const { userId, content, images, chart, videoUrl, groupId, isOfficial, isPinned } = req.body;
    if (!userId || !content?.trim() && !images?.length && !videoUrl && !chart) {
      return res.status(400).json({ error: "Missing required fields: content or media/chart is required" });
    }
    const userRepo = new UserRepository();
    const postRepo = new PostRepository();
    let user = await userRepo.findById(userId);
    if (!user) {
      try {
        const uObj = await authService.getCurrentUser(userId);
        if (uObj) {
          user = { ...uObj.user, ...uObj.profile };
          await userRepo.create(user);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (!user) {
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
      await userRepo.create(user);
    }
    const hashtags = content ? (content.match(/#\w+/g) || []).map((t) => t.substring(1)) : [];
    const newPost = await postRepo.create({
      userId,
      authorName: `${user.firstName} ${user.lastName}`,
      authorUsername: user.username,
      authorAvatar: user.avatar || "",
      authorRole: user.tradingExperience || "",
      authorCity: user.city || "",
      authorCountry: user.country || "",
      content,
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
      authorVerified: !!(user.mt5Connected || user.isVerified)
    });
    const currentRep = user.reputationPoints || 0;
    const gain = calculateReputationGain(currentRep, 2);
    user.reputationPoints = currentRep + gain;
    await userRepo.update(userId, user);
    res.json(newPost);
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
    const post = await postRepo.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.body.userId) return res.status(403).json({ error: "Unauthorized" });
    await postRepo.delete(post.id);
    const comments = await commentRepo.listByPostId(post.id);
    for (const c of comments) {
      await commentRepo.delete(c.id);
    }
    res.json({ success: true });
  });
  app.post("/api/posts/:postId/like", async (req, res) => {
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
    }
    post.likesCount = post.likedBy.length;
    await postRepo.update(post);
    res.json({ success: true, likesCount: post.likesCount, liked });
  });
  app.post("/api/posts/:postId/comment", async (req, res) => {
    const { userId, content } = req.body;
    const postId = req.params.postId;
    const postRepo = new PostRepository();
    const commentRepo = new CommentRepository();
    const userRepo = new UserRepository();
    const notifRepo = new NotificationRepository();
    const post = await postRepo.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const user = await userRepo.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const newComment = await commentRepo.create({
      postId,
      userId,
      authorName: `${user.firstName} ${user.lastName}`,
      authorUsername: user.username,
      authorAvatar: user.avatar,
      content
    });
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
    res.json(newComment);
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
    const user = await userRepo.findById(uid);
    if (!user) return res.status(404).json({ error: "User not found" });
    const msgs = await messageRepo.listAllForUser(uid);
    const partnerIds = Array.from(new Set(msgs.map((m) => m.senderId === uid ? m.receiverId : m.senderId))).filter((pId) => pId && typeof pId === "string" && !pId.startsWith("group_"));
    const sessions = await Promise.all(partnerIds.map(async (pId) => {
      const partner = await userRepo.findById(pId);
      if (!partner) return null;
      const userMsgs = msgs.filter((m) => m.senderId === uid && m.receiverId === pId || m.senderId === pId && m.receiverId === uid);
      userMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastMsg = userMsgs[userMsgs.length - 1];
      const unreadCount = userMsgs.filter((m) => m.senderId === pId && m.receiverId === uid && !m.isRead).length;
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
        isGroup: false
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
      await messageRepo.markAsRead(partnerId, userId);
    }
    res.json(enrichedHistory);
  });
  app.post("/api/messages", async (req, res) => {
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
      isDelivered: true
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
      req.save();
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
    req.save();
    res.json({ success: true, settings });
  });
  app.post("/api/admin/mt5/test", authenticate, (req, res) => {
    const { mt5Server, mt5Login, mt5Password, mt5Port } = req.body;
    if (!mt5Server || !mt5Login || !mt5Password) {
      return res.status(400).json({ error: "Missing required MT5 configuration fields" });
    }
    setTimeout(() => {
      const isSuccess = mt5Login !== "fail";
      if (isSuccess) {
        req.db.adminSettings = req.db.adminSettings || {};
        req.db.adminSettings.mt5Status = "connected";
        req.save();
        res.json({ success: true, message: `Successfully connected to MetaTrader 5 server: ${mt5Server} for Login ID: ${mt5Login}` });
      } else {
        res.status(400).json({ error: "Failed to establish socket connection with MT5 server. Please verify credentials and server state." });
      }
    }, 800);
  });
  app.post("/api/admin/news/sync", authenticate, (req, res) => {
    const { newsProvider, newsRssUrl, newsApiKey } = req.body;
    setTimeout(() => {
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
    }, 600);
  });
  app.get("/api/admin/users", authenticate, (req, res) => {
    const safeUsers = req.db.users.map(({ password, ...u }) => u);
    res.json(safeUsers);
  });
  app.put("/api/admin/users/:userId", authenticate, (req, res) => {
    const { userId } = req.params;
    const user = req.db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { firstName, lastName, username, email, tradingExperience, tradingAsset, reputationPoints, role, onlineStatus } = req.body;
    if (firstName !== void 0) user.firstName = firstName;
    if (lastName !== void 0) user.lastName = lastName;
    if (username !== void 0) user.username = username;
    if (email !== void 0) user.email = email;
    if (tradingExperience !== void 0) user.tradingExperience = tradingExperience;
    if (tradingAsset !== void 0) user.tradingAsset = tradingAsset;
    if (reputationPoints !== void 0) user.reputationPoints = Number(reputationPoints);
    if (role !== void 0) user.role = role;
    if (onlineStatus !== void 0) user.onlineStatus = onlineStatus;
    req.save();
    const { password, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });
  app.delete("/api/admin/users/:userId", authenticate, (req, res) => {
    const { userId } = req.params;
    const userIndex = req.db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }
    req.db.users.splice(userIndex, 1);
    req.save();
    res.json({ success: true, message: "User deleted successfully" });
  });
  app.post("/api/notifications/test-trigger", (req, res) => {
    const { userId, eventType } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const targetUser = req.db.users.find((u) => u.id === userId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    const sampleSender = req.db.users.find((u) => u.id !== userId) || {
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
    req.save();
    res.json({ success: true, notification });
  });
  app.post("/api/admin/broadcast", authenticate, (req, res) => {
    const { message, type } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Broadcast message cannot be empty" });
    }
    const senderId = "user_1";
    const sender = req.db.users.find((u) => u.id === senderId) || { firstName: "System", lastName: "Admin", avatar: "SA" };
    req.db.notifications = req.db.notifications || [];
    let count = 0;
    req.db.users.forEach((user) => {
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
      req.db.notifications.push(notification);
      count++;
    });
    req.save();
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
    const distPath = import_path5.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path5.default.join(distPath, "index.html"));
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
