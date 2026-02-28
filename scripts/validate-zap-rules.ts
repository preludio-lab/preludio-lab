import fs from 'fs';
import path from 'path';

/**
 * .zap/zap-rules.conf のバリデーション
 * 1. Alert ID, Action, Description がタブ(\t)で区切られていること
 * 2. 各行が正しいフォーマットであること
 */
const validateZapRules = () => {
  const filePath = path.join(process.cwd(), '.zap/zap-rules.conf');

  if (!fs.existsSync(filePath)) {
    console.log('[INFO] .zap/zap-rules.conf not found. Skipping validation.');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let hasError = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // 空行またはコメント行はスキップ
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    // タブ文字が含まれているか確認
    if (!line.includes('\t')) {
      console.error(
        `[ERROR] Line ${index + 1}: Line must be tab-separated. Spaces are not allowed as delimiters.\n        Line content: "${line}"`,
      );
      hasError = true;
      return;
    }

    const parts = line.split('\t');
    if (parts.length < 2) {
      console.error(
        `[ERROR] Line ${index + 1}: Each rule must have at least an Alert ID and an Action.\n        Line content: "${line}"`,
      );
      hasError = true;
    }

    const [alertId, action] = parts;
    if (!/^\d+$/.test(alertId)) {
      console.error(
        `[ERROR] Line ${index + 1}: Invalid Alert ID "${alertId}". It must be numeric.`,
      );
      hasError = true;
    }

    const validActions = ['IGNORE', 'INFO', 'WARN', 'FAIL'];
    if (!validActions.includes(action)) {
      console.error(
        `[ERROR] Line ${index + 1}: Invalid Action "${action}". Must be one of: ${validActions.join(', ')}`,
      );
      hasError = true;
    }
  });

  if (hasError) {
    console.error('\n[FAILED] ZAP rules validation failed. Please use tabs for delimiters.');
    process.exit(1);
  } else {
    console.log('[SUCCESS] .zap/zap-rules.conf is valid.');
  }
};

validateZapRules();
