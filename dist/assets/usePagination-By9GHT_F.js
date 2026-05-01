import{d as m,j as r,e as x,r as u,Y as h,Z as f}from"./index-BLaO86Wn.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=m("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=m("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function P({page:e,totalPages:s,onPageChange:t,className:n}){if(s<=1)return null;const a=p(e,s);return r.jsxs("nav",{className:x("flex items-center justify-center gap-1",n),"aria-label":"Phân trang",children:[r.jsx(c,{onClick:()=>t(e-1),disabled:e<=1,"aria-label":"Trang trước",children:r.jsx(d,{className:"h-4 w-4"})}),a.map((i,l)=>i==="..."?r.jsx("span",{className:"px-2 text-slate-400 select-none",children:"..."},`ellipsis-${l}`):r.jsx(c,{onClick:()=>t(i),active:i===e,children:i},i)),r.jsx(c,{onClick:()=>t(e+1),disabled:e>=s,"aria-label":"Trang sau",children:r.jsx(g,{className:"h-4 w-4"})})]})}function c({children:e,onClick:s,active:t,disabled:n,"aria-label":a}){return r.jsx("button",{onClick:s,disabled:n,"aria-label":a,"aria-current":t?"page":void 0,className:x("flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm transition-colors",t?"bg-primary text-white font-medium":"text-slate-600 hover:bg-slate-100",n&&"opacity-40 cursor-not-allowed pointer-events-none"),children:e})}function p(e,s){if(s<=7)return Array.from({length:s},(n,a)=>a+1);const t=[1];e>3&&t.push("...");for(let n=Math.max(2,e-1);n<=Math.min(s-1,e+1);n++)t.push(n);return e<s-2&&t.push("..."),t.push(s),t}function v({initialPage:e=h,initialLimit:s=f}={}){const[t,n]=u.useState(e),[a]=u.useState(s);return{page:t,limit:a,totalPages:o=>Math.ceil(o/a),goToPage:o=>{n(o)},reset:()=>{n(h)}}}export{g as C,P,v as u};
