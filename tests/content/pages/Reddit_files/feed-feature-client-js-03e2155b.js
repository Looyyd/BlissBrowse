import{bR as t,L as e,_ as s,n as i,e as o,s as n,i as r,x as h}from"./shell-5af0f000.js";import{t as a}from"./throttle-e21e3a3c.js";class l{constructor(t){this._topPadding=0,this.topStack=[],this.heightCache=new WeakMap,this.getHeightCached=t=>{if(this.heightCache.has(t))return this.heightCache.get(t)??0;{const{height:e}=t.getBoundingClientRect();return this.heightCache.set(t,e),e}},this.onResize=t=>{t.forEach((t=>{this.heightCache.set(t.target,t.contentRect.height)}))},this.onMutation=t=>{t.forEach((t=>{t.addedNodes.forEach((t=>{t instanceof Element&&this.resizeObserver.observe(t)})),t.removedNodes.forEach((t=>{t instanceof Element&&(this.resizeObserver.unobserve(t),this.heightCache.delete(t))}))}))},this.mutationObserver=new MutationObserver(this.onMutation),this.resizeObserver=new ResizeObserver(this.onResize),(this.host=t).addController(this)}get topPadding(){return this._topPadding}set topPadding(t){this._topPadding=t,this.host.style.paddingTop=`${t}px`}hostConnected(){Array.from(this.host.children).forEach((t=>this.resizeObserver.observe(t))),this.mutationObserver.observe(this.host,{childList:!0,attributes:!1,subtree:!1})}hostDisconnected(){this.mutationObserver.disconnect(),this.resizeObserver.disconnect()}update(){const t=this.host.getBoundingClientRect(),e=-1*(t.top+this.topPadding+window.innerHeight);if(this._virtualizeTop(e)){const e=this.host.getBoundingClientRect().bottom-t.bottom;Math.abs(e)>1&&window.scrollBy({top:e,behavior:"auto"})}}virtualizeTopElement(){const t=this.host.firstElementChild;if(!t)return null;const e=this.getHeightCached(t);this.host.removeChild(t),this.topPadding+=e;const s=[t,e];return this.topStack.push(s),s}devirtualizeTopElement(){const t=this.topStack.pop();if(!t)return null;const[e,s]=t;return this.host.prepend(e),this.topPadding-=s,t}_virtualizeTop(t){let e=!1;if(t>0){let s=t;for(;this.host.firstElementChild&&this.getHeightCached(this.host.firstElementChild)<s;){const t=this.virtualizeTopElement();if(!t)break;e=!0;const[i,o]=t;s-=o}}else{let s=t;for(;this.topStack.length&&s<0;){const t=this.devirtualizeTopElement();if(!t)break;e=!0;const[i,o]=t;s+=o}}return e}}class c{constructor(t,e){this.observedElements=[],this.handleSlotChange=t=>{this.observer.disconnect();const e=t.target;e instanceof HTMLSlotElement&&(this.observedElements=e.assignedElements(),this.observedElements.forEach((t=>this.observer.observe(t))))},this.observer=new IntersectionObserver(this.handleIntersection.bind(this),e),(this.host=t).addController(this)}hostConnected(){this.observedElements.forEach((t=>this.observer.observe(t)))}hostDisconnected(){this.observer.disconnect()}isLoadableFaceplatePartial(s){return s instanceof t&&s.loading===e.Programmatic&&!s.isLoading}handleIntersection(t){t.forEach((t=>{t.isIntersecting&&this.isLoadableFaceplatePartial(t.target)&&t.target.load()}))}}let d=class extends n{constructor(){super(...arguments),this.navigationSessionId="",this.loadBeforeController=new c(this),this.loadAfterController=new c(this,{rootMargin:2*window.innerHeight+"px"}),this.virtualizationEnabled=!1,this.virtualization=null,this.onDocumentScroll=a((()=>{this.virtualization?.update()}),200,!0)}static get styles(){return r`:host{display:flex;flex-direction:column}`}async connectedCallback(){super.connectedCallback(),this.virtualizationEnabled&&!this.virtualization&&(this.virtualization=new l(this)),document.addEventListener("scroll",this.onDocumentScroll)}async disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("scroll",this.onDocumentScroll)}render(){return h`\n <slot @slotchange="${this.loadBeforeController?.handleSlotChange}" name="load-before"></slot>\n <slot></slot>\n <slot @slotchange="${this.loadAfterController?.handleSlotChange}" name="load-after"></slot>\n `}};s([i({type:String,attribute:"navigation-session-id"})],d.prototype,"navigationSessionId",void 0),s([i({type:Boolean,attribute:"virtualize"})],d.prototype,"virtualizationEnabled",void 0),d=s([o("shreddit-feed")],d);
//# sourceMappingURL=feed-feature-client-js-03e2155b.js.map
