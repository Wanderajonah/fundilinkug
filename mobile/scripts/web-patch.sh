#!/bin/bash
# Patch the exported index.html to add error overlay
HTML_FILE="dist/web/index.html"

if [ ! -f "$HTML_FILE" ]; then
    echo "Error: $HTML_FILE not found. Run 'npm run web:build' first."
    exit 1
fi

# Insert error overlay before </body>
sed -i 's|</body>|<div id="error-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:#111;color:#ff4444;padding:40px;font-family:monospace;font-size:14px;white-space:pre-wrap;overflow:auto;z-index:99999;"></div><script>(function(){var e=document.getElementById("error-overlay");function n(msg,url,line,col,err){e.style.display="block";var t="["+new Date().toLocaleTimeString()+"] "+msg+"\n";if(url)t+="URL: "+url+"\n";if(line)t+="Line: "+line+":"+col+"\n";if(err&&err.stack)t+=err.stack+"\n";e.textContent+=t+"\n---\n";console.error("Caught:",msg,err)}window.onerror=function(msg,url,line,col,err){n(msg,url,line,col,err);return true};window.addEventListener("unhandledrejection",function(e){n("Promise: "+(e.reason?e.reason.message||e.reason:"unknown"))})})()</script></body>|' "$HTML_FILE"

echo "Patched $HTML_FILE with error overlay"
