import { ArrowLink, Eyebrow } from './ui';
export function Closing({ title = 'Your car.\nYour expression.' }: { title?: string }) {
  return <section className="closing section-pad"><div className="closing-pattern" aria-hidden="true" /><Eyebrow dark>Let’s create something exceptional</Eyebrow><h2>{title.split('\n').map((line, index) => <span key={line} className={index === 1 ? 'muted-line' : ''}>{line}<br /></span>)}</h2><ArrowLink href="/contact" light>Start a conversation</ArrowLink><span className="closing-coordinate">25°07′ N &nbsp; 55°13′ E<br />DUBAI, UNITED ARAB EMIRATES</span></section>;
}
