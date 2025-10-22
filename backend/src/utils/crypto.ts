import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

export const generateKey = (password: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha512");
};

export const encrypt = (text: string, password: string): string => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = generateKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted
  return (
    salt.toString("hex") + iv.toString("hex") + tag.toString("hex") + encrypted
  );
};

export const decrypt = (encryptedData: string, password: string): string => {
  const saltHex = encryptedData.slice(0, SALT_LENGTH * 2);
  const ivHex = encryptedData.slice(
    SALT_LENGTH * 2,
    SALT_LENGTH * 2 + IV_LENGTH * 2
  );
  const tagHex = encryptedData.slice(
    SALT_LENGTH * 2 + IV_LENGTH * 2,
    SALT_LENGTH * 2 + IV_LENGTH * 2 + TAG_LENGTH * 2
  );
  const encrypted = encryptedData.slice(
    SALT_LENGTH * 2 + IV_LENGTH * 2 + TAG_LENGTH * 2
  );

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const key = generateKey(password, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (
  password: string,
  hashedPassword: string
): boolean => {
  const [salt, originalHash] = hashedPassword.split(":");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === originalHash;
};
