import"./shell-5af0f000.js";const e=document.querySelector("#popular-communities-list"),t=e?.querySelectorAll(".hidden"),l=e?.querySelector("#popular-communities-list-see-more"),r=l?.getAttribute("data-see-less-label"),s=l?.getAttribute("data-see-more-label");if(e&&l&&t&&r&&s){let e=!0;l.addEventListener("click",(()=>{Array.from(t).forEach((t=>{e?t.classList.remove("hidden"):t.classList.add("hidden")})),l.textContent=e?r:s,e=!e}))}
//# sourceMappingURL=popular-communities-client-js-9a6d4c7e.js.map
