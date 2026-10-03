// Checks generated artifacts and source route coverage; no network/API calls.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dir = __dirname;
const contract = JSON.parse(fs.readFileSync(path.join(dir,'api-contract.json'),'utf8'));
const collection = JSON.parse(fs.readFileSync(path.join(dir,'Humidor411.postman_collection.json'),'utf8'));
const environment = JSON.parse(fs.readFileSync(path.join(dir,'Humidor411.postman_environment.json'),'utf8'));
const requests = collection.item.flatMap(folder=>folder.item);
assert.equal(requests.length,contract.requests.length);
assert.equal(new Set(contract.requests.map(s=>s.key)).size,contract.requests.length);
const variableKeys=new Set(environment.values.map(v=>v.key));
for(const spec of contract.requests){
  const req=requests.find(r=>r.name===spec.key);
  assert(req,`Missing Postman request: ${spec.key}`);
  assert.equal(req.request.method,spec.method);
  assert.equal(req.response[0].code,spec.statusCode);
  assert.deepEqual(JSON.parse(req.response[0].body),spec.response);
  assert.equal(spec.response.success,true);
  assert.equal(spec.response.statusCode,spec.statusCode);
  for(const m of (spec.url+JSON.stringify(spec.body)).matchAll(/\{\{(\w+)\}\}/g))assert(variableKeys.has(m[1]),`Undefined variable ${m[1]}`);
  if(spec.parser==='data[]')assert(Array.isArray(spec.response.data));
  if(spec.parser==='data.data[]')assert(Array.isArray(spec.response.data.data));
}
for(const key of ['accessToken','password','email','newPassword','otp'])assert.equal(environment.values.find(v=>v.key===key).value,'','Credentials must ship blank');
const base=process.argv[2]??path.resolve(dir,'../..');
const zipBase=process.argv[3];
const controllers=['auth/auth.controller.ts','consumer-profile/consumer-profile.controller.ts','consumer-catalog/consumer-catalog.controller.ts','recommendation/recommendation.controller.ts','retailer/retailer.controller.ts','inventory/inventory.controller.ts','consumer-scan/consumer-scan.controller.ts','qrcodes/qrcodes.controller.ts','consumer-cigar/consumer-cigar.controller.ts','journal/journal.controller.ts','user/user.controller.ts'];
function routes(root){
  const found=[];
  for(const controller of controllers){
    const file=path.join(root,'src/app/module',controller);
    if(!fs.existsSync(file))continue;
    const text=fs.readFileSync(file,'utf8');
    const prefix=text.match(/@Controller\(['"]([^'"]*)['"]\)/)?.[1];
    if(prefix===undefined)continue;
    for(const match of text.matchAll(/@(Get|Post|Patch|Put|Delete)\((?:['"]([^'"]*)['"])?\)/g)){
      const route='/'+[prefix,match[2]??''].join('/').split('/').filter(Boolean).join('/');
      const matcher=new RegExp('^'+route.split('/').map(part=>part.startsWith(':')?'[^/]+':part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('/')+'$');
      found.push({method:match[1].toUpperCase(),route,matcher});
    }
  }
  return found;
}
const current=routes(base), archived=zipBase?routes(zipBase):[];
let covered=0;
for(const spec of contract.requests){
  const concrete=spec.url.split('?')[0];
  const matching=(spec.availability==='zip-only'?archived:current).some(r=>r.method===spec.method&&r.matcher.test(concrete));
  if(spec.availability==='zip-only'&&!zipBase)continue;
  assert(matching,`No source route for ${spec.key}: ${spec.method} ${concrete}`);
  covered++;
}
console.log(`PASS: ${requests.length} request examples, unique keys, variable references, envelope shapes, blank credentials; ${covered} route/source checks. No API requests executed.`);
