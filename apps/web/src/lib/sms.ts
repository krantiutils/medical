/**
 * Aakash SMS Integration for Nepal
 * API Docs: https://aakashsms.com/documentation/
 */

const AAKASH_SMS_API_URL = "https://sms.aakashsms.com/sms/v3/send";

interface AakashSmsResponse {
  error: boolean;
  message: string;
  data?: {
    valid: Array<{
      id: number;
      mobile: string;
      text: string;
      credit: number;
      network: string;
      status: string;
    }>;
    invalid: string[];
  };
}

interface SendSmsResult {
  success: boolean;
  message: string;
  messageId?: number;
}

/**
 * Normalize Nepal phone number to 10-digit format
 * Handles: +977XXXXXXXXXX, 977XXXXXXXXXX, 98XXXXXXXX, 97XXXXXXXX
 */
export function normalizePhone(phone: string): string | null {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // Handle +977 or 977 prefix
  if (digits.startsWith("977") && digits.length === 13) {
    return digits.slice(3); // Remove 977, return 10 digits
  }

  // Already 10 digits starting with 9
  if (digits.length === 10 && digits.startsWith("9")) {
    return digits;
  }

  return null; // Invalid format
}

/**
 * Validate Nepal mobile number format
 * Valid formats: 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX
 */
export function isValidNepalPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;

  // Nepal mobile numbers start with 97, 98, or 96
  return /^9[678]\d{8}$/.test(normalized);
}

/**
 * Send SMS via Aakash SMS API
 */
export async function sendSms(to: string, text: string): Promise<SendSmsResult> {
  const authToken = process.env.AAKASH_SMS_TOKEN;

  if (!authToken) {
    console.error("AAKASH_SMS_TOKEN not configured");
    return {
      success: false,
      message: "SMS service not configured",
    };
  }

  const normalizedPhone = normalizePhone(to);
  if (!normalizedPhone) {
    return {
      success: false,
      message: "Invalid phone number format",
    };
  }

  try {
    const response = await fetch(AAKASH_SMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_token: authToken,
        to: normalizedPhone,
        text: text,
      }),
    });

    const data: AakashSmsResponse = await response.json();

    if (data.error) {
      console.error("Aakash SMS error:", data.message);
      return {
        success: false,
        message: data.message || "Failed to send SMS",
      };
    }

    const validMessage = data.data?.valid?.[0];
    if (validMessage) {
      return {
        success: true,
        message: "SMS sent successfully",
        messageId: validMessage.id,
      };
    }

    // Check if number was invalid
    if (data.data?.invalid?.length) {
      return {
        success: false,
        message: "Invalid phone number",
      };
    }

    return {
      success: true,
      message: data.message || "SMS queued",
    };
  } catch (error) {
    console.error("SMS send error:", error);
    return {
      success: false,
      message: "Network error sending SMS",
    };
  }
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOtp(): string {
  // Generate random 6-digit number (100000-999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP SMS
 */
export async function sendOtpSms(
  phone: string,
  otp: string,
  purpose: "register" | "login" | "reset"
): Promise<SendSmsResult> {
  const purposeText = {
    register: "account registration",
    login: "login verification",
    reset: "password reset",
  };

  const message = `Your DoctorSewa ${purposeText[purpose]} code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

  return sendSms(phone, message);
}
