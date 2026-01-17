import os
import subprocess

def run_git_mv(old_path, new_path):
    # Create directory if it doesn't exist (unlikely here but good practice)
    os.makedirs(os.path.dirname(new_path), exist_ok=True)
    
    cmd = ["git", "mv", old_path, new_path]
    print(f"Executing: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error renaming {old_path}: {e}")

def main():
    base_dir = "src/infrastructure"
    if not os.path.exists(base_dir):
        print(f"Directory {base_dir} not found.")
        return

    # Files to exclude or handle specially if needed
    # But generally we want to replace all hyphens with dots for logic files.
    # Exclude directories.
    
    for root, dirs, files in os.walk(base_dir):
        for filename in files:
            if not filename.endswith('.ts') and not filename.endswith('.tsx'):
                continue
                
            # Skip if no hyphens
            if '-' not in filename:
                continue

            # Skip index.ts (obvious)
            if filename == 'index.ts':
                continue
            
            # Special case: React components in infrastructure?
            # We found YouTubeAdapter.tsx before. It is PascalCase.
            # If filename is PascalCase (starts with uppercase), we likely skip it?
            # But wait, `YouTubeAdapter.tsx` doesn't have hyphens.
            # If `My-Component.tsx` exists, it should be `MyComponent.tsx`.
            # But here we are assuming files are already technically kebab-case (from previous renames)
            # and we want to dot-separate them.
            
            # Check if it starts with lower case
            if filename[0].islower():
                new_filename = filename.replace("-", ".")
                
                old_full_path = os.path.join(root, filename)
                new_full_path = os.path.join(root, new_filename)
                
                if old_full_path != new_full_path:
                    run_git_mv(old_full_path, new_full_path)

if __name__ == "__main__":
    main()
