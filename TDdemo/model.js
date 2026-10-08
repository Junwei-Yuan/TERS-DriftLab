(function(root){
'use strict';
function parseAtoms(text, extension, unit='A') {
 const lines=text.split(/\r?\n/), atoms=[], scale=unit==='A'?0.1:1;
 const rows=extension==='xyz'?lines.slice(2):lines;
 for(const line of rows){
  let p;
  if(extension==='pdb'){
   if(!/^(ATOM  |HETATM)/.test(line))continue;
   p=[line.slice(30,38),line.slice(38,46),line.slice(46,54)].map(Number);
  }else{const a=line.trim().split(/\s+/);if(a.length<4)continue;p=a.slice(1,4).map(Number);}
  if(p.every(Number.isFinite))atoms.push(p.map(v=>v*scale));
 }
 if(!atoms.length)throw Error('没有找到有效原子坐标');
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const p of atoms)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[k]);hi[k]=Math.max(hi[k],p[k]);}
 for(const p of atoms)for(let k=0;k<3;k++)p[k]-=lo[k];
 return {atoms,width:Math.max(1,hi[0]-lo[0]),depth:Math.max(1,hi[1]-lo[1]),origin:lo};
}
function surface(kind='mixed', n=49){
 let width=20,depth=20, h=[];
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const x=width*i/(n-1),y=depth*j/(n-1);
  const z=kind==='flat'?1:kind==='step'?(x>10?3:0.5):1.1+3*Math.exp(-((x-6)**2+(y-7)**2)/8)+1.8*Math.exp(-((x-15)**2+(y-14)**2)/13)-0.9*Math.exp(-((x-13)**2+(y-5)**2)/5);
  h.push(z);
 }return {n,width,depth,h,valid:h.map(()=>true),name:kind};
}
function fromAtoms(parsed,n=65){
 const {width,depth,atoms}=parsed, h=Array(n*n).fill(-Infinity),valid=Array(n*n).fill(false);
 // Top-envelope binning. Empty bins remain invalid: no fabricated flat substrate.
 for(const [x,y,z] of atoms){const i=Math.min(n-1,Math.round(x/width*(n-1))),j=Math.min(n-1,Math.round(y/depth*(n-1))),k=j*n+i;h[k]=Math.max(h[k],z);valid[k]=true;}
 return {n,width,depth,h,valid,name:'Imported top envelope',atomCount:atoms.length,origin:parsed.origin};
}
function height(s,x,y){const i=Math.max(0,Math.min(s.n-1,Math.round(x/s.width*(s.n-1)))),j=Math.max(0,Math.min(s.n-1,Math.round(y/s.depth*(s.n-1))));return s.valid[j*s.n+i]?s.h[j*s.n+i]:NaN;}
function tipHeight(s,x,y,r,g){
 // Discrete spherical-tip envelope: lowest apex which clears all sampled heights.
 let z=-Infinity;const dx=s.width/(s.n-1),dy=s.depth/(s.n-1);
 const a=Math.max(0,Math.floor((x-r)/dx)),b=Math.min(s.n-1,Math.ceil((x+r)/dx));
 const c=Math.max(0,Math.floor((y-r)/dy)),d=Math.min(s.n-1,Math.ceil((y+r)/dy));
 for(let j=c;j<=d;j++)for(let i=a;i<=b;i++){const k=j*s.n+i,q=(i*dx-x)**2+(j*dy-y)**2;if(s.valid[k]&&q<=r*r)z=Math.max(z,s.h[k]+Math.sqrt(Math.max(0,r*r-q))-r);}
 return Number.isFinite(z)?z+g:NaN;
}
function path(s,n,serpentine=true){const a=[];for(let j=0;j<n;j++)for(let k=0;k<n;k++){const i=serpentine&&j%2?n-1-k:k;a.push({i,j,x:i*s.width/(n-1),y:j*s.depth/(n-1)});}return a;}
const api={parseAtoms,surface,fromAtoms,height,tipHeight,path};
if(typeof module!=='undefined')module.exports=api;else root.ScanModel=api;
})(globalThis);
