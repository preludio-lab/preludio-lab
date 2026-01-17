import os
import re

# --- Naming Logic (Copied/Adapted) ---

def camel_to_kebab(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    s2 = re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1)
    return s2.lower()

def to_pascal_case(kebab_name):
    parts = re.split(r'[-_]', kebab_name)
    return ''.join(word.capitalize() for word in parts if word)

def predict_logic_filename(name):
    roles = [
        'Repository', 'UseCase', 'Dto', 'Service', 'Controller', 'Presenter', 
        'Adapter', 'Mapper', 'Display', 'Control', 'Constants', 'Client', 'Parser', 'Renderer',
        'DataSource', 'Provider', 'Factory', 'Strategy', 'Observer',
        'Metadata', 'Context', 'Content', 'Engagement', 'Status', 'Source', 'Segment', 'Shared'
    ]
    
    found_role = None
    name_without_role = name
    
    # Normalize name to hyphenated to check for role suffixes if they are hyphenated
    # But usually imports match the file name. 
    # If import is "./composer-metadata", name is "composer-metadata".
    
    for role in roles:
        # Check PascalCase end
        if name.endswith(role):
            if name == role: continue
            found_role = role
            name_without_role = name[:-len(role)]
            break
        # Check kebab-case end
        kebab_role = camel_to_kebab(role)
        if name.endswith('-' + kebab_role):
             found_role = role
             name_without_role = name[:-len(kebab_role)-1] # remove hyphen too
             break
        elif name.endswith(kebab_role): # case where it might not have hyphen?
             if name == kebab_role: continue
             found_role = role
             name_without_role = name[:-len(kebab_role)]
             break
            
    if found_role:
        base = camel_to_kebab(name_without_role)
        suffix = camel_to_kebab(found_role)
        # remove trailing hyphen from base if any (from naive slice)
        if base.endswith('-'): base = base[:-1]
        return f"{base}.{suffix}"
    else:
        return camel_to_kebab(name)

def predict_ui_filename(name):
    parts = re.split(r'[-_]', name)
    pascal = ''.join(p[:1].upper() + p[1:] for p in parts if p)
    return pascal

# --- Strict Existence Check ---

def strict_file_exists(path):
    """
    Check if file exists matching EXACT casing.
    """
    dirname = os.path.dirname(path)
    basename = os.path.basename(path)
    
    if not os.path.exists(dirname):
        return False
        
    try:
        files = os.listdir(dirname)
        return basename in files
    except OSError:
        return False

def file_exists_with_ext(path_no_ext):
    # Check extensions
    for ext in ['.ts', '.tsx', '.js', '.jsx', '.d.ts']:
        full_path = path_no_ext + ext
        if strict_file_exists(full_path):
            return True, full_path
            
    # Check directory (index.ts)
    if strict_file_exists(path_no_ext) and os.path.isdir(path_no_ext):
        # check index inside
        if strict_file_exists(os.path.join(path_no_ext, 'index.ts')) or \
           strict_file_exists(os.path.join(path_no_ext, 'index.tsx')):
             return True, path_no_ext
             
    return False, None

def resolve_path(base_dir, import_path):
    if import_path.startswith('@/'):
        rel = import_path[2:]
        return os.path.abspath(os.path.join(os.getcwd(), 'src', rel))
    elif import_path.startswith('.'):
        return os.path.abspath(os.path.join(base_dir, import_path))
    else:
        return None

def check_and_fix_import(import_path, file_dir_path):
    resolved_path = resolve_path(file_dir_path, import_path)
    if not resolved_path:
        return None 
        
    # 1. Check if it works as is (STRICT)
    exists, _ = file_exists_with_ext(resolved_path)
    if exists:
        return None # Valid
        
    # 2. It's invalid (either missing or wrong case). 
    # Try to find the file by trying predictions OR casing fix.
    
    basename = os.path.basename(resolved_path)
    dirname = os.path.dirname(resolved_path)
    
    candidates = []
    
    # Candidate A: Same name, just find actual case in directory if exists
    if os.path.exists(dirname):
        try:
            files = os.listdir(dirname)
            # Check if any file matches case-insensitively
            for f in files:
                f_name, f_ext = os.path.splitext(f)
                if f_name.lower() == basename.lower():
                     # Match found! Use this name.
                     candidates.append(f_name)
        except OSError:
            pass
            
    # Candidate B: Logic Rename
    candidates.append(predict_logic_filename(basename))
    
    # Candidate C: UI Rename
    candidates.append(predict_ui_filename(basename))
    
    # Candidate D: Hyphen to Dot replacement (domain naming convention)
    # Check if basename has hyphens
    if '-' in basename:
        dot_name = basename.replace('-', '.')
        candidates.append(dot_name)

    # Candidate E: Dot to Hyphen replacement (for work-part reversion)
    if '.' in basename:
        # naive replacement of all dots? No.
        # work.part.repository -> work-part.repository.
        # Only replace dots that are NOT separators for role?
        # But we don't know which dot is role separator easily without role analysis.
        # But `predict_logic_filename` handles roles.
        # Let's just try replacing dots with hyphens for the base part?
        
        # If I just replace all dots with hyphens?
        # work.part.repository -> work-part-repository.
        # But new name is work-part.repository.ts.
        # So we want to replace `work.part` with `work-part`.
        
        parts = basename.split('.')
        if len(parts) > 1:
             # Try combinations?
             # Just try replacing the first dot?
             hyphen_name = basename.replace('.', '-', 1)
             candidates.append(hyphen_name)
             
             # Try replacing all dots?
             all_hyphen = basename.replace('.', '-')
             candidates.append(all_hyphen)
             
             # Try replacing internal dots but keep role separator? 
             # If last part is role.
             pass

    for cand in candidates:
        candidate_path = os.path.join(dirname, cand)
        exists_cand, _ = file_exists_with_ext(candidate_path)
        if exists_cand:
            # Construct new import path using 'cand'
            if import_path.startswith('@/'):
                return f"@/{os.path.relpath(candidate_path, os.path.join(os.getcwd(), 'src'))}"
            else:
                rel = os.path.relpath(candidate_path, file_dir_path)
                if not rel.startswith('.'):
                    rel = './' + rel
                return rel

    return None

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original_content = content
    
    def replacer(match):
        full_match = match.group(0)
        prefix = match.group(1)
        quote = match.group(2)
        path = match.group(3)
        
        fixed = check_and_fix_import(path, os.path.dirname(filepath))
        if fixed:
            return f"{prefix}{quote}{fixed}{quote}"
        return full_match

    pattern = re.compile(r'(from\s*|import\s*|import\(\s*)([\'"])([^\'"]+)([\'"])')
    new_content = pattern.sub(replacer, content)
    
    if new_content != original_content:
        print(f"Fixed imports in {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    roots = ['src', 'scripts'] 
    
    count = 0
    if not os.path.exists('src'):
        print("Must run from project root")
        return

    for r in roots:
        if not os.path.exists(r): continue
        for dirpath, _, filenames in os.walk(r):
            if 'node_modules' in dirpath: continue
            
            for filename in filenames:
                if filename.endswith(('.ts', '.tsx', '.js', '.jsx')):
                    if process_file(os.path.join(dirpath, filename)):
                        count += 1
                    
    print(f"Finished. Fixed files: {count}")

if __name__ == "__main__":
    main()
