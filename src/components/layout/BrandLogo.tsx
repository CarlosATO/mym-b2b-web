import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const SIZES = { sm: 32, md: 40, lg: 56 };

export default function BrandLogo({ size = 'md', showText = true, variant = 'dark' }: BrandLogoProps) {
  const px = SIZES[size];
  const textColor = variant === 'dark' ? 'text-slate-900' : 'text-white';
  const subColor = variant === 'dark' ? 'text-slate-500' : 'text-slate-300';

  return (
    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
      <Image
        src="/assets/brand/logo.png"
        alt="MYM Distribuidora"
        width={px}
        height={px}
        className="object-contain"
        priority
      />
      {showText && (
        <div className="hidden sm:block">
          <div className={`font-bold text-sm leading-tight ${textColor}`}>
            MYM Distribuidora
          </div>
          <div className={`text-xs leading-tight ${subColor}`}>
            Portal B2B Mayorista
          </div>
        </div>
      )}
    </Link>
  );
}
