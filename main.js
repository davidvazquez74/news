document.addEventListener("DOMContentLoaded",()=>{
  const pills = document.querySelectorAll('.nb-pills .pill');
  pills.forEach(p=>{
    p.addEventListener('click',()=>{
      pills.forEach(x=>x.classList.remove('active'));
      p.classList.add('active');
    });
  });
  document.getElementById('btnClearCache').onclick=()=>{ caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))); location.reload(); };
  document.getElementById('btnForceApp').onclick=()=>location.reload(true);
});