import{C as f,r as s,j as a,c as m}from"./index-B2Ch0ZIB.js";import{X as d}from"./x-D8KW9FPM.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=f("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=f("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);function h(e,t){const[r,c]=s.useState(e);return s.useEffect(()=>{const o=setTimeout(()=>c(e),t);return()=>clearTimeout(o)},[e,t]),r}function g({value:e="",onSearch:t,placeholder:r="Tìm kiếm...",debounceMs:c=400,className:o}){const[n,u]=s.useState(e),l=h(n,c),i=s.useRef(t);return s.useEffect(()=>{i.current=t},[t]),s.useEffect(()=>{i.current(l)},[l]),s.useEffect(()=>{u(e)},[e]),a.jsxs("div",{className:m("relative",o),children:[a.jsx(x,{className:"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),a.jsx("input",{type:"search",value:n,onChange:p=>u(p.target.value),placeholder:r,className:m("w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9","text-sm text-slate-900 placeholder:text-slate-400","focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary","transition-colors")}),n&&a.jsx("button",{type:"button",onClick:()=>{u(""),t("")},className:"absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors","aria-label":"Xóa tìm kiếm",children:a.jsx(d,{className:"h-4 w-4"})})]})}export{j as R,g as S,x as a};
