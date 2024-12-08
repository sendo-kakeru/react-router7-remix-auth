import crypto from "crypto-js";

// Todo: エラーハンドリング
const secret = process.env.CRYPTO_SECRET ?? "";

export async function encrypt(value: string): Promise<string> {
  return crypto.AES.encrypt(value, secret).toString();
}

export async function decrypt(value: string): Promise<string> {
  const bytes = crypto.AES.decrypt(value, secret);
  return bytes.toString(crypto.enc.Utf8);
}
