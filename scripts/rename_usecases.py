import os
import subprocess

def run_git_mv(old_path, new_path):
    cmd = ["git", "mv", old_path, new_path]
    print(f"Executing: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error renaming {old_path}: {e}")

def main():
    base_dir = "src/application/article/usecase"
    if not os.path.exists(base_dir):
        print(f"Directory {base_dir} not found.")
        return

    for filename in os.listdir(base_dir):
        if filename.endswith(".use-case.ts"):
            new_filename = filename.replace(".use-case.ts", ".usecase.ts")
            old_full_path = os.path.join(base_dir, filename)
            new_full_path = os.path.join(base_dir, new_filename)
            run_git_mv(old_full_path, new_full_path)

if __name__ == "__main__":
    main()
