#!/usr/bin/env python3
import sys, re, os
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

def read_file(path, enc='utf-8'):
    try:
        with open(path, 'r', encoding=enc, errors='replace') as f:
            return f.read()
    except Exception as e:
        return ''

react = read_file(r'Backend\src\main\java\com\rexi\pkty\service\ReActAgentService.java', 'utf-16')
groq  = read_file(r'Backend\src\main\java\com\rexi\pkty\service\GroqService.java')
mem   = read_file(r'Backend\src\main\java\com\rexi\pkty\service\AiMemoryService.java')
openrouter = read_file(r'Backend\src\main\java\com\rexi\pkty\service\OpenRouterService.java')

print('=== [1] ReActAgentService ===')
print('Lines:', react.count('\n'))
print('Has deterministic method:', 'private ReActResult handleDeterministicClinicAgentQuery' in react)
print('Has deterministicVetResult:', 'deterministicVetResult' in react)
m = react.find('private ModelResponse callBestAvailableModel')
sub = react[m:m+800]
g_pos = sub.find('groqService.chat')
gem_pos = sub.find('geminiService.chat')
op_pos = sub.find('openRouterService.chat')
print(f'Provider order: Groq={g_pos} Gemini={gem_pos} OpenRouter={op_pos}')
print('Groq is FIRST:', 0 < g_pos < gem_pos < op_pos)
mi = re.search(r'MAX_ITERATIONS\s*=\s*(\d+)', react)
print('MAX_ITERATIONS:', mi.group(1) if mi else 'N/A')
print('containsAny calls:', len(re.findall(r'containsAny\(', react)))

print()
print('=== [2] GroqService timeouts & tokens ===')
timeouts = re.findall(r'Duration\.ofSeconds\((\d+)\)', groq)
print('Timeouts (sec):', timeouts)
# max_tokens
mt_matches = re.findall(r'max_tokens.*?(\d+)', groq)
print('max_tokens occurrences:', mt_matches[:6])
# temperature
temp_matches = re.findall(r'temperature.*?([\d.]+)', groq)
print('temperature values:', temp_matches[:4])

print()
print('=== [3] OpenRouterService timeouts ===')
or_timeouts = re.findall(r'Duration\.ofSeconds\((\d+)\)', openrouter)
or_timeouts2 = re.findall(r'timeout.*?(\d+)', openrouter)
print('OpenRouter timeouts (sec):', or_timeouts)
print('OpenRouter timeout refs:', or_timeouts2[:5])

print()
print('=== [4] AiMemoryService constants ===')
kmc = re.search(r'KNOWLEDGE_MAX_CONTEXT_CHARS\s*=\s*(\d+)', mem)
ksr = re.search(r'KNOWLEDGE_SNIPPET_RADIUS\s*=\s*(\d+)', mem)
kct = re.search(r'KNOWLEDGE_CACHE_TTL_MS\s*=\s*([\d_]+)', mem)
print('KNOWLEDGE_MAX_CONTEXT_CHARS:', kmc.group(1) if kmc else 'N/A')
print('KNOWLEDGE_SNIPPET_RADIUS:', ksr.group(1) if ksr else 'N/A')
print('KNOWLEDGE_CACHE_TTL_MS:', kct.group(1) if kct else 'N/A')

# getGlobalContext smart router
gc = mem.find('public String getGlobalContext')
if gc >= 0:
    gc_block = mem[gc:gc+900]
    print()
    print('=== [5] getGlobalContext Smart Router keywords ===')
    # Tim cac keyword check
    kws = re.findall(r'contains\("([^"]+)"\)', gc_block)
    print('Keywords checked:', kws)

# System prompt length
sp = react.find('SITEMAP')
if sp >= 0:
    sp_end = react.find('+ \"\\n\";', sp)
    if sp_end < 0:
        sp_end = sp + 3000
    sitemap_block = react[sp:sp_end]
    print()
    print('=== [6] SITEMAP in system prompt ===')
    routes = re.findall(r'- /', sitemap_block)
    print(f'Routes count: {len(routes)}')
    print(f'SITEMAP block size: {len(sitemap_block)} chars')

# Check buildSystemPrompt total estimated size
sp_start = react.find('private String buildSystemPrompt(')
sp_end2 = react.find('\n    private ', sp_start + 100) if sp_start >= 0 else -1
if sp_start >= 0 and sp_end2 > sp_start:
    sp_method = react[sp_start:sp_end2]
    print()
    print(f'=== [7] buildSystemPrompt method size: {len(sp_method)} chars ===')
    # Estimate actual prompt size (string literals)
    literals = re.findall(r'"([^"]*)"', sp_method)
    literal_total = sum(len(l) for l in literals)
    print(f'String literal total in prompt builder: ~{literal_total} chars')
