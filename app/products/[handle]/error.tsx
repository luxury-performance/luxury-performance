'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="shop-page shop-loading"><h1>Let’s try that again.</h1><p>The collection couldn’t load. Your cart is safe.</p><button className="shop-button" onClick={reset}>Reload collection</button></div>;}
