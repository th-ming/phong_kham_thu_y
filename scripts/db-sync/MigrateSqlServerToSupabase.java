import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.TreeSet;

public class MigrateSqlServerToSupabase {
    public static void main(String[] args) throws Exception {
        String mssqlUrl = required("MSSQL_URL");
        String mssqlUser = required("MSSQL_USER");
        String mssqlPassword = required("MSSQL_PASSWORD");
        String pgUrl = required("PG_URL");
        String pgUser = required("PG_USER");
        String pgPassword = required("PG_PASSWORD");

        try (Connection source = DriverManager.getConnection(mssqlUrl, mssqlUser, mssqlPassword);
             Connection target = DriverManager.getConnection(pgUrl, pgUser, pgPassword)) {
            target.setAutoCommit(false);

            Map<String, String> sourceTables = readSqlServerTables(source);
            Map<String, List<String>> sourceColumns = readSqlServerColumns(source, sourceTables);
            Map<String, List<String>> targetColumns = readPostgresColumns(target);
            Map<String, Set<String>> dependencies = readPostgresFkDependencies(target);
            List<String> tables = orderedTables(sourceTables.keySet(), targetColumns.keySet(), dependencies);

            long sourceRows = totalRowsSqlServer(source, sourceTables);
            long targetRows = totalRowsPostgres(target, tables);
            if (sourceRows == 0 && targetRows > 0) {
                throw new IllegalStateException("Refusing to wipe Supabase because SQL Server source has 0 rows but Supabase has " + targetRows + " rows.");
            }

            truncateTarget(target, tables);
            int migratedTables = 0;
            for (String table : tables) {
                List<String> columns = sharedColumns(sourceColumns.get(table), targetColumns.get(table));
                if (columns.isEmpty()) {
                    continue;
                }
                long count = copyTable(source, target, sourceTables.get(table), table, columns);
                resetSequences(target, table);
                migratedTables++;
                System.out.println("COPIED " + table + "=" + count);
            }

            target.commit();
            System.out.println("DONE tables=" + migratedTables + " source_rows=" + sourceRows);
        }
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing environment variable: " + name);
        }
        return value;
    }

    private static Map<String, String> readSqlServerTables(Connection connection) throws SQLException {
        Map<String, String> tables = new LinkedHashMap<>();
        try (Statement statement = connection.createStatement();
             ResultSet rs = statement.executeQuery(
                     "select TABLE_NAME from INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA='dbo' and TABLE_TYPE='BASE TABLE' and TABLE_NAME <> 'sysdiagrams' order by TABLE_NAME")) {
            while (rs.next()) {
                String table = rs.getString(1);
                tables.put(key(table), table);
            }
        }
        return tables;
    }

    private static Map<String, List<String>> readSqlServerColumns(Connection connection, Map<String, String> tables) throws SQLException {
        Map<String, List<String>> columns = new HashMap<>();
        for (Map.Entry<String, String> entry : tables.entrySet()) {
            List<String> names = new ArrayList<>();
            try (PreparedStatement statement = connection.prepareStatement(
                    "select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA='dbo' and TABLE_NAME=? order by ORDINAL_POSITION")) {
                statement.setString(1, entry.getValue());
                try (ResultSet rs = statement.executeQuery()) {
                    while (rs.next()) {
                        names.add(key(rs.getString(1)));
                    }
                }
            }
            columns.put(entry.getKey(), names);
        }
        return columns;
    }

    private static Map<String, List<String>> readPostgresColumns(Connection connection) throws SQLException {
        Map<String, List<String>> columns = new HashMap<>();
        try (Statement statement = connection.createStatement();
             ResultSet rs = statement.executeQuery(
                     "select table_name, column_name from information_schema.columns where table_schema='public' order by table_name, ordinal_position")) {
            while (rs.next()) {
                String table = key(rs.getString(1));
                String column = key(rs.getString(2));
                columns.computeIfAbsent(table, ignored -> new ArrayList<>()).add(column);
            }
        }
        return columns;
    }

    private static Map<String, Set<String>> readPostgresFkDependencies(Connection connection) throws SQLException {
        Map<String, Set<String>> dependencies = new HashMap<>();
        String sql = """
                select tc.table_name, ccu.table_name as foreign_table_name
                from information_schema.table_constraints tc
                join information_schema.key_column_usage kcu
                  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
                join information_schema.constraint_column_usage ccu
                  on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
                where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
                """;
        try (Statement statement = connection.createStatement();
             ResultSet rs = statement.executeQuery(sql)) {
            while (rs.next()) {
                String table = key(rs.getString(1));
                String parent = key(rs.getString(2));
                if (!table.equals(parent)) {
                    dependencies.computeIfAbsent(table, ignored -> new TreeSet<>()).add(parent);
                }
            }
        }
        return dependencies;
    }

    private static List<String> orderedTables(Set<String> sourceTables, Set<String> targetTables, Map<String, Set<String>> dependencies) {
        Set<String> tables = new TreeSet<>(sourceTables);
        tables.retainAll(targetTables);

        Map<String, Set<String>> deps = new HashMap<>();
        Map<String, Set<String>> children = new HashMap<>();
        for (String table : tables) {
            Set<String> tableDeps = new TreeSet<>(dependencies.getOrDefault(table, Collections.emptySet()));
            tableDeps.retainAll(tables);
            deps.put(table, tableDeps);
            for (String parent : tableDeps) {
                children.computeIfAbsent(parent, ignored -> new TreeSet<>()).add(table);
            }
        }

        Queue<String> ready = new ArrayDeque<>();
        for (String table : tables) {
            if (deps.get(table).isEmpty()) {
                ready.add(table);
            }
        }

        List<String> ordered = new ArrayList<>();
        while (!ready.isEmpty()) {
            String table = ready.remove();
            ordered.add(table);
            for (String child : children.getOrDefault(table, Collections.emptySet())) {
                Set<String> childDeps = deps.get(child);
                childDeps.remove(table);
                if (childDeps.isEmpty()) {
                    ready.add(child);
                }
            }
        }

        for (String table : tables) {
            if (!ordered.contains(table)) {
                ordered.add(table);
            }
        }
        return ordered;
    }

    private static List<String> sharedColumns(List<String> source, List<String> target) {
        Set<String> targetSet = new HashSet<>(target);
        List<String> shared = new ArrayList<>();
        for (String column : source) {
            if (targetSet.contains(column)) {
                shared.add(column);
            }
        }
        return shared;
    }

    private static void truncateTarget(Connection target, List<String> tables) throws SQLException {
        if (tables.isEmpty()) {
            return;
        }
        StringBuilder sql = new StringBuilder("truncate table ");
        for (int i = 0; i < tables.size(); i++) {
            if (i > 0) {
                sql.append(", ");
            }
            sql.append("public.").append(quotePostgres(tables.get(i)));
        }
        sql.append(" restart identity cascade");
        try (Statement statement = target.createStatement()) {
            statement.execute(sql.toString());
        }
    }

    private static long copyTable(Connection source, Connection target, String sourceTable, String targetTable, List<String> columns) throws SQLException {
        String sourceSql = "select " + selectSqlServerColumns(columns) + " from dbo." + quoteSqlServer(sourceTable);
        String insertSql = "insert into public." + quotePostgres(targetTable) + " (" + postgresColumnList(columns) + ") values (" + placeholders(columns.size()) + ")";
        long count = 0;
        try (Statement read = source.createStatement();
             ResultSet rs = read.executeQuery(sourceSql);
             PreparedStatement insert = target.prepareStatement(insertSql)) {
            ResultSetMetaData meta = rs.getMetaData();
            while (rs.next()) {
                for (int i = 1; i <= meta.getColumnCount(); i++) {
                    insert.setObject(i, rs.getObject(i));
                }
                insert.addBatch();
                count++;
                if (count % 500 == 0) {
                    insert.executeBatch();
                }
            }
            insert.executeBatch();
        }
        return count;
    }

    private static void resetSequences(Connection connection, String table) throws SQLException {
        String sql = """
                select a.attname, pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname)
                from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                join pg_attribute a on a.attrelid = c.oid
                where n.nspname = 'public' and c.relname = ? and pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) is not null
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, table);
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    String column = rs.getString(1);
                    String sequence = rs.getString(2);
                    String reset = "select setval(?, greatest(coalesce((select max(" + quotePostgres(column) + ") from public." + quotePostgres(table) + "), 1), 1), true)";
                    try (PreparedStatement resetStatement = connection.prepareStatement(reset)) {
                        resetStatement.setString(1, sequence);
                        resetStatement.execute();
                    }
                }
            }
        }
    }

    private static long totalRowsSqlServer(Connection connection, Map<String, String> tables) throws SQLException {
        long total = 0;
        for (String table : tables.values()) {
            try (Statement statement = connection.createStatement();
                 ResultSet rs = statement.executeQuery("select count(*) from dbo." + quoteSqlServer(table))) {
                rs.next();
                total += rs.getLong(1);
            }
        }
        return total;
    }

    private static long totalRowsPostgres(Connection connection, List<String> tables) throws SQLException {
        long total = 0;
        for (String table : tables) {
            try (Statement statement = connection.createStatement();
                 ResultSet rs = statement.executeQuery("select count(*) from public." + quotePostgres(table))) {
                rs.next();
                total += rs.getLong(1);
            }
        }
        return total;
    }

    private static String selectSqlServerColumns(List<String> columns) {
        List<String> quoted = new ArrayList<>();
        for (String column : columns) {
            quoted.add(quoteSqlServer(column));
        }
        return String.join(", ", quoted);
    }

    private static String postgresColumnList(List<String> columns) {
        List<String> quoted = new ArrayList<>();
        for (String column : columns) {
            quoted.add(quotePostgres(column));
        }
        return String.join(", ", quoted);
    }

    private static String placeholders(int count) {
        return String.join(", ", Collections.nCopies(count, "?"));
    }

    private static String quoteSqlServer(String name) {
        return "[" + name.replace("]", "]]") + "]";
    }

    private static String quotePostgres(String name) {
        return "\"" + name.replace("\"", "\"\"") + "\"";
    }

    private static String key(String value) {
        return value.toLowerCase(Locale.ROOT);
    }
}
