import { LazyMotion, domAnimation } from 'framer-motion';

export function LazyMotionConfig({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
