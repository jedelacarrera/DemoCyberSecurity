import { Sequelize } from "sequelize";
import { config } from "../config";
import { UserModel, UserFactory } from "./User";
import { PostModel, PostFactory } from "./Post";
import { SessionModel, SessionFactory } from "./Session";
import { AuditLogModel, AuditLogFactory } from "./AuditLog";

// Using in-memory SQLite for ephemeral demo data
// Each Cloud Run instance gets fresh data on startup
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: ":memory:", // In-memory database - resets on restart
  logging: config.env === "development" ? console.log : false,
});

// Initialize models
const User = UserFactory(sequelize);
const Post = PostFactory(sequelize);
const Session = SessionFactory(sequelize);
const AuditLog = AuditLogFactory(sequelize);

// Define associations
User.hasMany(Post, { foreignKey: "userId", as: "posts" });
Post.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Session, { foreignKey: "userId", as: "sessions" });
Session.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

export { sequelize, User, Post, Session, AuditLog };
export type { UserModel, PostModel, SessionModel, AuditLogModel };
