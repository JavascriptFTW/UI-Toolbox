(function() {
    "use strict";
    if (!window.DOM) {
        window.DOM = {};
    }

    /* An array of custom data properties that the user is NOT allowed to set as it would make
       everyone have a bad day */
    var bannedData = [
        "globals", "setData", "getData", "setGlobal",
        "getGlobal", "updateContent"
    ];
    var rawContentKey = "rawContentValue";


    function parseContent(match, toEval) {
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



    function DOMBind(el, data, used) {
        if (!used && !(this instanceof DOMBind)) {
            return new DOMBind(el, data);
        }
        this.data = {
            globals: DOMBind.globals,
            /* Pre-define our various user callbacks, so that if the user decides not to define
               them themselves nothing blows up */
            init: function() {},
            /* Method to set the value of a key on our data object */
            setData: this.setData.bind(this),
            /* Method to get whatever data is stored at some key in our data object */
            getData: this.getData.bind(this),
            incrementData: this.incrementData.bind(this),
            constrainData: this.constrainData.bind(this),
            /* Method to set global data "key" to "value" */
            setGlobal: this.setGlobal.bind(this),
            /* Method to get the global data stored at a specific key */
            getGlobal: this.getGlobal.bind(this),
            incrementGlobal: this.getData.bind(this),
            constrainGlobal: this.constrainGlobal.bind(this),
            addBind: this.addBind.bind(this),
            updateDisplay: this.updateDisplay.bind(this)
        };
        /* Store the element(s) that we're bound to is attached to */
        this.el = el;
        this.elements = [];
        /* Call our init method to do some initiation logic */
        this._initBind.apply(this, Array.prototype.slice.call(arguments));
    }

    DOMBind.prototype = {
        _initBind: function(el) {
            if (el.constructor === HTMLCollection) {
                this._initCollection.apply(this, Array.prototype.slice.call(arguments));
            } else {
                this._initElement.apply(this, Array.prototype.slice.call(arguments));
            }

            this.data.init();
        },
        _initElement: function(el, data, noInit) {
            var i;
            for (i in el.dataset) {
                if (bannedData.indexOf(i) === -1) {
                    this.data[i] = el.dataset[i];
                }
            }

            for (i in data) {
                if (!data.hasOwnProperty(i) ||
                    !data[i].toString ||
                    !data[i].constructor ||
                    (this.data.hasOwnProperty(i) &&
                     this.data[i].constructor === Function &&
                     data[i].constructor !== Function) ||
                    bannedData.indexOf(i) !== -1) {
                    continue;
                }
                if (data[i].constructor === Function) {
                    data[i] = data[i].bind(this);
                }
                this.data[i] = data[i];
            }

            this.elements.push(el);

            if (!noInit) {
                this.data.init();
                this.data.updateDisplay();
            }
        },
        _initCollection: function(els, data) {
            for (var i = 0; i < els.length; i ++) {
                this._initElement(els[i], data, true);
            }
            this.data.init();
            this.data.updateDisplay();
        },
        addBind: function(el) {
            this.elements.push(el);
            this._updateDisplayEl(el);
        },
        _updateDisplayEl: function(toUpdate) {
            if (typeof toUpdate === "undefined") {
                return;
            }
            var el;
            if (toUpdate.textContent !== undefined) {
                el = toUpdate;
            } else if (toUpdate >= 0 && toUpdate < this.elements.length) {
                el = this.elements[toUpdate];
            } else {
                return;
            }

            if (!el.dataset[rawContentKey]) {
                el.dataset[rawContentKey] = el.textContent;
            }
            el.textContent = el.dataset[rawContentKey]
                .replace(/\{\{(.+?)\}\}/g, parseContent.bind(this));
        },
        updateDisplay: function() {
            for (var i = 0; i < this.elements.length; i ++) {
                this._updateDisplayEl(i);
            }
        },
        getData: function(key) {
            /* Return whatever data is stored in "key" on our data object */
            return this.data[key];
        },
        setData: function(key, value, noUpdate) {
            /* Set data "key" on the data object of this Scrubber to "value" */
            this.data[key] = value;
            /* Refresh our content unless the developer has specified otherwise */
            if (!noUpdate) {
                this.updateDisplay();
            }
            return value;
        },
        incrementData: function(key, amount, noUpdate) {
            return this.setData(key, this.getData(key) + amount, noUpdate);
        },
        constrainData: function(key, min, max, noUpdate) {
            var val = this.getData(key);
            if (val < min) {
                val = min;
                return this.setData(key, val, noUpdate);
            } else if (val > max) {
                val = max;
                return this.setData(key, val, noUpdate);
            }
            return val;
        },
        getGlobal: function(key) {
            /* Return the global data stored in "key" */
            return this.data.globals[key];
        },
        setGlobal: function(key, value, noUpdate) {
            /* Set global data "key" to "value" */
            this.data.globals[key] = value;
            /* Refresh our content unless the developer has specified otherwise */
            if (!noUpdate) {
                this.updateDisplay();
            }
            return value;
        },
        incrementGlobal: function(key, amount, noUpdate) {
            return this.setGlobal(key, this.getGlobal(key) + amount, noUpdate);
        },
        constrainGlobal: function(key, min, max, noUpdate) {
            var val = this.getGlobal(key);
            if (val < min) {
                val = min;
                return this.setGlobal(key, val, noUpdate);
            } else if (val > max) {
                val = max;
                return this.setGlobal(key, val, noUpdate);
            }
        }
    };

    DOMBind.globals = {};

    window.DOM.Bind = DOMBind;
})();
