---
description: Initialize PreludioLab Project (Next.js, Tailwind, ESLint, Prettier)
---

// turbo-all

1.  **Initialize Next.js App**
    Create the Next.js app in the `src` directory (or moved later). Since we have a root structure, we should be careful.
    The handbook says `src/app` structure.
    Command: `npx -y create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git`
    (Using `.` to install in current dir, but we have existing files. `create-next-app` might complain if directory is not empty. We might need to force or verify. Actually, `create-next-app` fails if non-empty. We might need to install in a temp dir and move, or just ignore the error if it allows merging? No, it usually strictly requires empty.)

    _Correction:_ The current directory has `docs`, `.agent` etc. `create-next-app` will likely fail.
    Strategy: Create in `temp-app` and move contents.

    ```bash
    npx -y create-next-app@latest temp-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git
    cp -r temp-app/* .
    cp -r temp-app/.* .
    rm -rf temp-app
    ```

2.  **Install Additional Dependencies**
    Install Prettier and plugins.

    ```bash
    npm install --save-dev prettier eslint-config-prettier
    ```

3.  **Configure Prettier**
    Create `.prettierrc`.

    ```bash
    echo '{ "semi": true, "singleQuote": true, "tabWidth": 2, "printWidth": 100 }' > .prettierrc
    ```

4.  **Create Branch & Commit**
    ```bash
    git checkout -b feat/setup-project
    git add .
    git commit -m "chore: 初期プロジェクトセットアップ (Next.js, Tailwind, ESLint)"
    ```
