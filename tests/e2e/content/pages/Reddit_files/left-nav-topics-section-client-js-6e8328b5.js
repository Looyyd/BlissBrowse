import{v as t,E as e,y as i,x as o,_ as s,s as n,n as c,e as r}from "./shell-5af0f000.js";import"./faceplate-expandable-section-helper-de878c08.js";let a=class extends(t(n)){constructor(){super(...arguments),this.noun="topic_item",this.topic="",this.events=new e(this),this._click=this.events.define("click",this.onClick)}onClick(){this.trackEvent({...i({source:"nav",action:"click",noun:this.noun}),topic_metadata:this.topic})}render(){return o`<slot></slot>`}};s([c({type:String})],a.prototype,"noun",void 0),s([c({type:String})],a.prototype,"topic",void 0),a=s([r("left-nav-topic-tracker")],a);
//# sourceMappingURL=left-nav-topics-section-client-js-6e8328b5.js.map