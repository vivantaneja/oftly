import { spawn } from 'node:child_process';
const children=[spawn('.venv/bin/python',['-m','uvicorn','server.app:app','--host','127.0.0.1','--port','8766'],{stdio:'inherit'}),spawn('npm',['run','dev:web'],{stdio:'inherit'})];
let closing=false;
function close(code=0){if(closing)return;closing=true;children.forEach(c=>c.kill('SIGTERM'));setTimeout(()=>process.exit(code),300).unref();}
children.forEach(c=>{c.on('error',e=>{console.error(e);close(1)});c.on('exit',code=>close(code??0))});
process.on('SIGINT',()=>close());process.on('SIGTERM',()=>close());
