import os
import re

def update_imports(root_dir, rename_map):
    count = 0
    for dirpath, _, filenames in os.walk(root_dir):
        if 'node_modules' in dirpath:
            continue
        if '.git' in dirpath:
            continue
        if '.next' in dirpath:
            continue
            
        for filename in filenames:
            if not filename.endswith(('.ts', '.tsx', '.js', '.jsx')):
                continue
                
            filepath = os.path.join(dirpath, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            
            for old_base, new_base in rename_map.items():
                # Regex for verifying we match the end of the import string
                # We want to match: (quote) (optional path) UseCase (quote)
                # But we just replace the basename.
                # Example: import { X } from './GetArticleBySlugUseCase';
                # Match: GetArticleBySlugUseCase' or "
                
                # Careful: 'MyArticleUseCases' should NOT match 'ArticleUseCase'
                # So we look for /BaseName' or 'BaseName' (if it's just local)
                # Just BaseName' is risky if it's a substring.
                # Usually imports are like '.../Basename'
                
                pattern_slash = re.compile(re.escape('/') + re.escape(old_base) + r"(['\"])")
                replacement_slash = r'/' + new_base + r'\1'
                content = pattern_slash.sub(replacement_slash, content)
                
                # Also handle simple './BaseName' where it starts with ./ or ../ and no preceding slash is matched by the above if we assume / counts
                # Actually ./BaseName has a slash.
                # But what if 'BaseName' (aliases)? e.g. import ... from 'BaseName';
                # Less likely in project files, usually absolute path starts with @/ or relative with ./
                # @/path/BaseName -> has slash.
                
                # So the slash pattern should cover most.
                # pattern = (['"])(.*\/)?OldBase(['"]) -> \1\2NewBase\3
                
            if content != original_content:
                print(f"Updating imports in {filepath}")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                
    print(f"Updated {count} files.")

def load_renames(log_file):
    rename_map = {} # OldBase -> NewBase
    with open(log_file, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 2:
                continue
            old_path, new_path = parts
            
            old_base = os.path.splitext(os.path.basename(old_path))[0]
            new_base = os.path.splitext(os.path.basename(new_path))[0]
            
            if old_base != new_base:
                rename_map[old_base] = new_base
                
    # Sort by length descending to prevent substring replacements (Longer names first)
    # e.g. 'ArticleUseCase' before 'UseCase' matches.
    return dict(sorted(rename_map.items(), key=lambda item: len(item[0]), reverse=True))

def main():
    rename_map = load_renames('scripts/renames.log')
    update_imports('src', rename_map)

if __name__ == "__main__":
    main()
