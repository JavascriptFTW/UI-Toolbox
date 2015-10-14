DOMEvent.listener({
    event: "DOMContentLoaded",
    callback: function() {
        console.log("hi");
    }
}).listen(document);