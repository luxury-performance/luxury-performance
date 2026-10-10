import Image from 'next/image';

/** Original wing emblem with the approved Montserrat company wordmark. */
export function BrandLogo({ priority = false, wordmark = true }: { priority?: boolean; wordmark?: boolean }) {
  return <span className="company-logo">
    <Image className="company-emblem" src="/brand/lxp-logo-white.png" alt="" width={2172} height={724} sizes="180px" priority={priority} />
    {wordmark && <span className="company-wordmark">Luxury Performance</span>}
  </span>;
}
