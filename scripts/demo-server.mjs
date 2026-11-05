import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve, dirname} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const port=Number(process.env.PORT||8080);
const allowed=new Set([
  "/demo/index.html","/demo/main.js","/demo/theme.css",
  "/demo/demo-data.mjs","/demo/marketplace.html","/demo/marketplace.mjs",
  "/demo/arena.html","/demo/arena.mjs","/demo/onboard.html","/demo/onboard.mjs",
  "/packages/platform-core/index.mjs"
]);
const MIME={".html":"text/html; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"};
createServer(async(req,res)=>{
  if(req.method!=="GET" && req.method!=="HEAD"){res.writeHead(405,{"Allow":"GET, HEAD"});res.end();return}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname)}catch{res.writeHead(400);res.end();return}
  if(pathname==="/")pathname="/demo/marketplace.html";
  if(!allowed.has(pathname)){res.writeHead(404);res.end("Not found");return}
  try{
    const data=await readFile(resolve(root,"."+pathname));
    const extension=pathname.slice(pathname.lastIndexOf("."));
    res.writeHead(200,{"Content-Type":MIME[extension]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method==="HEAD"?undefined:data);
  }catch{res.writeHead(404);res.end("Not found")}
}).listen(port,"127.0.0.1",()=>console.log("PlayNexa offline demo: http://127.0.0.1:"+port));
