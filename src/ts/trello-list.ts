/** Represents an individual list in Trello. Observes the list for changes. */
class TrelloList {
    public readonly listNode: Element;
    private listContentNode: Element;
    private listObserver: MutationObserver;
    private listHeaderNode: Element;
    private listHeaderObserver: MutationObserver;
    private minCards: number = -1;
    private maxCards: number = Number.POSITIVE_INFINITY;
    private exepColors: string = null; // modif. by Max
    private wipLimitPattern: RegExp = /\[(\d+)(?:-(\d+))?( +\w+)?\]/; // modif. by Max

    constructor(listNode: Element) {
        this.listNode = listNode;
        this.listObserver = new MutationObserver(this.observeListChanges);
        this.listObserver.observe(this.listNode, { childList: true, subtree: true });

        this.listHeaderNode = this.listNode.querySelector("h2.list-header-name-assist");
        this.listHeaderObserver = new MutationObserver(this.observeListHeaderChanges);
        this.listHeaderObserver.observe(this.listHeaderNode, { childList: true });

        this.listContentNode = this.listNode.querySelector(".js-list-content");

        this.processListTitle();
    }

    /** Applies the card limit via CSS */
    public applyCardLimit() {
        const classList = this.listContentNode.classList;

        classList.remove("over-limit");
        classList.remove("at-limit");
        
        // exception cards by Max
        let colorName=null;
        let exCardCount=0; 
        if (this.exepColors !=null){
        for (let  i=0; i<this.exepColors.length; i++){           
            switch (this.exepColors.substr(i,1)){
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
            if (colorName != null){
                exCardCount= exCardCount + this.listContentNode.querySelectorAll("span.card-label-"+ colorName).length;
            }
        }        
    }
   
        const cardCountList = this.listContentNode.querySelectorAll("a.list-card").length;
        const cardCount=cardCountList - exCardCount;        
        if (cardCount > this.maxCards || cardCount < this.minCards) {
            classList.add("over-limit");
        }

        if (cardCount === this.maxCards || cardCount === this.minCards) {
                classList.add("at-limit");
        }
    }

    /** Determines whether the provided element represents a Trello Card */
    private isListCard(element: Element): boolean {
        return element.classList.contains("list-card");
    }

    // Mod. by Max
    /** Determines whether the provided element represents a Card Label */ 
    private isLabelCard(element: Element): boolean {
        return element.classList.contains("card-label");
    }

    /** MutationObserver callback for changes to the list title */
    private observeListHeaderChanges = (mutations: MutationRecord[]) => {
        this.processListTitle();
        this.applyCardLimit();
    }
    
    // Mod. by Max
    /** MutationObserver callback for changes to the list */
    private observeListChanges = (mutations: MutationRecord[]) => {
        let cardAddedOrRemoved = false;
        let labelAddedOrRemoved = false;

        for (const mutation of mutations) {
            for (const entry of [].slice.call(mutation.addedNodes)) {
                if (entry instanceof Element && this.isListCard(entry)) {
                    cardAddedOrRemoved = true;
                    break;
                }
            }

            for (const entry of [].slice.call(mutation.removedNodes)) {
                if (entry instanceof Element && this.isListCard(entry)) {
                    cardAddedOrRemoved = true;
                    break;
                }
            }
            // card-label
            for (const entry of [].slice.call(mutation.addedNodes)) {
                if (entry instanceof Element && this.isLabelCard(entry)) {
                    labelAddedOrRemoved = true;
                    break;
                }
            }

            for (const entry of [].slice.call(mutation.removedNodes)) {
                if (entry instanceof Element && this.isLabelCard(entry)) {
                    labelAddedOrRemoved = true;
                    break;
                }
            }
        }

        if (cardAddedOrRemoved || labelAddedOrRemoved) {
            this.applyCardLimit();
        }
    }

    /** Parse the list title text and attempts to extract the min/max card count */  // modif. by Max
    private parseListTitle(listTitle: string): [number, number, string] {
        const matches = this.wipLimitPattern.exec(listTitle);
        if (!matches || matches.length !== 4) {
            return [-1, Number.POSITIVE_INFINITY, null];
        }
        // ex. [1-6 #g]
        if (matches[1] && matches[2] && matches[3]) {
            return [Number(matches[1]), Number(matches[2]), String (matches[3])];
        }
        // ex. [1 #g]
            else if (matches[1] && !matches[2] && matches[3]) {                 
                return [-1, Number(matches[1]), String (matches[3])];
            }            
        // ex. [1-6]    
            else if (matches[1] && matches[2] && !matches[3]) {                
            return [Number(matches[1]), Number(matches[2]), null];
                }
                //ex. [1]
                else {
                                        return [-1, Number(matches[1]), null];
        }
        
    }

    private processListTitle() { // modif. by Max
        const listTitle = this.listHeaderNode.textContent;
        const limits = this.parseListTitle(listTitle);
        this.minCards = limits[0];
        this.maxCards = limits[1];
        if (limits[2]){
        this.exepColors = limits[2].match(/\w+/)[0];        
    }
        else{
            this.exepColors=null;
        }
        
    }
}
