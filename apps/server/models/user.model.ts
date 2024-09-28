import mongoose, { HydratedDocument, Model } from "mongoose";
import bcrypt from "bcryptjs";
export interface CartItems {
  quantity: number;
  product: mongoose.Schema.Types.ObjectId;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  cartItems: CartItems[];
  role: string;
}

enum ROLE {
  "CUSTOMER" = "customer",
  "ADMIN" = "admin",
}
interface UserMethods {
  comparePassword: (password: string) => void;
}

interface UserModel extends Model<IUser, {}, {}> {
  comparePassword: (password: string) => Promise<HydratedDocument<IUser, {}>>;
}

const userSchema = new mongoose.Schema<IUser, UserModel, UserMethods>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is missing!"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
    role: {
      type: String,
      enum: ROLE,
      default: ROLE.CUSTOMER,
      required: false,
    },
  },
  { timestamps: true }
);

// Pre hashing password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (e: any) {
    console.log("thiserror", e.message);
    next(e);
  }
});

// validate password
userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;