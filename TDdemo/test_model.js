const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('./model.js');
const s=M.surface('flat');
for(const r of [0.4,1.2,4])assert.ok(Math.abs(M.tipHeight(s,10,10,r,.5)-1.5)<1e-9);
const a=M.surface('step');assert.ok(M.tipHeight(a,9.5,10,2,.5)>M.height(a,9.5,10)+.5);
const p=M.path(s,4);assert.equal(p.length,16);assert.equal(new Set(p.map(q=>`${q.i},${q.j}`)).size,16);assert.equal(p[3].x,p[4].x);
const xyz=M.parseAtoms('2\nsample\nAu -10 0 0\nAu 10 0 20','xyz','A');assert.deepEqual(xyz.atoms,[[0,0,0],[2,0,2]]);
if(process.argv[2]){const gold=M.parseAtoms(fs.readFileSync(process.argv[2],'utf8'),'pdb','A');assert.equal(gold.atoms.length,100000);assert.ok(Math.abs(gold.width-20.1871)<1e-6);const top=M.fromAtoms(gold);assert.ok(top.valid.every(Boolean));assert.ok(Number.isFinite(M.tipHeight(top,10,10,1.2,.5)));console.log('gold.pdb: 100000 atoms parsed, units and top envelope verified');}
console.log('PASS: flat surface clearance, step tip-radius response, scan coverage, units');
