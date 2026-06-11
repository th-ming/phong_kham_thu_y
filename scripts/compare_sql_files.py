#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Parse and compare two SQL files (SQL Server vs PostgreSQL)."""

import re
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
from collections import OrderedDict


def read_file(path):
    with open(path, 'rb') as f:
        raw = f.read()
    if raw[:2] == b'\xff\xfe' or raw[:2] == b'\xfe\xff':
        return raw.decode('utf-16')
    if raw[:3] == b'\xef\xbb\xbf':
        return raw.decode('utf-8-sig')
    try:
        return raw.decode('utf-8')
    except UnicodeDecodeError:
        try:
            return raw.decode('utf-16')
        except:
            return raw.decode('latin-1')


def normalize_type(t):
    """Normalize SQL types for comparison."""
    t = t.strip().upper()
    t = re.sub(r'\s*IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    # Remove SQL Server brackets around types
    t = t.replace('[', '').replace(']', '')
    mappings = {
        'BIT': 'BOOLEAN',
        'INT': 'INT',
        'BIGINT': 'BIGINT',
        'TINYINT': 'SMALLINT',
        'NVARCHAR(MAX)': 'TEXT',
        'VARCHAR(MAX)': 'TEXT',
        'NTEXT': 'TEXT',
        'TEXT': 'TEXT',
        'DATETIME': 'TIMESTAMP',
        'DATETIME2(6)': 'TIMESTAMP(6)',
        'SMALLDATETIME': 'TIMESTAMP',
        'DATE': 'DATE',
        'TIME(7)': 'TIME',
        'DECIMAL': 'DECIMAL',
        'NUMERIC': 'DECIMAL',
        'MONEY': 'DECIMAL(19,4)',
        'SERIAL': 'SERIAL',
        'BIGSERIAL': 'BIGSERIAL',
    }
    for k, v in mappings.items():
        if t.startswith(k):
            return t.replace(k, v)
    return t


def strip_brackets(s):
    return s.strip('[]').strip()


def extract_tables(content):
    """Extract table definitions: {table_name: [(col_name, col_type), ...]}"""
    tables = OrderedDict()
    lines = content.split('\n')

    i = 0
    current_table = None
    current_columns = []
    bracket_depth = 0

    # Regex patterns
    create_table_re = re.compile(
        r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?'
        r'(?:\[?\w+\]?\.)?\[?(\w+)\]?\s*\(',
        re.IGNORECASE
    )

    # Column: [name] [type](size) OR [name] type(size) OR name type
    col_re = re.compile(
        r'\s*\[?(\w+)\]?\s+\[?(\w+)\]?(?:\s*\(([^)]*)\))?',
        re.IGNORECASE
    )

    # Lines to skip inside CREATE TABLE
    skip_prefixes = (
        'CONSTRAINT', 'PRIMARY', 'UNIQUE', 'FOREIGN', 'INDEX',
        'CHECK', 'WITH', 'ON', ')', 'TEXTIMAGE_'
    )

    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith('--') or line.startswith('/*'):
            i += 1
            continue

        if not current_table:
            m = create_table_re.search(line)
            if m:
                current_table = strip_brackets(m.group(1))
                current_columns = []
                bracket_depth = 1
                # Count remaining brackets in this line
                line_rest = line[line.index('('):]
                for ch in line_rest[1:]:
                    if ch == '(':
                        bracket_depth += 1
                    elif ch == ')':
                        bracket_depth -= 1
                if bracket_depth <= 0:
                    # Single-line table
                    tables[current_table] = current_columns
                    current_table = None
                    current_columns = []
                i += 1
                continue
            i += 1
            continue

        # We are inside a CREATE TABLE block
        for ch in line:
            if ch == '(':
                bracket_depth += 1
            elif ch == ')':
                bracket_depth -= 1

        if bracket_depth <= 0:
            if current_columns:
                tables[current_table] = current_columns
            current_table = None
            current_columns = []
            i += 1
            continue

        # Skip constraint/metadata lines
        skip = False
        for prefix in skip_prefixes:
            if line.upper().startswith(prefix) or (' ' + prefix) in line.upper()[:30]:
                skip = True
                break
        if 'TEXTIMAGE_' in line or 'ON [PRIMARY]' in line.upper() or 'NOT NULL' not in line.upper():
            # If line doesn't contain 'NOT NULL' and isn't a constraint, skip it
            # Actually, some columns might not have NOT NULL. Let's check if it looks like a column.
            pass

        if skip:
            i += 1
            continue

        # Try to extract column
        col_match = col_re.match(line)
        if col_match:
            col_name = strip_brackets(col_match.group(1))
            col_type_raw = col_match.group(2).strip('[]')

            # Check if it's a constraint keyword (not a type)
            upper_type = col_type_raw.upper()
            if upper_type in ('CONSTRAINT', 'PRIMARY', 'UNIQUE', 'FOREIGN', 'INDEX', 'CHECK', 'WITH', 'ON'):
                i += 1
                continue

            # Get the size if present
            size_str = col_match.group(3)
            if size_str:
                col_type = f"{col_type_raw}({size_str.strip()})"
            else:
                col_type = col_type_raw

            current_columns.append((col_name, col_type))

        i += 1

    return tables


def extract_pks(content):
    """Extract PRIMARY KEY constraints."""
    pks = OrderedDict()
    create_re = re.compile(
        r'CREATE\s+TABLE\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?\s*\(',
        re.IGNORECASE
    )
    pk_re = re.compile(
        r'PRIMARY\s+KEY\s*(?:CLUSTERED|NONCLUSTERED)?\s*\(([^)]+)\)',
        re.IGNORECASE
    )
    alter_pk_re = re.compile(
        r'ALTER\s+TABLE.*?ADD\s+(?:CONSTRAINT\s+\w+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)',
        re.IGNORECASE | re.DOTALL
    )

    lines = content.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = create_re.search(line)
        if m:
            table = strip_brackets(m.group(1))
            # Search inside block for PK
            j = i + 1
            depth = 1
            while j < len(lines):
                jline = lines[j]
                for ch in jline:
                    if ch == '(':
                        depth += 1
                    elif ch == ')':
                        depth -= 1
                if depth <= 0:
                    break
                pk_match = pk_re.search(jline)
                if pk_match:
                    cols = [strip_brackets(c) for c in pk_match.group(1).split(',')]
                    pks[table] = cols
                    break
                j += 1
        i += 1

    # Also check ALTER TABLE PK (if any)
    for m in alter_pk_re.finditer(content):
        # Determine table name from context
        ctx = content[max(0, m.start() - 80):m.start()]
        ctx_m = re.search(r'TABLE\s+\[?(\w+)\]?', ctx, re.IGNORECASE)
        if ctx_m:
            table = strip_brackets(ctx_m.group(1))
            cols = [strip_brackets(c) for c in m.group(1).split(',')]
            pks[table] = cols

    return pks


def extract_fks(content, is_postgres=False):
    """Extract FOREIGN KEY constraints."""
    fks = OrderedDict()

    if is_postgres:
        pattern = re.compile(
            r'ALTER\s+TABLE\s+(?:\w+\.)?(\w+)\s+'
            r'ADD\s+CONSTRAINT\s+(\w+)\s+'
            r'FOREIGN\s+KEY\s*\(([^)]+)\)\s*'
            r'REFERENCES\s+(?:\w+\.)?(\w+)\s*\(([^)]+)\)',
            re.IGNORECASE | re.DOTALL)
    else:
        # Simpler pattern that handles [dbo].[Table] and multi-line
        pattern = re.compile(
            r'ALTER\s+TABLE\s+\[dbo\]\.\[?(\w+)\]?\s+'
            r'.*?'
            r'FOREIGN\s+KEY\s*\(([^)]+)\)'
            r'.*?'
            r'REFERENCES\s+\[dbo\]\.\[?(\w+)\]?'
            r'.*?\(([^)]+)\)',
            re.IGNORECASE | re.DOTALL)

    for m in pattern.finditer(content):
        if is_postgres:
            table = m.group(1).strip('[]')
            constraint = m.group(2).strip('[]')
            fk_cols = [strip_brackets(c) for c in m.group(3).split(',')]
            ref_table = m.group(4).strip('[]')
            ref_cols = [strip_brackets(c) for c in m.group(5).split(',')]
        else:
            table = m.group(1).strip('[]')
            # Try to find constraint name from context
            constraint = 'unnamed'
            ctx_start = max(0, m.start() - 100)
            ctx = content[ctx_start:m.start()+50]
            cn = re.search(r'CONSTRAINT\s+\[?(\w+)\]?', ctx, re.IGNORECASE)
            if cn:
                constraint = cn.group(1).strip('[]')
            fk_cols = [strip_brackets(c) for c in m.group(2).split(',')]
            ref_table = m.group(3).strip('[]')
            ref_cols = [strip_brackets(c) for c in m.group(4).split(',')]

        if 'DUP_REMOVED' in constraint.upper():
            continue
        key = f"{table}.{constraint}"
        fks[key] = {
            'table': table,
            'constraint': constraint,
            'columns': fk_cols,
            'ref_table': ref_table,
            'ref_columns': ref_cols
        }

    return fks


def extract_indexes(content, is_postgres=False):
    """Extract INDEX definitions."""
    indexes = OrderedDict()

    if is_postgres:
        pattern = re.compile(
            r'CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(?:\w+\.)?(\w+)\s*\(([^)]+)\)',
            re.IGNORECASE | re.DOTALL)
    else:
        pattern = re.compile(
            r'CREATE\s+(?:UNIQUE\s+)?(?:NONCLUSTERED|CLUSTERED)\s+INDEX\s+\[?(\w+)\]?\s+'
            r'ON\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?\s*\(([^)]+)\)',
            re.IGNORECASE | re.DOTALL)

    for m in pattern.finditer(content):
        idx_name = m.group(1).strip('[]')
        table = m.group(2).strip('[]')
        cols_raw = m.group(3)
        cols = []
        for c in cols_raw.split(','):
            c = c.strip()
            c = c.replace(' ASC', '').replace(' DESC', '')
            c = c.replace('[', '').replace(']', '').strip()
            if c:
                cols.append(c)
        indexes[f"{table}.{idx_name}"] = {
            'name': idx_name,
            'table': table,
            'columns': cols
        }

    return indexes


def extract_views(content):
    """Extract VIEW definitions."""
    views = OrderedDict()
    pattern = re.compile(
        r'CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?\s+'
        r'AS\s+(.*?)(?=GO\b|\n\s*GO\b|\n\s*\n\s*(?:CREATE|ALTER)\b|\Z)',
        re.IGNORECASE | re.DOTALL)

    for m in pattern.finditer(content):
        view_name = strip_brackets(m.group(1))
        view_body = m.group(2).strip()
        views[view_name] = view_body[:200]

    return views


def extract_functions(content, is_postgres=False):
    """Extract FUNCTION/PROCEDURE definitions."""
    funcs = OrderedDict()

    if is_postgres:
        patterns = [
            (r'CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(\w+)\s*\(', re.IGNORECASE),
            (r'CREATE\s+OR\s+REPLACE\s+PROCEDURE\s+(\w+)', re.IGNORECASE),
        ]
    else:
        patterns = [
            (r'CREATE\s+FUNCTION\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?\s*\(', re.IGNORECASE),
            (r'CREATE\s+PROCEDURE\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?', re.IGNORECASE),
        ]

    for pat, flags in patterns:
        for m in re.finditer(pat, content):
            func_name = strip_brackets(m.group(1))
            if func_name.upper().startswith('FN_') or func_name.upper().startswith('SP_') or \
               func_name.upper().startswith('UFN_') or func_name.upper().startswith('TRG_'):
                funcs[func_name] = True

    return funcs


def extract_defaults(content, is_postgres=False):
    """Extract DEFAULT value constraints."""
    defaults = []

    if is_postgres:
        pattern = re.compile(
            r'ALTER\s+TABLE\s+(?:\w+\.)?(\w+)\s+ALTER\s+COLUMN\s+(\w+)\s+SET\s+DEFAULT\s+(.+?);',
            re.IGNORECASE)
    else:
        pattern = re.compile(
            r'ALTER\s+TABLE\s+(?:\[?\w+\]?\.)?\[?(\w+)\]?'
            r'\s+ADD\s+DEFAULT\s+(.+?)\s+FOR\s+\[?(\w+)\]?',
            re.IGNORECASE)

    for m in pattern.finditer(content):
        table = m.group(1).strip('[]')
        if is_postgres:
            col = m.group(2)
            val = m.group(3).strip()
        else:
            col = m.group(3).strip('[]')
            val = m.group(2).strip().strip('()')
        defaults.append(f"{table}.{col} = {val}")

    return defaults


def print_header(text):
    print(f"\n{'='*80}")
    print(f"  {text}")
    print(f"{'='*80}")


def print_sub(text):
    print(f"  {'-'*70}")
    print(f"  {text}")
    print(f"  {'-'*70}")


def main():
    content_ss = read_file('Database/PhongKhamThuY.sql')
    content_pg = read_file('Database/PhongKhamThuY_Postgres.sql')

    print("\n" + "="*80)
    print("  SO SANH TOAN DIEN: Database/PhongKhamThuY.sql (SQL Server) vs Database/PhongKhamThuY_Postgres.sql (PostgreSQL)")
    print("="*80)

    # ============================================================
    # 1. TABLES & COLUMNS
    # ============================================================
    print_header("1. BANG VA COT")

    tables_ss = extract_tables(content_ss)
    tables_pg = extract_tables(content_pg)

    print(f"\n  SQL Server: {len(tables_ss)} bang")
    print(f"  PostgreSQL: {len(tables_pg)} bang")

    # Compare table names
    ss_table_names = set(tables_ss.keys())
    pg_table_names = set(tables_pg.keys())
    only_ss_tables = ss_table_names - pg_table_names
    only_pg_tables = pg_table_names - ss_table_names
    common_tables = ss_table_names & pg_table_names

    if only_ss_tables:
        print_sub(f"Bang CHI CO trong SQL Server ({len(only_ss_tables)})")
        for t in sorted(only_ss_tables):
            print(f"    - {t}")
    if only_pg_tables:
        print_sub(f"Bang CHI CO trong PostgreSQL ({len(only_pg_tables)})")
        for t in sorted(only_pg_tables):
            print(f"    - {t}")

    print_sub(f"Bang co o ca 2 file ({len(common_tables)})")

    col_mismatches = []
    col_missing_ss = []
    col_missing_pg = []

    for t in sorted(common_tables):
        cols1 = OrderedDict(tables_ss[t])
        cols2 = OrderedDict(tables_pg[t])
        c1 = set(cols1.keys())
        c2 = set(cols2.keys())

        only_in_ss = c1 - c2
        only_in_pg = c2 - c1
        common_cols = c1 & c2

        type_diff = []
        for c in sorted(common_cols):
            t1 = normalize_type(cols1[c])
            t2 = normalize_type(cols2[c])
            if t1 != t2:
                type_diff.append((c, cols1[c], cols2[c]))

        if only_in_ss or only_in_pg or type_diff:
            print(f"\n  [X] {t} (SS: {len(cols1)} cot, PG: {len(cols2)} cot)")
            if only_in_ss:
                cols_str = ', '.join(sorted(only_in_ss))
                print(f"     + Thieu trong PG ({len(only_in_ss)}): {cols_str}")
                col_missing_pg.extend([(t, c) for c in only_in_ss])
            if only_in_pg:
                cols_str = ', '.join(sorted(only_in_pg))
                print(f"     + Thieu trong SS ({len(only_in_pg)}): {cols_str}")
                col_missing_ss.extend([(t, c) for c in only_in_pg])
            if type_diff:
                for c, t1, t2 in type_diff:
                    print(f"     + Kieu cot '{c}': SS=[{t1}] vs PG=[{t2}]")
                    col_mismatches.append((t, c, t1, t2))
        else:
            print(f"  [OK] {t} ({len(cols1)} cot - giong nhau hoan toan)")

    if col_mismatches:
        print_sub(f"Tong cong kieu cot khac nhau: {len(col_mismatches)}")
    if col_missing_pg:
        print_sub(f"Tong cong cot thieu trong PG: {len(col_missing_pg)}")
    if col_missing_ss:
        print_sub(f"Tong cong cot thieu trong SS: {len(col_missing_ss)}")

    # ============================================================
    # 2. PRIMARY KEYS
    # ============================================================
    print_header("2. PRIMARY KEY")

    pks_ss = extract_pks(content_ss)
    pks_pg = extract_pks(content_pg)

    pk_all_tables = sorted(set(list(pks_ss.keys()) + list(pks_pg.keys())))
    pk_ok = 0
    pk_diff = 0

    print(f"\n  SQL Server: {len(pks_ss)} PK constraints")
    print(f"  PostgreSQL: {len(pks_pg)} PK constraints")

    for t in pk_all_tables:
        if t in pks_ss and t in pks_pg:
            if pks_ss[t] == pks_pg[t]:
                pk_ok += 1
                print(f"  [OK] {t}: ({', '.join(pks_ss[t])})")
            else:
                pk_diff += 1
                print(f"  [X] {t}: SS=({', '.join(pks_ss[t])}) vs PG=({', '.join(pks_pg[t])})")
        elif t in pks_ss:
            print(f"  [WARN] {t}: chi co trong SS ({', '.join(pks_ss[t])})")
        else:
            print(f"  [WARN] {t}: chi co trong PG ({', '.join(pks_pg[t])})")

    print(f"\n  => PK giong: {pk_ok}, PK khac: {pk_diff}")

    # ============================================================
    # 3. FOREIGN KEYS
    # ============================================================
    print_header("3. FOREIGN KEY")

    fks_ss = extract_fks(content_ss, is_postgres=False)
    fks_pg = extract_fks(content_pg, is_postgres=True)

    # Map by table
    fk_by_table_ss = OrderedDict()
    for key, fk in fks_ss.items():
        t = fk['table']
        if t not in fk_by_table_ss:
            fk_by_table_ss[t] = []
        fk_by_table_ss[t].append(f"{fk['constraint']}: {','.join(fk['columns'])} -> {fk['ref_table']}({','.join(fk['ref_columns'])})")

    fk_by_table_pg = OrderedDict()
    for key, fk in fks_pg.items():
        t = fk['table']
        if t not in fk_by_table_pg:
            fk_by_table_pg[t] = []
        fk_by_table_pg[t].append(f"{fk['constraint']}: {','.join(fk['columns'])} -> {fk['ref_table']}({','.join(fk['ref_columns'])})")

    all_fk_tables = sorted(set(list(fk_by_table_ss.keys()) + list(fk_by_table_pg.keys())))

    print(f"\n  SQL Server: {len(fks_ss)} FK constraints")
    print(f"  PostgreSQL: {len(fks_pg)} FK constraints")

    total_fk_match = 0
    total_fk_ss_only = 0
    total_fk_pg_only = 0

    for t in all_fk_tables:
        ss_fks = set(fk_by_table_ss.get(t, []))
        pg_fks = set(fk_by_table_pg.get(t, []))

        only_ss = ss_fks - pg_fks
        only_pg = pg_fks - ss_fks
        common_fk = ss_fks & pg_fks

        total_fk_match += len(common_fk)
        total_fk_ss_only += len(only_ss)
        total_fk_pg_only += len(only_pg)

        if only_ss or only_pg:
            print(f"\n  [X] Bang {t}:")
            if only_ss:
                print(f"     + Chi co trong SS ({len(only_ss)}):")
                for f in sorted(only_ss):
                    print(f"       - {f}")
            if only_pg:
                print(f"     + Chi co trong PG ({len(only_pg)}):")
                for f in sorted(only_pg):
                    print(f"       - {f}")
        else:
            if common_fk:
                print(f"  [OK] Bang {t}: {len(common_fk)} FK - giong nhau")

    print(f"\n  => FK trung nhau: {total_fk_match}, FK chi trong SS: {total_fk_ss_only}, FK chi trong PG: {total_fk_pg_only}")

    # ============================================================
    # 4. INDEXES
    # ============================================================
    print_header("4. INDEX")

    indexes_ss = extract_indexes(content_ss, is_postgres=False)
    indexes_pg = extract_indexes(content_pg, is_postgres=True)

    print(f"\n  SQL Server: {len(indexes_ss)} indexes")
    print(f"  PostgreSQL: {len(indexes_pg)} indexes")

    idx_by_table_ss = OrderedDict()
    for key, idx in indexes_ss.items():
        t = idx['table']
        if t not in idx_by_table_ss:
            idx_by_table_ss[t] = []
        idx_by_table_ss[t].append(f"{idx['name']}({','.join(idx['columns'])})")

    idx_by_table_pg = OrderedDict()
    for key, idx in indexes_pg.items():
        t = idx['table']
        if t not in idx_by_table_pg:
            idx_by_table_pg[t] = []
        idx_by_table_pg[t].append(f"{idx['name']}({','.join(idx['columns'])})")

    all_idx_tables = sorted(set(list(idx_by_table_ss.keys()) + list(idx_by_table_pg.keys())))

    total_idx_match = 0
    total_idx_ss_only = 0
    total_idx_pg_only = 0

    for t in all_idx_tables:
        ss_idxs = set(idx_by_table_ss.get(t, []))
        pg_idxs = set(idx_by_table_pg.get(t, []))
        only_ss = ss_idxs - pg_idxs
        only_pg = pg_idxs - ss_idxs
        common_idx = ss_idxs & pg_idxs
        total_idx_match += len(common_idx)
        total_idx_ss_only += len(only_ss)
        total_idx_pg_only += len(only_pg)
        if only_ss or only_pg:
            print(f"\n  [X] Bang {t}:")
            for idx in sorted(only_ss):
                print(f"     + Chi co trong SS: {idx}")
            for idx in sorted(only_pg):
                print(f"     + Chi co trong PG: {idx}")
        else:
            if common_idx:
                print(f"  [OK] Bang {t}: {len(common_idx)} index - giong nhau")

    print(f"\n  => Index trung nhau: {total_idx_match}, Index chi trong SS: {total_idx_ss_only}, Index chi trong PG: {total_idx_pg_only}")

    # ============================================================
    # 5. VIEWS
    # ============================================================
    print_header("5. VIEW")

    views_ss = extract_views(content_ss)
    views_pg = extract_views(content_pg)

    print(f"\n  SQL Server: {len(views_ss)} views")
    print(f"  PostgreSQL: {len(views_pg)} views")

    all_views = sorted(set(list(views_ss.keys()) + list(views_pg.keys())))
    for v in all_views:
        if v in views_ss and v in views_pg:
            print(f"  [OK] {v}")
        elif v in views_ss:
            print(f"  [WARN] {v} (chi co trong SS)")
        else:
            print(f"  [WARN] {v} (chi co trong PG)")

    # ============================================================
    # 6. FUNCTIONS / PROCEDURES
    # ============================================================
    print_header("6. FUNCTION / PROCEDURE")

    funcs_ss = extract_functions(content_ss, is_postgres=False)
    funcs_pg = extract_functions(content_pg, is_postgres=True)

    print(f"\n  SQL Server: {len(funcs_ss)} functions/procedures")
    print(f"  PostgreSQL: {len(funcs_pg)} functions/procedures")

    all_funcs = sorted(set(list(funcs_ss.keys()) + list(funcs_pg.keys())))
    for f in all_funcs:
        if f in funcs_ss and f in funcs_pg:
            print(f"  [OK] {f}")
        elif f in funcs_ss:
            print(f"  [WARN] {f} (chi co trong SS)")
        else:
            print(f"  [WARN] {f} (chi co trong PG)")

    # ============================================================
    # 7. DEFAULT VALUES
    # ============================================================
    print_header("7. DEFAULT VALUES")

    defaults_ss = extract_defaults(content_ss, is_postgres=False)
    defaults_pg = extract_defaults(content_pg, is_postgres=True)

    print(f"\n  SQL Server: {len(defaults_ss)} defaults")
    print(f"  PostgreSQL: {len(defaults_pg)} defaults")

    ss_set = set(defaults_ss)
    pg_set = set(defaults_pg)

    for d in sorted(ss_set - pg_set):
        print(f"  [X] Chi co trong SS: {d}")
    for d in sorted(pg_set - ss_set):
        print(f"  [X] Chi co trong PG: {d}")
    for d in sorted(ss_set & pg_set):
        print(f"  [OK] {d}")

    # ============================================================
    # 8. CHECK CONSTRAINTS
    # ============================================================
    print_header("8. CHECK CONSTRAINTS")

    check_ss = set()
    check_pg = set()

    for m in re.finditer(
        r'ALTER\s+TABLE.*?ADD\s+(?:CONSTRAINT\s+\w+\s+)?CHECK\s+\(([^)]+)\)',
        content_ss, re.IGNORECASE
    ):
        val = m.group(1).strip()
        val = val.replace('[', '').replace(']', '')
        check_ss.add(val)

    for m in re.finditer(
        r'ALTER\s+TABLE.*?ADD\s+CONSTRAINT\s+\w+\s+CHECK\s+\(([^)]+)\)',
        content_pg, re.IGNORECASE
    ):
        check_pg.add(m.group(1).strip())

    if check_ss:
        print(f"\n  SQL Server CHECK ({len(check_ss)}):")
        for c in sorted(check_ss):
            print(f"    - {c}")
    if check_pg:
        print(f"\n  PostgreSQL CHECK ({len(check_pg)}):")
        for c in sorted(check_pg):
            print(f"    - {c}")

    # ============================================================
    # 9. SUMMARY
    # ============================================================
    print_header("9. TONG KET")

    issues = []

    if only_ss_tables:
        issues.append(f"Bang chi co trong SS: {len(only_ss_tables)} ({', '.join(sorted(only_ss_tables))})")
    if only_pg_tables:
        issues.append(f"Bang chi co trong PG: {len(only_pg_tables)} ({', '.join(sorted(only_pg_tables))})")
    if col_missing_pg:
        issues.append(f"Cot thieu trong PG: {len(col_missing_pg)}")
    if col_missing_ss:
        issues.append(f"Cot thieu trong SS: {len(col_missing_ss)}")
    if col_mismatches:
        issues.append(f"Kieu cot khac nhau: {len(col_mismatches)}")
    if pk_diff:
        issues.append(f"PK khac: {pk_diff}")
    if total_fk_ss_only:
        issues.append(f"FK chi trong SS: {total_fk_ss_only}")
    if total_fk_pg_only:
        issues.append(f"FK chi trong PG: {total_fk_pg_only}")
    if total_idx_ss_only:
        issues.append(f"Index chi trong SS: {total_idx_ss_only}")
    if total_idx_pg_only:
        issues.append(f"Index chi trong PG: {total_idx_pg_only}")

    if issues:
        print(f"\n  [WARN] Phat hien {len(issues)} diem khac biet:")
        for iss in issues:
            print(f"    - {iss}")
    else:
        print("\n  [DONE] HAI FILE TUONG THICH HOAN TOAN VE CAU TRUC!")


if __name__ == '__main__':
    main()
