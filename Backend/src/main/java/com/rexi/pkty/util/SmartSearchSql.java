package com.rexi.pkty.util;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

public final class SmartSearchSql {
    private SmartSearchSql() {
    }

    public static void appendTokenSearch(StringBuilder where, List<Object> params, String search, String... fieldPredicates) {
        List<String> tokens = tokenize(search);
        if (tokens.isEmpty() || fieldPredicates.length == 0) {
            return;
        }

        for (String token : tokens) {
            where.append(" AND (");
            for (int i = 0; i < fieldPredicates.length; i++) {
                if (i > 0) {
                    where.append(" OR ");
                }
                where.append(fieldPredicates[i]);
                params.add("%" + token + "%");
            }
            where.append(")");
        }
    }

    public static List<String> tokenize(String search) {
        if (search == null || search.trim().isEmpty()) {
            return List.of();
        }

        String normalized = normalizeText(search);

        if (normalized.isEmpty()) {
            return List.of();
        }

        return Arrays.stream(normalized.split("\\s+"))
                .filter(token -> !token.isBlank())
                .distinct()
                .toList();
    }

    public static boolean matchesFields(String search, Object... fields) {
        List<String> queryTokens = tokenize(search);
        if (queryTokens.isEmpty()) {
            return true;
        }

        String combined = Arrays.stream(fields)
                .map(value -> value == null ? "" : String.valueOf(value))
                .map(SmartSearchSql::normalizeText)
                .filter(value -> !value.isBlank())
                .reduce("", (left, right) -> left + " " + right)
                .trim();
        if (combined.isEmpty()) {
            return false;
        }

        List<String> fieldTokens = tokenize(combined);
        return queryTokens.stream().allMatch(queryToken ->
                combined.contains(queryToken) ||
                        fieldTokens.stream().anyMatch(fieldToken -> isCloseToken(queryToken, fieldToken)));
    }

    private static String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static boolean isCloseToken(String queryToken, String fieldToken) {
        if (queryToken.isBlank() || fieldToken.isBlank()) {
            return false;
        }
        if (fieldToken.contains(queryToken) || queryToken.contains(fieldToken)) {
            return true;
        }
        if (queryToken.length() < 4 || fieldToken.length() < 4 || Math.abs(queryToken.length() - fieldToken.length()) > 2) {
            return false;
        }
        int tolerance = queryToken.length() >= 7 ? 2 : 1;
        return editDistance(queryToken, fieldToken) <= tolerance;
    }

    private static int editDistance(String a, String b) {
        int[] previous = new int[b.length() + 1];
        int[] current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            int rowMin = current[0];
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(Math.min(previous[j] + 1, current[j - 1] + 1), previous[j - 1] + cost);
                rowMin = Math.min(rowMin, current[j]);
            }
            if (rowMin > 2) {
                return 3;
            }
            int[] temp = previous;
            previous = current;
            current = temp;
        }
        return previous[b.length()];
    }
}
