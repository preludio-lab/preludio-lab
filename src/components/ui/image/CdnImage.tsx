import Image, { ImageProps } from 'next/image';
import cloudflareImageLoader from '@/infrastructure/storage/cloudflare.image.loader';

/**
 * CdnImage用のプロパティ。
 * Next.js標準のImagePropsを継承しつつ、srcは文字列のみを受け付けるよう強制します。
 * （静的インポートオブジェクト等の利用を防ぎ、純粋なS3/R2オブジェクトキーの利用を意図します）
 */
export interface CdnImageProps extends Omit<ImageProps, 'src' | 'loader' | 'unoptimized'> {
  /**
   * CDNに配置された画像の相対パス、または外部URL。
   * 例: "articles/hero.webp"
   */
  src: string;
}

/**
 * Cloudflare CDN (R2) から配信される画像専用のラッパーコンポーネント。
 * Next.js標準の `<Image>` に対してCDN専用のカスタムローダーを適用し、
 * Vercelの画像最適化コストを回避しつつ、Cloudflare側での `-sm` 等の最適化を活用します。
 *
 * システムUIアセット (例: public/画像のローカル配信) にはこのコンポーネントを使用せず、
 * 標準の `<Image>` コンポーネントを使用してください。
 */
export function CdnImage({ src, alt, ...props }: CdnImageProps) {
  return <Image src={src} alt={alt} loader={cloudflareImageLoader} {...props} />;
}
