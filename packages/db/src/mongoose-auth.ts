import mongoose from "mongoose";
import type { Adapter } from "next-auth/adapters";

const globalForMongoose = globalThis as unknown as {
  authConn: mongoose.Connection | undefined;
  authConnPromise: Promise<mongoose.Connection> | undefined;
};

async function getAuthConnection(): Promise<mongoose.Connection> {
  if (!process.env.MONGO_URL) {
    throw new Error(
      "MONGO_URL is required for the auth database. Set it in apps/web/.env (e.g. MONGO_URL=mongodb://localhost:27017/logicforge_auth)"
    );
  }

  // Return cached connection immediately if already established
  if (globalForMongoose.authConn) {
    return globalForMongoose.authConn;
  }

  // Cache the promise so concurrent calls share one connection attempt
  if (!globalForMongoose.authConnPromise) {
    globalForMongoose.authConnPromise = mongoose
      .connect(process.env.MONGO_URL, {
        bufferCommands: false,
      })
      .then(() => mongoose.connection);
  }

  globalForMongoose.authConn = await globalForMongoose.authConnPromise;
  return globalForMongoose.authConn;
}

// --- Schemas (NextAuth-compatible) ---

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, sparse: true },
    emailVerified: Date,
    image: String,
  },
  { timestamps: true, collection: "users" }
);

const AccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: String,
    provider: String,
    providerAccountId: String,
    refresh_token: String,
    access_token: String,
    expires_at: Number,
    token_type: String,
    scope: String,
    id_token: String,
    session_state: String,
  },
  { collection: "accounts" }
);
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

const SessionSchema = new mongoose.Schema(
  {
    sessionToken: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expires: Date,
  },
  { collection: "sessions" }
);

// --- Lazy models (created after connection) ---

type Doc = mongoose.Document & Record<string, unknown>;
let UserModel: mongoose.Model<Doc>;
let AccountModel: mongoose.Model<Doc>;
let SessionModel: mongoose.Model<Doc>;

async function getModels() {
  await getAuthConnection();
  if (!UserModel) {
    // Use the default mongoose.connection which was established by mongoose.connect()
    const conn = mongoose.connection;
    UserModel = conn.model("User", UserSchema) as unknown as mongoose.Model<Doc>;
    AccountModel = conn.model("Account", AccountSchema) as unknown as mongoose.Model<Doc>;
    SessionModel = conn.model("Session", SessionSchema) as unknown as mongoose.Model<Doc>;
  }
  return { UserModel, AccountModel, SessionModel };
}

function toAdapterUser(doc: mongoose.Document | null): import("next-auth/adapters").AdapterUser | null {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name ?? null,
    email: o.email ?? "",
    emailVerified: o.emailVerified ?? null,
    image: o.image ?? null,
  };
}

function toAdapterAccount(doc: mongoose.Document | null): import("next-auth/adapters").AdapterAccount | null {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    userId: String(o.userId),
    type: o.type,
    provider: o.provider,
    providerAccountId: o.providerAccountId,
    refresh_token: o.refresh_token ?? undefined,
    access_token: o.access_token ?? undefined,
    expires_at: o.expires_at ?? undefined,
    token_type: o.token_type ?? undefined,
    scope: o.scope ?? undefined,
    id_token: o.id_token ?? undefined,
    session_state: o.session_state ?? undefined,
  };
}

function toAdapterSession(doc: mongoose.Document | null): import("next-auth/adapters").AdapterSession | null {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    sessionToken: o.sessionToken,
    userId: String(o.userId),
    expires: o.expires instanceof Date ? o.expires : new Date(o.expires),
  };
}


export function getMongooseAuthAdapter(): Adapter {
  return {
    async createUser(user) {
      try {
        const { UserModel } = await getModels();
        const doc = await UserModel.create({
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          emailVerified: user.emailVerified ?? undefined,
          image: user.image ?? undefined,
        });
        return toAdapterUser(doc)!;
      } catch (e) {
        console.error("[adapter] createUser error:", e);
        throw e;
      }
    },
    async getUser(id) {
      const { UserModel } = await getModels();
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await UserModel.findById(id).lean();
      return toAdapterUser(doc as unknown as mongoose.Document);
    },
    async getUserByEmail(email) {
      const { UserModel } = await getModels();
      const doc = await UserModel.findOne({ email }).lean();
      return toAdapterUser(doc as unknown as mongoose.Document);
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const { AccountModel, UserModel } = await getModels();
      const acc = await AccountModel.findOne({ provider, providerAccountId }).lean();
      if (!acc || !(acc as { userId?: unknown }).userId) return null;
      const doc = await UserModel.findById((acc as unknown as { userId: mongoose.Types.ObjectId }).userId).lean();
      return toAdapterUser(doc as unknown as mongoose.Document);
    },
    async linkAccount(account) {
      try {
        const { AccountModel } = await getModels();
        const doc = await AccountModel.create({
          userId: new mongoose.Types.ObjectId(account.userId),
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        } as Record<string, unknown>);
        return toAdapterAccount(doc);
      } catch (e) {
        console.error("[adapter] linkAccount error:", e);
        throw e;
      }
    },
    async createSession(session) {
      try {
        const { SessionModel } = await getModels();
        const doc = await SessionModel.create({
          sessionToken: session.sessionToken,
          userId: new mongoose.Types.ObjectId(session.userId),
          expires: session.expires,
        } as Record<string, unknown>);
        return toAdapterSession(doc)!;
      } catch (e) {
        console.error("[adapter] createSession error:", e);
        throw e;
      }
    },
    async getSessionAndUser(sessionToken) {
      const { SessionModel, UserModel } = await getModels();
      const sessionDoc = await SessionModel.findOne({ sessionToken }).lean();
      if (!sessionDoc) return null;
      const userId = (sessionDoc as unknown as Record<string, unknown>).userId as mongoose.Types.ObjectId;
      const userDoc = await UserModel.findById(userId).lean();
      if (!userDoc) return null;
      return {
        session: toAdapterSession(sessionDoc as unknown as mongoose.Document)!,
        user: toAdapterUser(userDoc as unknown as mongoose.Document)!,
      };
    },
    async updateSession({ sessionToken, expires }) {
      const { SessionModel } = await getModels();
      const doc = await SessionModel.findOneAndUpdate(
        { sessionToken },
        { $set: { expires } },
        { new: true }
      ).lean();
      return toAdapterSession(doc as unknown as mongoose.Document);
    },
    async deleteSession(sessionToken) {
      const { SessionModel } = await getModels();
      const doc = await SessionModel.findOneAndDelete({ sessionToken }).lean();
      return doc ? toAdapterSession(doc as unknown as mongoose.Document) : null;
    },
    async updateUser({ id, ...data }) {
      const { UserModel } = await getModels();
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid user id");
      const doc = await UserModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      ).lean();
      return toAdapterUser(doc as unknown as mongoose.Document)!;
    },
  };
}
