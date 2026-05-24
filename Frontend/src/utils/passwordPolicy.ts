export const PASSWORD_MIN_LENGTH = 7;
export const PASSWORD_MAX_LENGTH = 20;
const SPECIAL_CHAR_PATTERN = /[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?]/;

export const PASSWORD_POLICY_MESSAGE = "Mật khẩu phải từ 7-20 ký tự và có ít nhất 1 ký tự đặc biệt.";

export const isValidPassword = (password: string): boolean => {
  return password.length >= PASSWORD_MIN_LENGTH
    && password.length <= PASSWORD_MAX_LENGTH
    && SPECIAL_CHAR_PATTERN.test(password);
};
