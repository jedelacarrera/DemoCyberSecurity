import { DataTypes, Model, Sequelize } from "sequelize";

export interface PostAttributes {
  id?: number;
  title: string;
  content: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PostModel extends Model<PostAttributes>, PostAttributes {}

export const PostFactory = (sequelize: Sequelize) => {
  const Post = sequelize.define<PostModel>(
    "Post",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "posts",
      timestamps: true,
    }
  );

  return Post;
};
