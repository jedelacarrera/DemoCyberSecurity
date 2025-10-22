import { DataTypes, Model, Sequelize } from "sequelize";

export interface SessionAttributes {
  id: number;
  userId: number;
  token: string;
  data: string;
  expiresAt: Date;
  createdAt?: Date;
}

export interface SessionModel
  extends Model<SessionAttributes>,
    SessionAttributes {}

export const SessionFactory = (sequelize: Sequelize) => {
  const Session = sequelize.define<SessionModel>(
    "Session",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "{}",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "sessions",
      timestamps: true,
      updatedAt: false,
    }
  );

  return Session;
};
