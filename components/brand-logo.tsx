import Image from 'next/image';

/** Original wing emblem with the approved Montserrat company wordmark. */
export function BrandLogo({ priority = false, wordmark = true }: { priority?: boolean; wordmark?: boolean }) {
  return <span className="company-logo">
    <Image className="company-emblem" src="/brand/emblem.png" alt="" width={896} height={325} sizes="180px" priority={priority} />
    {wordmark && <span className="company-wordmark">Luxury Performance</span>}
  </span>;
}
