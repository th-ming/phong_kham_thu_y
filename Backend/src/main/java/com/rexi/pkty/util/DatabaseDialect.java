package com.rexi.pkty.util;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Cross-database dialect helpers for SQL Server / PostgreSQL compatibility.
 *
 * Usage: pass JdbcTemplate to detect the runtime DB, then call the static
 * helper to generate the correct SQL fragment.
 *
 * NOTE: Every public static method is intentionally lightweight (no DB call)
 * except isPostgres / isSqlServer which do a one-shot metadata check.
 * Callers should cache the boolean result per-request if calling multiple
 * helpers in the same method.
 */
public final class DatabaseDialect {

    private DatabaseDialect() {}

    // ──────────────────────────────────────────────
    //  Database detection
    // ──────────────────────────────────────────────

    public static boolean isPostgres(JdbcTemplate jdbcTemplate) {
        try (var connection = jdbcTemplate.getDataSource().getConnection()) {
            return "PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName());
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isSqlServer(JdbcTemplate jdbcTemplate) {
        try (var connection = jdbcTemplate.getDataSource().getConnection()) {
            String productName = connection.getMetaData().getDatabaseProductName();
            return productName != null && productName.toLowerCase().contains("microsoft sql server");
        } catch (Exception e) {
            return false;
        }
    }

    // ──────────────────────────────────────────────
    //  Pagination  (LIMIT / OFFSET)
    // ──────────────────────────────────────────────

    /**
     * Append a dialect-correct pagination clause to a StringBuilder.
     *
     * <pre>
     *   PostgreSQL:   … ORDER BY x LIMIT 50 OFFSET 0
     *   SQL Server:   … ORDER BY x OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
     * </pre>
     *
     * @param sql       the StringBuilder to append to (must already contain a SELECT)
     * @param pg        true when running on PostgreSQL
     * @param limit     max rows to return
     * @param offset    row offset (0-based)
     */
    public static void appendPagination(StringBuilder sql, boolean pg, int limit, int offset) {
        if (pg) {
            sql.append(" LIMIT ").append(limit).append(" OFFSET ").append(offset);
        } else {
            sql.append(" OFFSET ").append(offset).append(" ROWS FETCH NEXT ").append(limit).append(" ROWS ONLY");
        }
    }

    /**
     * Return a pagination suffix as a plain String.
     */
    public static String paginationSql(boolean pg, int limit, int offset) {
        StringBuilder sb = new StringBuilder();
        appendPagination(sb, pg, limit, offset);
        return sb.toString();
    }

    /**
     * Common shorthand: OFFSET 0 ROWS FETCH NEXT N ROWS ONLY (SQL Server)
     * vs LIMIT N OFFSET 0 (PostgreSQL).
     */
    public static String topN(boolean pg, int n) {
        return paginationSql(pg, n, 0);
    }

    // ──────────────────────────────────────────────
    //  Soft-delete / boolean filter
    // ──────────────────────────────────────────────

    /**
     * Return a WHERE fragment that checks a soft-delete column.
     *
     * <pre>
     *   PostgreSQL:   (col IS NOT TRUE)
     *   SQL Server:   (col IS NULL OR LOWER(CAST(col AS varchar)) IN ('0','false'))
     * </pre>
     *
     * Works when the column is boolean (PG) or bit/tinyint (SQL Server).
     */
    public static String isNotDeleted(boolean pg) {
        return isNotDeleted(pg, "da_xoa");
    }

    public static String isNotDeleted(boolean pg, String column) {
        if (pg) {
            return "(" + column + " IS NOT TRUE)";
        }
        return "(" + column + " IS NULL OR LOWER(CAST(" + column + " AS varchar)) IN ('0', 'false'))";
    }

    /**
     * Return a WHERE fragment that checks a generic boolean/active column.
     *
     * <pre>
     *   PostgreSQL:   (col IS TRUE)    — for positive check
     *   SQL Server:   LOWER(CAST(col AS varchar)) IN ('1','true')
     * </pre>
     */
    public static String isActive(boolean pg, String column) {
        if (pg) {
            return "(" + column + " IS TRUE)";
        }
        return "LOWER(CAST(" + column + " AS varchar)) IN ('1', 'true')";
    }

    /**
     * Full combined soft-delete filter for the common pattern:
     * {@code (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0','false'))}
     */
    public static String softDeleteWhere(boolean pg) {
        return softDeleteWhere(pg, "da_xoa");
    }

    public static String softDeleteWhere(boolean pg, String column) {
        if (pg) {
            return "(" + column + " IS NOT TRUE)";
        }
        return "(" + column + " IS NULL OR LOWER(CAST(" + column + " AS varchar)) IN ('0', 'false'))";
    }

    // ──────────────────────────────────────────────
    //  Date / time expressions
    // ──────────────────────────────────────────────

    /**
     * Current date expression.
     * PostgreSQL: CURRENT_DATE   |   SQL Server: CAST(GETDATE() AS date)
     */
    public static String currentDate(boolean pg) {
        return pg ? "CURRENT_DATE" : "CAST(GETDATE() AS date)";
    }

    /**
     * Current timestamp expression (works in both, but provided for symmetry).
     */
    public static String currentTimestamp() {
        return "CURRENT_TIMESTAMP";
    }

    /**
     * Date arithmetic: dateColumn +/- N days.
     *
     * <pre>
     *   PostgreSQL:   dateCol + INTERVAL '3 days'
     *   SQL Server:   DATEADD(day, 3, dateCol)
     * </pre>
     */
    public static String dateAddDays(boolean pg, String dateColumn, int days) {
        if (pg) {
            if (days >= 0) {
                return dateColumn + " + INTERVAL '" + days + " days'";
            } else {
                return dateColumn + " - INTERVAL '" + Math.abs(days) + " days'";
            }
        }
        return "DATEADD(day, " + days + ", " + dateColumn + ")";
    }

    /**
     * Date subtraction in days: currentDate - N days.
     *
     * <pre>
     *   PostgreSQL:   CURRENT_DATE - 6
     *   SQL Server:   DATEADD(day, -6, CAST(GETDATE() AS date))
     * </pre>
     */
    public static String currentDateMinusDays(boolean pg, int days) {
        if (pg) {
            return "CURRENT_DATE - " + days;
        }
        return "DATEADD(day, -" + days + ", CAST(GETDATE() AS date))";
    }

    /**
     * Cast column to DATE.
     *
     * <pre>
     *   PostgreSQL:   col::date  (or col::date)
     *   SQL Server:   CAST(col AS date)
     * </pre>
     */
    public static String castToDate(boolean pg, String column) {
        if (pg) {
            return "(" + column + "::date)";
        }
        return "CAST(" + column + " AS date)";
    }

    /**
     * Cast column to TIME.
     *
     * <pre>
     *   PostgreSQL:   col::time
     *   SQL Server:   CAST(col AS time)
     * </pre>
     */
    public static String castToTime(boolean pg, String column) {
        if (pg) {
            return "(" + column + "::time)";
        }
        return "CAST(" + column + " AS time)";
    }

    /**
     * Cast column to varchar/text for boolean-to-string comparison.
     *
     * <pre>
     *   PostgreSQL:   col::text
     *   SQL Server:   CAST(col AS varchar)
     * </pre>
     */
    public static String castToText(boolean pg, String column) {
        if (pg) {
            return "(" + column + "::text)";
        }
        return "CAST(" + column + " AS varchar)";
    }

    /**
     * Cast column to integer.
     *
     * <pre>
     *   PostgreSQL:   col::integer
     *   SQL Server:   CAST(col AS int)
     * </pre>
     */
    public static String castToInt(boolean pg, String column) {
        if (pg) {
            return "(" + column + "::integer)";
        }
        return "CAST(" + column + " AS int)";
    }

    // ──────────────────────────────────────────────
    //  RETURNING / SCOPE_IDENTITY
    // ──────────────────────────────────────────────

    /**
     * After INSERT, return the auto-generated integer ID.
     *
     * <pre>
     *   PostgreSQL:   ... RETURNING id_column
     *   SQL Server:   ... ; SELECT CAST(SCOPE_IDENTITY() AS int)
     * </pre>
     *
     * @return the suffix to append after the INSERT ... VALUES (...) statement.
     */
    public static String insertReturningId(boolean pg, String idColumn) {
        if (pg) {
            return " RETURNING " + idColumn;
        }
        return "; SELECT CAST(SCOPE_IDENTITY() AS int)";
    }

    // ──────────────────────────────────────────────
    //  INFORMATION_SCHEMA helpers
    // ──────────────────────────────────────────────

    /**
     * Query INFORMATION_SCHEMA.COLUMNS for a table.
     *
     * PostgreSQL stores table names in lowercase by default, so we must
     * use LOWER(TABLE_NAME) = LOWER(?) or lowercase the literal.
     */
    public static String informationSchemaColumns(boolean pg) {
        if (pg) {
            return "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(TABLE_NAME) = LOWER(?)";
        }
        return "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?";
    }

    /**
     * Query INFORMATION_SCHEMA.COLUMNS with a hardcoded table name.
     */
    public static String informationSchemaColumnsForTable(boolean pg, String tableName) {
        if (pg) {
            return "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(TABLE_NAME) = '" + tableName.toLowerCase() + "'";
        }
        return "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + tableName + "'";
    }

    // ──────────────────────────────────────────────
    //  Time comparison helpers
    // ──────────────────────────────────────────────

    /**
     * Compare a column to a time parameter.
     *
     * <pre>
     *   PostgreSQL:   col = ?::time
     *   SQL Server:   CAST(col AS time) = CAST(? AS time)
     * </pre>
     */
    public static String timeEqualsParam(boolean pg, String column) {
        if (pg) {
            return "(" + column + " = ?::time)";
        }
        return "CAST(" + column + " AS time) = CAST(? AS time)";
    }

    /**
     * Column + duration > timeParam
     * e.g. busyStartMinute + duration > givenTime
     *
     * <pre>
     *   PostgreSQL:   (busyStartMinute + duration) > ?::time
     *   SQL Server:   CAST(busyStartMinute AS int) + COALESCE(duration, 30) > CAST(? AS time)
     * </pre>
     *
     * Note: for PG we just do string/time arithmetic; for SQL Server
     * we use int-minute arithmetic.
     */
    public static String busyEndAfterParam(boolean pg, String busyStartMinuteCol, String durationExpr) {
        if (pg) {
            // PostgreSQL: time + integer (minutes) comparison via cast
            return "(CAST(" + busyStartMinuteCol + " AS time) + (" + durationExpr + ") * INTERVAL '1 minute') > ?::time";
        }
        return busyStartMinuteCol + " + COALESCE(" + durationExpr + ", 30) > CAST(? AS time)";
    }

    // ──────────────────────────────────────────────
    //  UNION subquery alias
    // ──────────────────────────────────────────────

    /**
     * Subquery alias keyword (PostgreSQL requires AS, SQL Server accepts AS too).
     */
    public static String subqueryAlias(boolean pg) {
        return " AS ";
    }
}
