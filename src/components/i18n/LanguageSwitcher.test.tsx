import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// next-intl のフックをモック
const mockRouter = { replace: vi.fn() };
const mockPathname = '/mock-path';

vi.mock('@/shared/i18n/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en', // デフォルトは 'en'
}));

// useTransition のモック
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, (cb: () => void) => cb()],
  };
});

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('現在の言語（英語）が表示されること', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('クリックするとドロップダウンが開くこと', () => {
    render(<LanguageSwitcher />);

    // 最初はドロップダウンがないことを確認（または非表示）
    // 注: 実装条件によっては role="listbox" がレンダリングされていないか確認
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // ボタンをクリック
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    // ドロップダウン（role="listbox"）が表示されること
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('言語を選択すると router.replace が呼ばれること', () => {
    render(<LanguageSwitcher />);

    // ドロップダウンを開く
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    // 日本語を選択
    fireEvent.click(screen.getByText('日本語'));

    // router.replace が呼ばれたことを検証
    expect(mockRouter.replace).toHaveBeenCalledWith(mockPathname, { locale: 'ja' });
  });
});
