/* Module for cross-browser event listening */
var DOMEvent = (function() {
    /* Create an object to store our publicly visible methods and data */
    var DOMEvent = {};

    /* The EventListener constructor. Can be attached to and unattached from as many objects as desired */
    function EventListener(cfg) {
        /* The name of the event we should listen for */
        this.event = cfg.event;
        /* The minimum interval between calls of the event listener */
        this.minInterval = cfg.minInterval || 0;
        /* Whether to prevent the default behaviour of the event */
        this.preventDefault = cfg.preventDefault || false;
        /* Whether the event should bubble or not */
        this.bubbles = cfg.bubbles || false;
        /* The handler callback for the event. Bind it to this EventListener so it has access
           to the EventListener's properties wherever it is */
        this.callback = function(evt) {
            /* If the user has specified that they want the default behaviour of the event
               prevented... */
            if (this.preventDefault) {
                /* ...prevent the default behaviour of the event */
                evt.preventDefault();
            }
            /* Get the current epoch time */
            var now = Date.now();
            /* If it's been more than the minimum number of milliseconds since the
               users event handler was called... */
            if (now - this.lastCallback > this.minInterval) {
                /* ...call it with whatever arguments were passed to this event handler */
                cfg.callback.apply(cfg.callback, Array.prototype.slice.call(arguments));
                /* Set the time of the last call to the event handler to the current epoch
                   time */
                this.lastCallback = Date.now();
            }
        }.bind(this);
        /* Store the last epoch time that our users event handler was called */
        this.lastCallback = -Infinity;
        /* Run our initialization method */
        this._init();
    };

    
    EventListener.prototype = {
        /* Method to run initialization logic for EventListener's */
        _init: function() {
            /* Do initialization stuff sometime */
        },
        /* 
          Listen and unlisten methods originally from John Resig here:
          http://ejohn.org/projects/flexible-javascript-events/ 
         */
        listen: function(el) {
            /* If the event we're listening for is "ready"... */
            if (this.event === "ready") {
                /* ...switch it to "DOMContentLoaded" and exit the method */
                el.addEventListener("DOMContentLoaded", this.callback, this.bubbles);
                return;
            }
            /* If we're on a stupid browser (i.e. IE)... */
            if (el.attachEvent) {
                /* ...set the event listener for IE/whatever-else-is-stupid */
                el["e" + this.event + this.callback] = this.callback;
                el[this.event + this.callback] = (function() {
                    el["e" + this.event + this.callback](window.event);
                }).bind(this);
                el.attachEvent("on" + this.event, el[this.event + this.callback]);
            /* ...otherwise... */
            } else {
                /* ...use the standard method to add event listeners */
                el.addEventListener(this.event, this.callback, this.bubbles);
            }
        },
        unlisten: function(el) {
            /* If we're on older versions of IE (which use the non-standard detachEvent)... */
            if (el.detachEvent) {
                /* ...detach the IE event listener */
                el.detachEvent("on" + this.event, obj[this.event + this.callback]);
                el[this.event + this.callback] = null
            /* ...otherwise... */
            } else {
                /* ...use the standard method to remove event listeners */
                el.removeEventListener(this.event, this.callback, this.bubbles);
            }
        }
    };

    /* Create a publicly visible method to create EventListener objects */
    DOMEvent.listener = function(cfg) {
        /* Return a new EventListener object with the config data passed to DOMEvent.listener */
        return new EventListener(cfg);
    };

    /* Return our object of publicly visible shtuff */
    return DOMEvent;
})();