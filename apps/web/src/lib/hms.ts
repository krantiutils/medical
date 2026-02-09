import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const HMS_ACCESS_KEY = requireEnv("HMS_ACCESS_KEY");
const HMS_APP_SECRET = requireEnv("HMS_APP_SECRET");
const HMS_TEMPLATE_ID = requireEnv("HMS_TEMPLATE_ID");
const HMS_API_BASE = "https://api.100ms.live/v2";

/**
 * Generate a 100ms management token for server-side API calls.
 * Valid for 24 hours.
 */
export function generateManagementToken(): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      access_key: HMS_ACCESS_KEY,
      type: "management",
      version: 2,
      iat: now,
      nbf: now,
    },
    HMS_APP_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "24h",
      jwtid: randomUUID(),
    }
  );
}

/**
 * Generate a 100ms auth token for a user to join a room.
 * This is what the client SDK uses to authenticate.
 */
export function generateAuthToken(
  roomId: string,
  userId: string,
  role: "doctor" | "patient"
): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      access_key: HMS_ACCESS_KEY,
      type: "app",
      version: 2,
      room_id: roomId,
      user_id: userId,
      role: role === "doctor" ? "host" : "guest",
      iat: now,
      nbf: now,
    },
    HMS_APP_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "2h",
      jwtid: randomUUID(),
    }
  );
}

interface HmsRoom {
  id: string;
  name: string;
  enabled: boolean;
  template_id: string;
}

/**
 * Create a 100ms room via REST API.
 * If a room with the same name already exists, returns the existing room.
 */
export async function createRoom(
  consultationId: string,
  description?: string
): Promise<HmsRoom> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `doctorsewa-${consultationId}`,
      description: description || `Telemedicine consultation ${consultationId}`,
      template_id: HMS_TEMPLATE_ID,
      region: "in",
      max_duration_seconds: 7200, // 2 hours max
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`100ms room creation failed: ${response.status} ${error}`);
  }

  return response.json();
}
