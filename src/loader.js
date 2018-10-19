LoadState = function(url, callback, AsyncLoader) {
    this.url = url;
    this.request = new XMLHttpRequest();
    this.request.open("GET", url);
    this.callback = callback;
    var this_ = this;
    this.request.onreadystatechange = function() {
        if (this_.request.readyState == 4) {
            this_.AsyncLoader.remove(this);
            this_.callback.call(undefined, this_.request.responseText);
        }
    };
    this.AsyncLoader = AsyncLoader;
};

LoadState.prototype = {
    constructor: LoadState,
    start: function() {
        this.request.send();
    }
};

LoadImage = function(url, callback, AsyncLoader) {
    this.url = url;
    this.image = new Image();
    this.callback = callback;
    var this_ = this;
    this.image.onload = function() {
        this_.AsyncLoader.remove(this);
        this_.callback.call(undefined, this_.image);
    };
    this.AsyncLoader = AsyncLoader;
};

LoadImage.prototype = {
    constructor: LoadState,
    start: function() {
        this.image.src = this.url;
    }
};

AsyncLoader = function() {
    this.pending = [];
};

AsyncLoader.prototype = {
    constructor: AsyncLoader,
    load: function(url, callback) {
        var obj = new LoadState(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loadImage: function(url, callback) {
        var obj = new LoadImage(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loaded: function() {
        if (this.pending.length > 0) return false;
        else return true;
    },
    remove: function(obj) {
        if (this.pending.length > 1)
            this.pending[obj.index] = this.pending[this.pending.length - 1];
        this.pending.pop();
    }
};
