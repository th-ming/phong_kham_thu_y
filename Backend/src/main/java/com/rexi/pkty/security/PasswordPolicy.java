package com.rexi.pkty.security;

public final class PasswordPolicy {
    public static final int MIN_LENGTH = 7;
    public static final int MAX_LENGTH = 20;
    private static final String SPECIAL_CHARS = "!@#$%^&*()_+-={}[]|;:'\",.<>/?";

    private PasswordPolicy() {
    }

    public static boolean isValid(String password) {
        if (password == null) return false;
        int length = password.length();
        return length >= MIN_LENGTH
                && length <= MAX_LENGTH
                && password.chars().anyMatch(ch -> SPECIAL_CHARS.indexOf(ch) >= 0);
    }

    public static String message() {
        return "Mat khau phai tu 7-20 ky tu va co it nhat 1 ky tu dac biet.";
    }
}
