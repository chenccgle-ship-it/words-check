const http=require('http'),fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const root=path.resolve(__dirname,'../app'),host='127.0.0.1',port=18765,identity='words-check-portable-v1',url=`http://${host}:${port}/`;
function browser(){if(process.platform==='win32'&&!process.argv.includes('--no-browser')&&process.env.WORDS_CHECK_NO_BROWSER!=='1')execFile('explorer.exe',[url],{windowsHide:true},()=>{})}
const assets={'/':['index.html','text/html'],'/app.js':['app.js','application/javascript'],'/default-words.js':['default-words.js','application/javascript'],'/style.css':['style.css','text/css'],'/vendor/xlsx.full.min.js':['vendor/xlsx.full.min.js','application/javascript']};
function run(){const server=http.createServer((req,res)=>{
 const pathname=req.url.split('?')[0];
 if(req.headers.host!==`${host}:${port}`&&req.headers.host!==`localhost:${port}`){res.writeHead(403);res.end();return}
 if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({app:identity}));return}
 if(pathname==='/shutdown'&&req.method==='POST'&&!req.headers.origin){res.end('Stopped');server.close();setTimeout(()=>process.exit(0),200);return}
 const asset=assets[pathname];if(!asset){res.writeHead(404);res.end('Not found');return}
 res.writeHead(200,{'Content-Type':asset[1]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(path.join(root,asset[0])).pipe(res);
 });server.on('error',err=>{if(err.code==='EADDRINUSE'){check(true);return}fs.writeFileSync(path.resolve(__dirname,'../启动错误.txt'),err.message)});server.listen(port,host,()=>{console.log(url);browser()})}
function check(retry=false){const req=http.get(url+'health',res=>{let data='';res.on('data',chunk=>data+=chunk);res.on('end',()=>{let match=false;try{match=JSON.parse(data).app===identity}catch{}if(match){if(process.argv.includes('--stop')){http.request(url+'shutdown',{method:'POST'},r=>r.resume()).end()}else browser()}else if(!retry&&!process.argv.includes('--stop'))run()})});req.setTimeout(1500,()=>req.destroy());req.on('error',()=>{if(!retry&&!process.argv.includes('--stop'))run()})}check();
