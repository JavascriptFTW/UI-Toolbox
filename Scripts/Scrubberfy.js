var Scrubberfy = (function() {

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

    /* An array of custom data properties that the user is NOT allowed to set as it would make
       everyone have a bad day */
    var bannedCustom = ["setData", "getData", "setContent", "getContent"];


    /* The Scrubber constructor. Takes two arguments: the element to attach to (el) and
       a config object (cfg) */
    function Scrubber(el, cfg) {
        /* Store data used in this scrubber */
        this.data = {
            globals: globals
        };
        /* Store custom data (data created by the user and data that user-created data needs
           access to). Data data data! */
        this.customData = {
            /* Pre-define our various user callbacks, so that if the user decides not to define
               them themselves nothing blows up */
            init: function() {},
            grab: function() {},
            drag: function() {},
            release: function() {},
            /* Method to set the value of a key on our data object */
            setData: (function(key, value) {
                /* Set data "key" on the data object of this Scrubber to "value" */
                this.data[key] = value;
                /* Refresh our content */
                this.customData.refreshContent();
            }).bind(this),
            /* Method to get whatever data is stored at some key in our data object */
            getData: (function(key) {
                /* Return whatever data is stored in "key" on our data object */
                return this.data[key];
            }).bind(this),
            /* Method to set global data "key" to "value" */
            setGlobal: (function(key, value) {
                /* Set global data "key" to "value" */
                this.data.globals[key] = value;
                /* Refresh our data */
                this.customData.refreshContent();
            }).bind(this),
            /* Method to get the global data stored at a specific key */
            getGlobal: (function(key) {
                /* Return the global data stored in "key" */
                return this.data.globals[key];
            }).bind(this),
            /* Method to set the content of our Scrubbers element */
            setContent: (function(v) {
                /* Set the content property to "v" */
                this.content = v;
                /* Refresh our content */
                this.customData.refreshContent();
            }).bind(this),
            /* Method to get the content property of this Scrubber */
            getContent: (function() {
                /* Return the content property of this Scrubber */
                return this.content;
            }).bind(this),
            /* Method to refresh the content of our Scrubber, updating the textContent of
               our element */
            refreshContent: (function() {
                /* Create a variable to hold our formatted content */
                var parsedContent = this.content;
                /* Replace all expressions (formed like {{expression body}}) in our text content with
                   their value after evaluation using a regular expression which captures the body of
                   the expression */
                parsedContent = parsedContent.replace(/\{\{(.+?)\}\}/g, (function(match, p1) {
                    /* Evaluate the content of our expression */
                    var value = this._evalContent(p1);
                    /* Give unique error messages for undefined, null, and NaN results of parsing
                       an expression */
                    if (value === undefined) {
                        value = "It was undefined :("
                    }
                    if (value === null) {
                        value = "I feel so null :|"
                    }
                    if (window.isNaN(value)) {
                        value = "Something was not a number :P"
                    }
                    /* Return whatever value our expression returns (even error messages) thereby replacing it
                       in the text content */
                    return value;
                }).bind(this));
                /* Set the text content of the element that this scrubber is attached to to the value of
                   our parsed content */
                this.el.textContent = parsedContent;
            }).bind(this)
        };
        /* Store the element that this scrubber is attached to */
        this.el = el;
        /* Store the content of this scubbers element */
        this.content = this.el.textContent;
        /* Call our init method to do some initiation logic */
        this.init.apply(this, Array.prototype.slice.call(arguments));
    };

    Scrubber.prototype = {
        /* Method to do initiation work on our Scrubber object */
        init: function(el, cfg) {
            /* For every custom data-attribute that is attached to the object passed... */
            for (var i in el.dataset) {
                /* ...add it to this scrubbers data dictionary */
                this.data[i] = el.dataset[i];
            }

            /* For every element in the cfg dictionary... */
            for (var i in cfg) {
                /* ...if cfg has this element as it's own property... */
                if (cfg.hasOwnProperty(i)) {
                    /* ...and if this property is not in the list of terms the user is not allowed to set... */
                    if (bannedCustom.indexOf(i) === -1) {
                        /* ...bind the current element to the customData of this Scrubber and store it in
                           an element of this scrubbers customData that matches it's key in cfg */
                        this.customData[i] = cfg[i].bind(this.customData);
                    }
                }
            }

            /* Set the cursor property on the style for our element to "col-resize" */
            this.el.style.cursor = "col-resize";

            /* Listen for "mousedown" events on our element and call the grab method when we catch one */
            DOMEvent.listener({
                event: "mousedown",
                callback: this.grab.bind(this)
            }).listen(this.el);

            /* Call any custom initiation code that the user has defined on this Scrubber */
            this.customData.init();
        },
        /* Called when the mouse is pressed down on our element */
        grab: function(evt) {
            /* Set the active scrubber to this one */
            activeScrubber = this;
            /* Call the user defined grab event (if any) and set it's "this" value to the event
               variable and with an argument passed for the event data (just in case someone
               forgets/doesn't know about "this") */
            this.customData.grab.call(evt, evt);
        },
        /* Called as our Scrubber is being dragged */
        drag: function(evt) {
            /* Set some custom event attributes indicating how far the mouse has been moved in the
               x and y directions since its position was last updated */
            evt.movementX = mouse.px - mouse.x;
            evt.movementY = mouse.py - mouse.y;
            /* Call the user defined drag callback (if any) with the value of this set to the event
               data and with an argument passed for the event data (just in case someone forgets/doesn't
               know about "this") */
            this.customData.drag.call(evt, evt);
        },
        /* Called when our Scrubber is "released" */
        release: function(evt) {
            /* Set the active scrubber to null as no scrubber is being drug right now */
            activeScrubber = null;
            /* Call the user defined release callback (if any) with the value of this set
               to the event data and with an argument passed for the event data (just in
               case someone forgets/doesn't know about "this") */
            this.customData.release.call(evt, evt);
        },
        /* Internal method to evaluate the content of expressions */
        _evalContent: function(toEval) {
            /* Replace all instances refences to local data in toEval with the code to access it via
               the this object and do the same for references to globals */
            toEval = toEval.replace(/@\((.+?)\)/g, "this['$1']").replace(/#\((.+?)\)/g, "this.globals['$1']");
            /* If the experssion contains an equals sign or any character other than
               0-9 A-Z ( ) + - / or * return as we don't want people doing wierd stuff */
            if (toEval.indexOf("=") !== -1 || !(/[0-9A-Za-z\(\)+\-/*%]+/.test(toEval))) {
                return;
            }
            /* Create a new Function to get the value of our expression. It returns the 
               expression to evaluate and is encased in a "with(Math)" statement (so
               that people can type "sin" instead of "Math.sin") */
            var valueGenerator = new Function("with(Math) {return " + toEval + ";}").bind(this.data);
            /* Return whatever our value generator function returns (be it NaN or undefined) */
            return valueGenerator();
        }
    };



    /* Define the Scrubberfy method that takes in an HTML node or HTML collection or Array (el), and
       a config object (cfg), and creates a new Scrubber object for every element it is passed with
       the config object that was passed */
    function Scrubberfy(el, cfg) {
        /* If our "el" arguments is an HTMLCollection or an Array... */
        if (el.constructor === HTMLCollection || el.constructor === Array) {
            /* ...for every element within el... */
            for (var i = 0; i < el.length; i ++) {
                /* ...create a new Scrubber with the element at the current index as
                   it's HTML element and our "cfg" argument as its config object */
                new Scrubber(el[i], cfg);
            }
        /* ...otherwise... */
        } else {
            /* ...create a new Scrubber with our "el" argument as its HTML element
               and our "cfg" argument as its config object */
            new Scrubber(el, cfg);
        }
    };

    /* Method to get an element from the globals dictionary */
    Scrubberfy.getGlobal = function(key) {
        /* Return whatever is assigned to key in the globals dictionary (undefined, something,
           a potato...) */
        return globals[key];
    };

    /* Method to set an element from the globals dictionary */
    Scrubberfy.setGlobal = function(key, value) {
        /* Assign the "key" key on the globals dictionary to whatever value was passed */
        globals[key] = value;
    };



    /* Listen for "mousemove" events on the document... */
    DOMEvent.listener({
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
    DOMEvent.listener({
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