var TrelloList = (function () {
    function TrelloList(listNode) {
        var _this = this;
        this.minCards = -1;
        this.maxCards = Number.POSITIVE_INFINITY;
        this.exepColors = null;
        this.wipLimitPattern = /\[(\d+)(?:-(\d+))?( +\w+)?\]/;
        this.observeListHeaderChanges = function (mutations) {
            _this.processListTitle();
            _this.applyCardLimit();
        };
        this.observeListChanges = function (mutations) {
            var cardAddedOrRemoved = false;
            var labelAddedOrRemoved = false;
            for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
                var mutation = mutations_1[_i];
                for (var _a = 0, _b = [].slice.call(mutation.addedNodes); _a < _b.length; _a++) {
                    var entry = _b[_a];
                    if (entry instanceof Element && _this.isListCard(entry)) {
                        cardAddedOrRemoved = true;
                        break;
                    }
                }
                for (var _c = 0, _d = [].slice.call(mutation.removedNodes); _c < _d.length; _c++) {
                    var entry = _d[_c];
                    if (entry instanceof Element && _this.isListCard(entry)) {
                        cardAddedOrRemoved = true;
                        break;
                    }
                }
                for (var _e = 0, _f = [].slice.call(mutation.addedNodes); _e < _f.length; _e++) {
                    var entry = _f[_e];
                    if (entry instanceof Element && _this.isLabelCard(entry)) {
                        labelAddedOrRemoved = true;
                        break;
                    }
                }
                for (var _g = 0, _h = [].slice.call(mutation.removedNodes); _g < _h.length; _g++) {
                    var entry = _h[_g];
                    if (entry instanceof Element && _this.isLabelCard(entry)) {
                        labelAddedOrRemoved = true;
                        break;
                    }
                }
            }
            if (cardAddedOrRemoved || labelAddedOrRemoved) {
                _this.applyCardLimit();
            }
        };
        this.listNode = listNode;
        this.listObserver = new MutationObserver(this.observeListChanges);
        this.listObserver.observe(this.listNode, { childList: true, subtree: true });
        this.listHeaderNode = this.listNode.querySelector("h2.list-header-name-assist");
        this.listHeaderObserver = new MutationObserver(this.observeListHeaderChanges);
        this.listHeaderObserver.observe(this.listHeaderNode, { childList: true });
        this.listContentNode = this.listNode.querySelector(".js-list-content");
        this.processListTitle();
    }
    TrelloList.prototype.applyCardLimit = function () {
        var classList = this.listContentNode.classList;
        classList.remove("over-limit");
        classList.remove("at-limit");
        var colorName = null;
        var exCardCount = 0;
        if (this.exepColors != null) {
            for (var i = 0; i < this.exepColors.length; i++) {
                switch (this.exepColors.substr(i, 1)) {
                    case "g":
                        colorName = "green";
                        break;
                    case "y":
                        colorName = "yellow";
                        break;
                    case "r":
                        colorName = "red";
                        break;
                    case "b":
                        colorName = "blue";
                        break;
                    case "s":
                        colorName = "sky";
                        break;
                    case "l":
                        colorName = "lime";
                        break;
                    case "p":
                        colorName = "pink";
                        break;
                }
                if (colorName != null) {
                    exCardCount = exCardCount + this.listContentNode.querySelectorAll("span.card-label-" + colorName).length;
                }
            }
        }
        var cardCountList = this.listContentNode.querySelectorAll("a.list-card").length;
        var cardCount = cardCountList - exCardCount;
        if (cardCount > this.maxCards || cardCount < this.minCards) {
            classList.add("over-limit");
        }
        if (cardCount === this.maxCards || cardCount === this.minCards) {
            classList.add("at-limit");
        }
    };
    TrelloList.prototype.isListCard = function (element) {
        return element.classList.contains("list-card");
    };
    TrelloList.prototype.isLabelCard = function (element) {
        return element.classList.contains("card-label");
    };
    TrelloList.prototype.parseListTitle = function (listTitle) {
        var matches = this.wipLimitPattern.exec(listTitle);
        if (!matches || matches.length !== 4) {
            return [-1, Number.POSITIVE_INFINITY, null];
        }
        if (matches[1] && matches[2] && matches[3]) {
            return [Number(matches[1]), Number(matches[2]), String(matches[3])];
        }
        else if (matches[1] && !matches[2] && matches[3]) {
            return [-1, Number(matches[1]), String(matches[3])];
        }
        else if (matches[1] && matches[2] && !matches[3]) {
            return [Number(matches[1]), Number(matches[2]), null];
        }
        else {
            return [-1, Number(matches[1]), null];
        }
    };
    TrelloList.prototype.processListTitle = function () {
        var listTitle = this.listHeaderNode.textContent;
        var limits = this.parseListTitle(listTitle);
        this.minCards = limits[0];
        this.maxCards = limits[1];
        if (limits[2]) {
            this.exepColors = limits[2].match(/\w+/)[0];
        }
        else {
            this.exepColors = null;
        }
    };
    return TrelloList;
}());
var TrelloWipExtension = (function () {
    function TrelloWipExtension() {
        var _this = this;
        this.trelloLists = [];
        this.observeBoard = function (mutations) {
            for (var _i = 0, mutations_2 = mutations; _i < mutations_2.length; _i++) {
                var mutation = mutations_2[_i];
                for (var _a = 0, _b = [].slice.call(mutation.addedNodes); _a < _b.length; _a++) {
                    var entry = _b[_a];
                    if (entry instanceof Element && _this.isListNode(entry)) {
                        var trelloList = new TrelloList(entry);
                        _this.trelloLists.push(trelloList);
                    }
                }
                for (var _c = 0, _d = [].slice.call(mutation.removedNodes); _c < _d.length; _c++) {
                    var entry = _d[_c];
                    if (entry instanceof Element && _this.isListNode(entry)) {
                        for (var i = _this.trelloLists.length - 1; i >= 0; i--) {
                            if (_this.trelloLists[i].listNode === entry) {
                                _this.trelloLists.splice(i, 1);
                            }
                        }
                    }
                }
            }
        };
        this.observeContent = function (mutations) {
            for (var _i = 0, mutations_3 = mutations; _i < mutations_3.length; _i++) {
                var mutation = mutations_3[_i];
                for (var _a = 0, _b = [].slice.call(mutation.addedNodes); _a < _b.length; _a++) {
                    var entry = _b[_a];
                    if (entry instanceof Element && _this.isBoardWrapper(entry)) {
                        _this.initializeBoard();
                        return;
                    }
                }
            }
        };
        this.contentNode = document.querySelector("#content");
        if (!this.contentNode) {
            return;
        }
        this.contentObserver = new MutationObserver(this.observeContent);
        this.contentObserver.observe(this.contentNode, { childList: true });
        this.initializeBoard();
    }
    TrelloWipExtension.prototype.initializeBoard = function () {
        this.boardNode = document.querySelector("#board");
        if (!this.boardNode) {
            return;
        }
        this.boardObserver = new MutationObserver(this.observeBoard);
        this.boardObserver.observe(this.boardNode, { childList: true });
        var listNodes = document.querySelectorAll("#board .js-list");
        for (var _i = 0, _a = [].slice.call(listNodes); _i < _a.length; _i++) {
            var listNode = _a[_i];
            var trelloList = new TrelloList(listNode);
            this.trelloLists.push(trelloList);
            trelloList.applyCardLimit();
        }
    };
    TrelloWipExtension.prototype.isListNode = function (element) {
        return element.classList.contains("js-list");
    };
    TrelloWipExtension.prototype.isBoardWrapper = function (element) {
        return element.classList.contains("board-wrapper");
    };
    return TrelloWipExtension;
}());
var extension = new TrelloWipExtension();
