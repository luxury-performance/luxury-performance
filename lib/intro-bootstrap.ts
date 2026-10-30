// Play the full entrance once per tab session. Later visits can paint immediately.
// Progressive enhancement: unavailable storage or scripting leaves the site visible.
export const introBootstrap = `(function(){try{
  var root=document.documentElement;
  var key='lxp:intro-played:v1';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){history.scrollRestoration='auto';return;}
  if(sessionStorage.getItem(key)==='1'){history.scrollRestoration='auto';return;}
  sessionStorage.setItem(key,'1');
  var nav=performance.getEntriesByType('navigation')[0];
  if(nav&&nav.type==='reload'){
    root.dataset.lxpReload='true';
    history.scrollRestoration='manual';
    if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
    scrollTo({top:0,left:0,behavior:'instant'});
    addEventListener('pageshow',function(){scrollTo({top:0,left:0,behavior:'instant'});},{once:true});
  }
  root.dataset.lxpIntro='tracing';
  setTimeout(function(){
    delete root.dataset.lxpIntro;
    if(root.dataset.lxpReload==='true'){delete root.dataset.lxpReload;history.scrollRestoration='auto';}
  },5000);
}catch(e){
  if(document.documentElement.dataset.lxpReload==='true')history.scrollRestoration='auto';
  delete document.documentElement.dataset.lxpIntro;delete document.documentElement.dataset.lxpReload;
}})()`;
