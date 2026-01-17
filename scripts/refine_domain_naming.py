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
    base_dir = "src/domain"
    if not os.path.exists(base_dir):
        print(f"Directory {base_dir} not found.")
        return

    # Walk through the domain directory
    # structure: src/domain/[domain_name]/[files]
    
    domains = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    
    count = 0
    
    for domain in domains:
        domain_path = os.path.join(base_dir, domain)
        files = os.listdir(domain_path)
        
        for filename in files:
            # Check if file starts with "domain-"
            prefix = f"{domain}-"
            
            if filename.startswith(prefix) or filename.startswith(f"{domain}."):
                # Ensure we capture files renamed in previous step if we run multiple times?
                # Actually, if I run again on `work.part-metadata.ts`. Prefix `work-`? No.
                # Prefix `work.`.
                # So I should check if it starts with domain.
                
                # Let's just reset strategy:
                # If filename starts with domain (either `domain-` or `domain.`),
                # Replace ALL hyphens with dots.
                
                if filename.startswith(f"{domain}-") or filename.startswith(f"{domain}."):
                    new_filename = filename.replace("-", ".")
                    
                    old_full_path = os.path.join(domain_path, filename)
                    new_full_path = os.path.join(domain_path, new_filename)
                    
                    if old_full_path != new_full_path:
                        run_git_mv(old_full_path, new_full_path)
                        count += 1
                    
    print(f"Renamed {count} files.")

if __name__ == "__main__":
    main()
