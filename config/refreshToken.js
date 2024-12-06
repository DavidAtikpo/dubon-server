import jwt from "jsonwebtoken";

const generateRefreshToken = (id) => {
  const secret = process.env.JWT_SECRET || "defaultfallbackkey";
  if (!secret) {
    throw new Error("JWT_SECRET must be defined in the environment variables");
  }

  return jwt.sign({ id }, secret, {
    expiresIn: "1h", // Token expirera après 1 heure
  });
};

export default generateRefreshToken;

