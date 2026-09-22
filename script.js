(function(){
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader=$('.loader');

  function ready(){
    document.body.classList.remove('is-loading');
    if(loader){
      const bar=loader.querySelector('.loader-bar span');
      if(bar) bar.style.width='100%';
      loader.style.transition='opacity .7s ease';
      loader.style.opacity='0';
      setTimeout(()=>loader.remove(),750);
    }
  }
  window.addEventListener('load',()=>setTimeout(ready,450));
  setTimeout(()=>{ if(document.body.classList.contains('is-loading')) ready(); },3000);
  $$('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());

  const menu=$('.menu'), navlinks=$('.navlinks');
  if(menu) menu.addEventListener('click',()=>{
    navlinks.classList.toggle('open');
    navlinks.style.display=navlinks.classList.contains('open')?'grid':'';
    navlinks.style.position='absolute'; navlinks.style.top='65px'; navlinks.style.right='10px';
    navlinks.style.padding='18px 22px'; navlinks.style.background='rgba(251,248,241,.96)';
    navlinks.style.borderRadius='20px'; navlinks.style.boxShadow='0 20px 50px rgba(0,0,0,.12)';
  });

  /*
    BULLETPROOF HORIZONTAL JOURNEY
    --------------------------------
    This is intentionally driven by native page scroll instead of relying on
    GSAP's pin calculation. That makes the sideways section work even when
    the page is opened locally or a CDN script is delayed/blocked.
  */
  const horiz=$('.horizontal'), pin=$('.horizontal-pin'), rail=$('.horizontal-rail'), progress=$('.rail-progress span');
  let hDistance=0, ticking=false;

  function setupHorizontal(){
    if(!horiz || !pin || !rail) return;
    // Reset transform before measuring the real rail width.
    rail.style.transform='translate3d(0,0,0)';
    const viewport=window.innerWidth;
    hDistance=Math.max(0, rail.scrollWidth-viewport);
    // Vertical travel = exactly the amount needed to move the full rail sideways.
    horiz.style.height=Math.max(window.innerHeight+hDistance, window.innerHeight*2.15)+'px';
    updateHorizontal();
  }

  function updateHorizontal(){
    if(!horiz || !pin || !rail) return;
    const rect=horiz.getBoundingClientRect();
    const total=Math.max(1, horiz.offsetHeight-window.innerHeight);
    const p=Math.min(1,Math.max(0,-rect.top/total));
    const eased=p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
    const x=-hDistance*eased;
    rail.style.transform=`translate3d(${x}px,0,0)`;
    if(progress) progress.style.transform=`scaleX(${p})`;
    $$('.h-card',rail).forEach(card=>{
      const r=card.getBoundingClientRect();
      const center=r.left+r.width/2;
      const delta=Math.abs(center-window.innerWidth/2)/(window.innerWidth*.85);
      const focus=Math.max(0,1-Math.min(1,delta));
      card.style.setProperty('--focus',focus.toFixed(3));
    });
    ticking=false;
  }

  function requestHorizontal(){
    if(ticking) return;
    ticking=true; requestAnimationFrame(updateHorizontal);
  }

  if(horiz && rail){
    window.addEventListener('load',setupHorizontal,{once:true});
    window.addEventListener('resize',setupHorizontal);
    window.addEventListener('scroll',requestHorizontal,{passive:true});
    // Run immediately for cached/local images, then again after layout settles.
    setupHorizontal();
    setTimeout(setupHorizontal,250);
    setTimeout(setupHorizontal,1000);
  }

  if(reduce){
    $$('.reveal').forEach(e=>{e.style.opacity=1;e.style.transform='none'});
    $$('.clip-reveal>*').forEach(e=>e.style.transform='none');
    if(rail){rail.style.transform='none'; horiz.style.height='auto';}
    return;
  }

  // GSAP enhances the rest of the page, but the horizontal journey above does not depend on it.
  if(window.gsap){
    if(window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const introTl=gsap.timeline({defaults:{ease:'power3.out'}});
    introTl.from('.hero .eyebrow',{y:20,opacity:0,duration:.7})
      .from('.hero h1',{y:80,opacity:0,duration:1.15},'-=.4')
      .from('.hero-lede',{y:30,opacity:0,duration:.8},'-=.65')
      .from('.hero-actions',{y:20,opacity:0,duration:.6},'-=.5');

    if(window.ScrollTrigger){
      gsap.to('.hero-media img',{yPercent:14,scale:1.08,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.2}});
      gsap.to('.hero-content',{yPercent:18,opacity:.2,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.2}});
      $$('.reveal').forEach(el=>gsap.to(el,{y:0,opacity:1,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 86%',once:true}}));
      $$('.clip-reveal').forEach(el=>gsap.to($('>*',el),{y:'0%',duration:1.05,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 82%',once:true}}));
      $$('.image-tile img,.studio-image img,.project-card img').forEach(img=>gsap.to(img,{yPercent:-7,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:1.2}}));
      const manifest=$('.manifesto');
      if(manifest) gsap.fromTo(manifest,{clipPath:'inset(18% 0 18% 0)'},{clipPath:'inset(0% 0 0% 0)',duration:1.1,ease:'power3.inOut',scrollTrigger:{trigger:manifest,start:'top 80%',end:'top 35%',scrub:1}});
      const header=$('.site-header');
      if(header) ScrollTrigger.create({start:80,onUpdate:self=>{header.style.transform=self.direction===1?'translateY(-2px)':'translateY(0)';header.style.transition='transform .4s'}});
    } else {
      $$('.reveal').forEach(e=>{e.style.opacity=1;e.style.transform='none'});
      $$('.clip-reveal>*').forEach(e=>e.style.transform='none');
    }

    // Magnetic buttons.
    $$('.btn,.float-wa').forEach(btn=>{
      btn.addEventListener('mousemove',e=>{const r=btn.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*.16,y=(e.clientY-r.top-r.height/2)*.16;gsap.to(btn,{x,y,duration:.35,ease:'power2.out'});});
      btn.addEventListener('mouseleave',()=>gsap.to(btn,{x:0,y:0,duration:.5,ease:'elastic.out(1,.5)'}));
    });

    const cursor=$('.cursor');
    if(cursor){
      window.addEventListener('mousemove',e=>gsap.to(cursor,{x:e.clientX,y:e.clientY,duration:.18,ease:'power2.out'}));
      $$('a,button,.project-card,.h-card').forEach(el=>{
        el.addEventListener('mouseenter',()=>cursor.classList.add('active'));
        el.addEventListener('mouseleave',()=>cursor.classList.remove('active'));
      });
    }
  } else {
    // CDN-independent fallback for reveal animations.
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}
    }),{threshold:.12});
    $$('.reveal,.clip-reveal').forEach(el=>io.observe(el));
  }

  const form=$('#contact-form');
  if(form) form.addEventListener('submit',e=>{
    e.preventDefault(); const d=new FormData(form);
    const subject=encodeURIComponent('New Bold Clay Studios enquiry');
    const body=encodeURIComponent(`Name: ${d.get('name')}\nEmail: ${d.get('email')}\nProject: ${d.get('project')}\nMessage: ${d.get('message')}`);
    window.location.href=`mailto:Studio.boldclay@gmail.com?subject=${subject}&body=${body}`;
  });
})();
