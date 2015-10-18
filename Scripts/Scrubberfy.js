var Scrubberfy = (function() {
    "use strict";
    function merge() {
        var ret = {};
        for (var i = 0; i < arguments.length; i ++) {
            var obj = arguments[i];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    ret[key] = obj[key];
                }
            }
        }
        return ret;
    }

    /* Store some data about the mouse (current position and previous position) */
    var mouse = {
        x: 0,
        y: 0,
        px: 0,
        py: 0
    };

    /* Store our Scrubber global data */
    var globals = {
        pi: Math.PI
    };

    /* A variable to store the currently active scrubber */
    var activeScrubber = null;

    var handlers = ["grab", "drag", "release"];


    /* The Scrubber constructor. Takes two arguments: the element to attach to (el) and
       a config object (cfg) */
    function Scrubber(el, cfg) {
        /* Call our init method to do some initiation logic */
        var args = Array.prototype.slice.call(arguments);
        args.push(true);
        DOM.Bind.apply(this, args);
        this.el = el;
        this._init.apply(this, args);
    }

    Scrubber.prototype = merge(DOM.Bind.prototype, {
        /* Method to do initiation work on our Scrubber object */
        _init: function(el, cfg) {
            for (var i = 0; i < handlers.length; i ++) {
                var handler = handlers[i];
                if (!this.data[handler] || this.data[handler].constructor !== Function) {
                    this.data[handler] = function() {};
                }
                this.data[handler] = this.data[handler].bind(this.data);
            }

            /* Set the cursor property on the style for our element to "col-resize" */
            this.el.style.cursor = "col-resize";

            /* Listen for "mousedown" events on our element and call the grab method when we catch one */
            DOM.Event.listener({
                event: "mousedown",
                callback: this.grab.bind(this)
            }).listen(this.el);
        },
        /* Called when the mouse is pressed down on our element */
        grab: function(evt) {
            /* Set the active scrubber to this one */
            activeScrubber = this;
            /* Call the user defined grab event (if any) and set it's "this" value to the event
               variable and with an argument passed for the event data (just in case someone
               forgets/doesn't know about "this") */
            this.data.grab.call(evt, evt);
        },
        /* Called as our Scrubber is being dragged */
        drag: function(evt) {
            /* Set some custom event attributes indicating how far the mouse has been moved in the
               x and y directions since its position was last updated */
            evt.deltaX = mouse.x - mouse.px;
            evt.deltaY = mouse.y - mouse.py;
            /* Call the user defined drag callback (if any) with the value of this set to the event
               data and with an argument passed for the event data (just in case someone forgets/doesn't
               know about "this") */
            this.data.drag.call(evt, evt);
        },
        /* Called when our Scrubber is "released" */
        release: function(evt) {
            /* Set the active scrubber to null as no scrubber is being drug right now */
            activeScrubber = null;
            /* Call the user defined release callback (if any) with the value of this set
               to the event data and with an argument passed for the event data (just in
               case someone forgets/doesn't know about "this") */
            this.data.release.call(evt, evt);
        }
    });



    /* Define the Scrubberfy method that takes in an HTML node or HTML collection or Array (el), and
       a config object (cfg), and creates a new Scrubber object for every element it is passed with
       the config object that was passed */
    function Scrubberfy(el, cfg) {
        /* If our "el" arguments is an HTMLCollection or an Array... */
        if (el.constructor === HTMLCollection || el.constructor === Array) {
            /* TODO (JavascriptFTW): Create a ScrubberCollection type so that we can
               return it here. It should have the same methods as a Scrubber object
               (which when called will call the corresponding method on all of it's
               Scrubbers) */
            /* ...for every element within el... */
            for (var i = 0; i < el.length; i ++) {
                /* ...create a new Scrubber with the element at the current index as
                   it's HTML element and our "cfg" argument as its config object */
                new Scrubber(el[i], cfg);
            }
        /* ...otherwise... */
        } else {
            /* ...create a new Scrubber with our "el" argument as its HTML element
               and our "cfg" argument as its config object and return it */
            return new Scrubber(el, cfg);
        }
    }

    /* Method to get an element from the globals dictionary */
    Scrubberfy.getGlobal = function(key) {
        /* Return whatever is assigned to key in the globals dictionary (undefined, something,
           a potato...) */
        return DOM.Bind.globals[key];
    };

    /* Method to set an element from the globals dictionary */
    Scrubberfy.setGlobal = function(key, value) {
        /* Assign the "key" key on the globals dictionary to whatever value was passed */
        DOM.Bind.globals[key] = value;
    };



    /* Listen for "mousemove" events on the document... */
    DOM.Event.listener({
        event: "mousemove",
        preventDefault: true,
        /* ...when we catch one */
        callback: function(evt) {
            /* Set the previous position of the mouse to the stale current position of the
               mouse */
            mouse.px = mouse.x;
            mouse.py = mouse.y;
            /* Update the stored current position of the mouse */
            mouse.x = evt.clientX;
            mouse.y = evt.clientY;
            /* If the active scrubber is not null... */
            if (activeScrubber !== null) {
                /* ...set the cursor style of the body to "col-resize" */
                document.body.style.cursor = "col-resize";
                /* Call the "drag" method on the active scrubber and pass it the event data */
                activeScrubber.drag(evt);
            }
        }
    }).listen(document);

    /* Listen for "mouseup" events on the document... */
    DOM.Event.listener({
        event: "mouseup",
        /* ...when we catch one */
        callback: function(evt) {
            /* If the active scrubber is not null... */
            if (activeScrubber !== null) {
                /* ...set the cursor style of the body to nothing so it won't
                   override any styles defined in CSS anymore */
                document.body.style.cursor = "";
                /* Call the "release" method on the active scrubber and pass it the event data */
                activeScrubber.release(evt);
            }
        }
    }).listen(document);



    return Scrubberfy;
})();
