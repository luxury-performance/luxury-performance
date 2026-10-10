// Play on each full page load; client-side navigation keeps the existing layout.
// Progressive enhancement: never hide the website when scripting is unavailable.
export const introBootstrap = `(function(){try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.lxpIntro='tracing';setTimeout(function(){delete document.documentElement.dataset.lxpIntro},5000)}}catch(e){}})()`;
