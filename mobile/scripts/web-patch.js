const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "dist", "web", "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

const overlay = `<div id="error-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:#111;color:#ff4444;padding:40px;font-family:monospace;font-size:14px;white-space:pre-wrap;overflow:auto;z-index:99999;"></div>
<script>
(function(){
  var e=document.getElementById('error-overlay');
  function n(msg,url,line,col,err){
    e.style.display='block';
    var t='['+new Date().toLocaleTimeString()+'] '+msg+'\\n';
    if(url) t+='URL: '+url+'\\n';
    if(line) t+='Line: '+line+':'+col+'\\n';
    if(err&&err.stack) t+=err.stack+'\\n';
    e.textContent+=t+'\\n---\\n';
    console.error('Caught:',msg,err);
  }
  window.onerror=function(msg,url,line,col,err){ n(msg,url,line,col,err); return true; };
  window.addEventListener('unhandledrejection',function(e){ n('Promise: '+(e.reason?e.reason.message||e.reason:'unknown')); });
})();
</script>`;

html = html.replace("</body>", overlay + "</body>");
fs.writeFileSync(htmlPath, html);
console.log("Patched index.html with error overlay");
