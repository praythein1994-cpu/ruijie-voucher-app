#!/usr/bin/env node
/* Full audit runner: syntax + all test files (plain, jest-shim, jsdom).
 * Exit 0 = all green. Prints failures. Used by the recurring audit cron.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHIM_TESTS = ['v15106', 'v15107', 'v15109', 'v15113', 'v15115'];
const JSDOM_TESTS = ['fix-expired-delete'];

let failures = [];
const run = (file, useShim) => {
  const fp = path.join(ROOT, 'tests', file);
  try {
    let code;
    if (useShim) {
      const wrapper = path.join(ROOT, 'tests', '.shim-wrapper.cjs');
      fs.writeFileSync(wrapper, shimPrelude() + fs.readFileSync(fp, 'utf8'));
      try {
        const out = execFileSync('node', [wrapper], { timeout: 100000, cwd: ROOT });
        console.log(`${file}: ${out.toString().trim().split('\n').pop()}`);
      } finally { try { fs.unlinkSync(wrapper); } catch (e) {} }
    } else {
      const out = execFileSync('node', [fp], { timeout: 100000, cwd: ROOT });
      const last = out.toString().trim().split('\n').pop();
      console.log(`${file}: ${last}`);
      if (/FAIL/i.test(last) && !/0 failed/.test(last)) failures.push(`${file}: ${last}`);
    }
  } catch (e) {
    const tail = (e.stdout || Buffer.alloc(0)).toString().trim().split('\n').slice(-4).join(' | ');
    console.log(`${file}: CRASH ${tail}`);
    failures.push(`${file}: CRASH ${tail}`);
  }
};

function shimPrelude() {
  return `
let __pass=0, __fail=0; const __fails=[];
global.describe=(n,f)=>{try{f()}catch(e){__fail++;__fails.push(n+': '+e.message)}};
global.test=(n,f)=>{try{f();__pass++}catch(e){__fail++;__fails.push(n+': '+e.message)}};
global.it=global.test;
function __mk(x,neg){const t=(c,m)=>{if(neg?c:!c)throw new Error(m)};return{
toBe:(y)=>t(x===y,'exp '+JSON.stringify(y)+' got '+JSON.stringify(x)),
toEqual:(y)=>t(JSON.stringify(x)===JSON.stringify(y),'not equal'),
toBeTruthy:()=>t(!!x,'not truthy'),toBeFalsy:()=>t(!x,'not falsy'),
toContain:(y)=>t(String(x).includes(y),'missing '+y),
toMatch:(r)=>t(r.test(x),'no match '+r),
toBeGreaterThan:(n)=>t(x>n,x+' not > '+n),toBeLessThan:(n)=>t(x<n,x+' not < '+n),
toHaveLength:(n)=>t(x.length===n,'len '+x.length+'!='+n),
get not(){return __mk(x,!neg)}}}
global.expect=(x)=>__mk(x,false);
process.on('exit',()=>{for(const f of __fails)console.log('  FAIL:',f);console.log('shim: '+__pass+' passed, '+__fail+' failed');if(__fail)process.exitCode=1;});
`;
}

// 1. syntax
for (const f of ['js/app.js', 'js/api.js']) {
  try {
    execFileSync('node', ['--check', path.join(ROOT, f)], { cwd: ROOT });
    console.log(`${f}: syntax OK`);
  } catch (e) { console.log(`${f}: SYNTAX FAIL`); failures.push(`${f}: SYNTAX FAIL`); }
}

// 2. all test files
for (const f of fs.readdirSync(path.join(ROOT, 'tests'))) {
  if (!f.endsWith('.test.js') || f === 'run-all.js') continue;
  const base = f.replace('.test.js', '');
  run(f, SHIM_TESTS.includes(base));
}

console.log(failures.length ? `\nAUDIT FAILURES (${failures.length}):\n- ` + failures.join('\n- ') : '\nAUDIT: ALL GREEN');
process.exit(failures.length ? 1 : 0);
