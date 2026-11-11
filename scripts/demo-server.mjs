import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve, dirname} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const allowed=new Set([
  "/demo/index.html","/demo/main.js","/demo/theme.css",
  "/demo/demo-data.mjs","/demo/marketplace.html","/demo/marketplace.mjs",
  "/demo/arena.html","/demo/arena.mjs","/demo/booking-model.mjs",
  "/demo/onboard.html","/demo/onboard.mjs",
  "/packages/platform-core/index.mjs","/packages/platform-core/deployment.mjs"
]);
const MIME={".html":"text/html; charset=utf-8",".mjs":"text/javascript; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"};
const SECURITY_HEADERS={
  "Cache-Control":"no-store",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"no-referrer",
  "Content-Security-Policy":"default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};

/** Exported to allow a real HTTP smoke test, not just source inspections. */
export function createDemoServer(){
  return createServer(async(req,res)=>{
    if(req.method!=="GET"&&req.method!=="HEAD"){
      res.writeHead(405,{"Allow":"GET, HEAD",...SECURITY_HEADERS});res.end();return;
    }
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);}
    catch{res.writeHead(400,SECURITY_HEADERS);res.end();return;}

    // IMPORTANT: an internal rewrite kept the browser URL at "/", so it
    // requested "/theme.css" and "/arena.mjs", neither of which existed.
    // Redirect so all relative assets resolve under "/demo/".
    if(pathname==="/"||pathname==="/index.html"){
      res.writeHead(302,{Location:"/demo/arena.html",...SECURITY_HEADERS});
      res.end();return;
    }
    if(!allowed.has(pathname)){
      res.writeHead(404,SECURITY_HEADERS);res.end("Not found");return;
    }
    try{
      const data=await readFile(resolve(root,"."+pathname));
      const extension=pathname.slice(pathname.lastIndexOf("."));
      res.writeHead(200,{"Content-Type":MIME[extension]||"application/octet-stream",...SECURITY_HEADERS});
      res.end(req.method==="HEAD"?undefined:data);
    }catch{
      res.writeHead(404,SECURITY_HEADERS);res.end("Not found");
    }
  });
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||8080);
  createDemoServer().listen(port,"127.0.0.1",()=>{
    console.log("PlayNexa demo ready: http://127.0.0.1:"+port+"/demo/arena.html");
    console.log("Arena onboarding: http://127.0.0.1:"+port+"/demo/onboard.html");
  });
}
