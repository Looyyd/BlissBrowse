var Danbo = {
    isMobile: (window.matchMedia && window.matchMedia("(max-width: 480px)").matches),
    gateway: "https://hakurei.cdnbo.org/gate",
    page: null
};

Danbo.initialize = function() {
    var items = document.getElementsByClassName("danbo_dta");
    try {
        for (const item of items) {
            Danbo.open(item);
        }
    } catch (e) {
        console.log("[danbo] Exception occurred parsing blocks");
    }
};

Danbo.onMessage = function(msg) {

};

Danbo.identify = function(target) {
    var fqdn, data = target.getAttribute("data-danbo").split("-");
    
    page = window.location.href.split("/")[3];

    if (data.length != 5) 
        return false;

    return {
        "domain": data[0],
        "page": (page || data[1]),
        "zone": data[2],
        "rating": (window.danbo_rating),
        "width": data[3],
        "height": data[4],
        "fqdn": window.location.host
    };
};

Danbo.genId = function() {
    var res = "", chrs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for ( var i = 0; i < 12; i++ ) {
        res += chrs.charAt(Math.floor(Math.random() * 12));
    }
    
    return "danbo_item_" + res;
};

Danbo.open = function(target) {
    var gate, attributes = Danbo.identify(target);
    
    if (!attributes) 
        return false;
    
    gate = document.createElement("iframe");
    gate.marginHeight = 0;
    gate.frameBorder = 0;
    gate.style.cssText = `
        margin: 0 auto;
        height: ${attributes.height}px; 
        width: ${attributes.width}px; 
    `;
    gate.scrolling = "no";
    gate.marginWidth = 0;
    gate.loading = "lazy";
    gate.allow = "autoplay";
    gate.muted = true;
    gate.setAttribute("src", this.gateway + `?d=${attributes.domain}&p=${attributes.page}&z=${attributes.zone}&x=${attributes.rating}&fqdn=${attributes.fqdn}`)
    gate.id = Danbo.genId();
    gate.addEventListener("message", Danbo.onMessage);
    target.appendChild(gate);

    if (!document.getElementById('')) {}
};