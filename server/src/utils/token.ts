import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../configurations/db";
import { config } from "../config";
import { NUMBER_OF_SALT_ROUNDS } from "../constants/auth";
import { UserResponse } from "../interfaces/auth.interface";
import { Knex } from "knex";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  sessionId?: string;
}

/**
 * Generate Access Token (Short-lived JWT)
 */
export const generateAccessToken = (user: UserResponse): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    config.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

/**
 * Generate Refresh Token (Long-lived JWT tied to database session)
 */
export const generateRefreshToken = (user: UserResponse, sessionId: string): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      sessionId,
    },
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: "15d" }
  );
};

/**
 * Verify Refresh Token JWT signature and return payload
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.REFRESH_TOKEN_SECRET) as unknown as TokenPayload;
};

/**
 * Helper: Create a fresh entry in the `refresh_tokens` table for JWT rotation
 */
export const createRefreshTokenSession = async (
  userId: string,
  trx?: Knex.Transaction
) => {
  const dbClient = trx || db; // Use `trx` inside a transaction, fallback to `db`

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 15);

  const uniqueEntropy = `${userId}-${Date.now()}-${crypto.randomBytes(16).toString("hex")}`;
  const token_hash = await bcrypt.hash(uniqueEntropy, NUMBER_OF_SALT_ROUNDS);

  const [session] = await dbClient("refresh_tokens")
    .insert({
      user_id: userId,
      token_hash,
      is_revoked: false,
      expires_at,
    })
    .returning(["id", "user_id", "expires_at"]);

  return session;
};
