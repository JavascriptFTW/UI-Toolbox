function ready() {
    // Add a global to represent pi
    Scrubberfy.setGlobal("pi", Math.PI);

    Scrubberfy(document.getElementById("pi-coeff-scrubber"), {
        init: function() {
            this.setData("raw-value", 2, true);
            this.setData("value", 2);
            this.addBind(document.getElementById("pi-answer"));
        },
        drag: function(evt) {
            this.incrementData("raw-value", evt.deltaX / 6, true);
            this.setData("value", Math.round(this.getData("raw-value")));
        }
    });

    Scrubberfy(document.getElementById("num-cookies"), {
        init: function() {
            this.setData("raw-cookies", 1);
            this.setData("num-cookies", 1);
            this.addBind(document.getElementById("exercise"));
        },
        drag: function(evt) {
            this.incrementData("raw-cookies", evt.deltaX / 6, true);
            var rawCookies = this.constrainData("raw-cookies", 1, Infinity, true);
            this.setData("num-cookies", Math.round(rawCookies));
        }
    });
}

DOM.Event.listener({
    event: "ready",
    callback: ready
}).listen(document);
