import validator from "validator";

export const sanitizeInput = (input: string): string => {
  return validator.escape(input);
};

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const validateUsername = (username: string): boolean => {
  return (
    validator.isAlphanumeric(username) &&
    username.length >= 3 &&
    username.length <= 50
  );
};

export const isValidUrl = (url: string): boolean => {
  return validator.isURL(url, { protocols: ["http", "https"] });
};

export const sanitizeHtml = (html: string): string => {
  // Remove all HTML tags
  return html.replace(/<[^>]*>/g, "");
};

// For XSS prevention
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};
