import os
import re
import subprocess

def camel_to_kebab(name):
    # Handle consecutive uppercase letters (e.g. JSONParser -> json-parser)
    # 1. Replace Uppercase followed by lowercase with -UppercaseLowercase
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    # 2. Replace lowercase/number followed by Uppercase with -Uppercase
    s2 = re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1)
    return s2.lower()

def rename_logic_file(filename):
    name, ext = os.path.splitext(filename)
    
    # Stricter list of roles to become dot-separated
    # These represent architectural patterns, not domain concepts.
    roles = [
        'Repository', 'UseCase', 'Dto', 'Service', 'Controller', 'Presenter', 
        'Adapter', 'Mapper', 'Display', 'Control', 'Constants', 'Client', 'Parser', 'Renderer',
        'DataSource', 'Provider', 'Factory', 'Strategy', 'Observer'
    ]
    
    # Check if any role is at the end of the name
    found_role = None
    name_without_role = name
    
    for role in roles:
        if name.endswith(role):
            # If the name is exactly the role, specific handling? 
            # e.g. "Repository.ts" -> "repository.ts"
            if name == role:
                continue
                
            found_role = role
            name_without_role = name[:-len(role)]
            break
    
    if found_role:
        base = camel_to_kebab(name_without_role)
        suffix = camel_to_kebab(found_role)
        # Verify base ends with '-'? No, camel_to_kebab handles it.
        # But wait, if name is "ArticleRepository", name_without_role is "Article".
        # camel_to_kebab("Article") -> "article".
        # suffix -> "repository".
        # Result -> "article.repository.ts"
        new_name = f"{base}.{suffix}{ext}"
    else:
        new_name = f"{camel_to_kebab(name)}{ext}"
        
    return new_name

def process_directory(root_dir):
    files_to_rename = []
    
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if not filename.endswith(('.ts', '.tsx')): 
                continue
            
            # Skip index.ts
            if filename.startswith('index.'):
                continue
            # Skip d.ts
            if filename.endswith('.d.ts'):
                continue
            # Skip Next.js special files (though we are checking logic dirs)
            if filename in ['page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx', 'route.ts']:
                continue

            new_filename = rename_logic_file(filename)
            
            if filename != new_filename:
                old_path = os.path.join(dirpath, filename)
                new_path = os.path.join(dirpath, new_filename)
                files_to_rename.append((old_path, new_path))
                
    return files_to_rename

def main():
    target_dirs = [
        'src/domain',
        'src/application',
        'src/infrastructure',
        'src/lib'
    ]
    
    all_renames = []
    for d in target_dirs:
        if os.path.exists(d):
            all_renames.extend(process_directory(d))
            
    print(f"Found {len(all_renames)} files to rename.")
    
    for old, new in all_renames:
        # Check if destination exists (case insensitive collision check for safety)
        if os.path.exists(new) and old.lower() != new.lower():
            print(f"Skipping {old} -> {new}: Destination exists.")
            continue
            
        cmd = ["git", "mv", old, new]
        print(f"Executing: {' '.join(cmd)}")
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error renaming {old}: {e}")

if __name__ == "__main__":
    main()
