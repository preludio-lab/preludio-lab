import fs from 'fs';
import path from 'path';
import { cliLogger } from '../src/infrastructure/logging/cli.logger';

const logger = cliLogger;

/**
 * .zap/zap-rules.conf のバリデーション
 * 1. Alert ID, Action, Description がタブ(\t)で区切られていること
 * 2. 各行が正しいフォーマットであること
 */
const validateZapRules = () => {
  const filePath = path.join(process.cwd(), '.zap/zap-rules.conf');

  if (!fs.existsSync(filePath)) {
    logger.info('ZAP rules file not found. Skipping validation.', {
      file: '.zap/zap-rules.conf',
      event: 'validation_skipped',
    });
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
      logger.error(
        'ZAP rules validation failed: Line must be tab-separated. Spaces are not allowed.',
        undefined,
        {
          file: '.zap/zap-rules.conf',
          lineIndex: index + 1,
          lineContent: line,
        },
      );
      hasError = true;
      return; // この行の以降のチェックはスキップ
    }

    const parts = line.split('\t');
    if (parts.length < 2) {
      logger.error(
        'ZAP rules validation failed: Each rule must have at least an Alert ID and an Action.',
        undefined,
        {
          file: '.zap/zap-rules.conf',
          lineIndex: index + 1,
          lineContent: line,
        },
      );
      hasError = true;
    }

    const [alertId, action] = parts;
    if (!/^\d+$/.test(alertId)) {
      logger.error(
        `ZAP rules validation failed: Invalid Alert ID "${alertId}". It must be numeric.`,
        undefined,
        {
          file: '.zap/zap-rules.conf',
          lineIndex: index + 1,
          lineContent: line,
          alertId,
        },
      );
      hasError = true;
    }

    const validActions = ['IGNORE', 'INFO', 'WARN', 'FAIL'];
    if (action && !validActions.includes(action)) {
      logger.error(`ZAP rules validation failed: Invalid Action "${action}".`, undefined, {
        file: '.zap/zap-rules.conf',
        lineIndex: index + 1,
        lineContent: line,
        action,
        validActions,
      });
      hasError = true;
    }
  });

  if (hasError) {
    logger.error(
      'ZAP rules validation failed. Please fix the formatting errors above.',
      undefined,
      {
        event: 'validation_failed',
      },
    );
    process.exit(1);
  } else {
    logger.info('ZAP rules validation successful.', {
      file: '.zap/zap-rules.conf',
      event: 'validation_success',
    });
  }
};

validateZapRules();
