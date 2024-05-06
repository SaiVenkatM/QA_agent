import { ActionController } from "./actionController";

//NOTE: this holds the like component state for each step?, 
//like you can construct one of these when you want the 
//component to interact withh the phone, and set things up here

// some useful enums
export enum ACTION_TYPE {
    TAP,
    TYPE,
    SCROLL,
    AI_CHECK,
    AI_ACTION,
    MODULE
}


export enum SCROLL_DIRECTION {
    LEFT,
    RIGHT,
    UP,
    DOWN,
    CUSTOM
}


export enum TAP_TYPE {
    SINGLE_TAP,
    DOUBLE_TAP,
    HOLD,
}



export type StepRecreation = {
    id: string;
    actionStepInfo: TapInfo | ScrollInfo | undefined

}

type StepInfo = {
    // maybe add action type here instead?
    description: string,
    actionType: ACTION_TYPE
}

export type TapInfo = StepInfo & {
    tapType: TAP_TYPE
}
export type ScrollInfo = StepInfo & {
    scrollDirection: SCROLL_DIRECTION
}



//NOTE: these store the object info for the steps
class StepObject {
    actionType: ACTION_TYPE;
    actionController: ActionController

    constructor(actionType: ACTION_TYPE, actionController: ActionController) {
        this.actionType = actionType;
        this.actionController = actionController;

    }

}



export class TapStep extends StepObject {
    cords: { x: number, y: number };
    tapType: TAP_TYPE;
    description: string;

    constructor(TapStepConstructor: {
        x_cord: number
        y_cord: number,
        description: string,
        tapType: TAP_TYPE,
        actionController: ActionController,
    }) {
        super(ACTION_TYPE.TAP, TapStepConstructor.actionController);

        this.cords = { x: TapStepConstructor.x_cord, y: TapStepConstructor.y_cord }
        this.tapType = TapStepConstructor.tapType
        this.description = TapStepConstructor.description;
    }


    execute() {
        //TODO: need to have support for multiple action types
        this.actionController.tap({ x_cord: this.cords.x, y_cord: this.cords.y })
    }

    serialize() {
        // to convert this into a json storable string
        //NOTE: could error as tapType is an enum?
        return JSON.stringify({
            action: this.actionType,
            description: this.description,
            tapType: this.tapType,
        })
    }

}

export class ScrollStep extends StepObject {

    cords: { x: number, y: number };
    scrollDirection: SCROLL_DIRECTION;
    description: string;

    constructor(ScrollStepConstructor: {
        x_cord: number,
        y_cord: number,
        description: string,
        scrollDirection: SCROLL_DIRECTION,
        actionController: ActionController
    }) {
        super(ACTION_TYPE.SCROLL, ScrollStepConstructor.actionController);
        this.cords = { x: ScrollStepConstructor.x_cord, y: ScrollStepConstructor.y_cord };
        this.scrollDirection = ScrollStepConstructor.scrollDirection;
        this.description = ScrollStepConstructor.description;
    }

    execute() {
        let strengths: {
            x: number,
            y: number
        } = { x: 0, y: 0 }

        switch (this.scrollDirection) {
            case SCROLL_DIRECTION.UP:
                //TODO: im unsure how these work, need to text
                strengths = { x: 0, y: 1 }
                break;
            case SCROLL_DIRECTION.DOWN:
                strengths = { x: 0, y: -1 }
                break;
            //TODO: right and left scrolling doesnt work 
            case SCROLL_DIRECTION.RIGHT:
                strengths = { x: 1, y: 0 }
                break;
            case SCROLL_DIRECTION.DOWN:
                strengths = { x: -1, y: 0 }
                break;
        }

        this.actionController.scroll({
            x_cord: this.cords.x,
            y_cord: this.cords.y,
            x_strength: strengths.x,
            y_strength: strengths.y
        })
    }

    serialize() {
        // to convert this into a json storable string
        return JSON.stringify({
            action: this.actionType,
            description: this.description,
            scrollDirection: this.scrollDirection,
        })
    }
}

//TODO: NEED to write more as we create more steps



// some useful methods, dw abt these
export function scrollDirectionFromString(direction: string): SCROLL_DIRECTION {
    switch (direction) {
        case "LEFT": return SCROLL_DIRECTION.LEFT;
        case "RIGHT": return SCROLL_DIRECTION.RIGHT;
        case "UP": return SCROLL_DIRECTION.UP;
        case "DOWN": return SCROLL_DIRECTION.DOWN;
        case "CUSTOM": return SCROLL_DIRECTION.CUSTOM;
        default: throw new Error("Given string is not correlated with a scroll direction");
    }
}

export function stringFromScrollDirection(direction: SCROLL_DIRECTION): string {
    switch (direction) {
        case SCROLL_DIRECTION.LEFT: return "LEFT";
        case SCROLL_DIRECTION.RIGHT: return "RIGHT";
        case SCROLL_DIRECTION.UP: return "UP";
        case SCROLL_DIRECTION.DOWN: return "DOWN";
        case SCROLL_DIRECTION.CUSTOM: return "CUSTOM";
        default: throw new Error("Given scroll direction is not recognized");
    }
}

export function prettyStringFromScrollDirection(direction: SCROLL_DIRECTION): string {
    switch (direction) {
        case SCROLL_DIRECTION.LEFT: return "Left";
        case SCROLL_DIRECTION.RIGHT: return "Right";
        case SCROLL_DIRECTION.UP: return "Up";
        case SCROLL_DIRECTION.DOWN: return "Down";
        case SCROLL_DIRECTION.CUSTOM: return "Custom";
        default: throw new Error("Given scroll direction is not recognized");
    }
}

export function actionFromString(action: string) {
    switch (action) {
        case "TAP": return ACTION_TYPE.TAP
        case "TYPE": return ACTION_TYPE.TYPE
        case "SCROLL": return ACTION_TYPE.SCROLL
        case "AI_CHECK": return ACTION_TYPE.AI_CHECK
        case "AI_ATION": return ACTION_TYPE.AI_ACTION
        case "MODULE": return ACTION_TYPE.MODULE
        default: throw new Error("given string is not correlated with an action")
    }
}

export function stringFromAction(action: ACTION_TYPE): string {
    switch (action) {
        case ACTION_TYPE.TAP: return "TAP";
        case ACTION_TYPE.TYPE: return "TYPE";
        case ACTION_TYPE.SCROLL: return "SCROLL";
        case ACTION_TYPE.AI_CHECK: return "AI_CHECK";
        case ACTION_TYPE.AI_ACTION: return "AI_ACTION";
        case ACTION_TYPE.MODULE: return "MODULE";
        default: throw new Error("Given action type is not recognized");
    }
}

export function prettyStringFromAction(action: ACTION_TYPE): string {
    switch (action) {
        case ACTION_TYPE.TAP: return "Tap";
        case ACTION_TYPE.TYPE: return "Type";
        case ACTION_TYPE.SCROLL: return "Sroll";
        case ACTION_TYPE.AI_CHECK: return "AI Check";
        case ACTION_TYPE.AI_ACTION: return "AI Action";
        case ACTION_TYPE.MODULE: return "Module";
        default: throw new Error("Given action type is not recognized");
    }
}

export function tapTypeFromString(tapType: string): TAP_TYPE {
    switch (tapType) {
        case "SINGLE_TAP": return TAP_TYPE.SINGLE_TAP;
        case "DOUBLE_TAP": return TAP_TYPE.DOUBLE_TAP;
        case "HOLD": return TAP_TYPE.HOLD;
        default: throw new Error("Given string is not correlated with a tap type");
    }
}

export function stringFromTapType(tapType: TAP_TYPE): string {
    switch (tapType) {
        case TAP_TYPE.SINGLE_TAP: return "SINGLE_TAP";
        case TAP_TYPE.DOUBLE_TAP: return "DOUBLE_TAP";
        case TAP_TYPE.HOLD: return "HOLD";
        default: throw new Error("Given tap type is not recognized");
    }
}

export function prettyStringFromTapType(tapType: TAP_TYPE): string {
    switch (tapType) {
        case TAP_TYPE.SINGLE_TAP: return "Single Tap";
        case TAP_TYPE.DOUBLE_TAP: return "Double Tap";
        case TAP_TYPE.HOLD: return "Hold";
        default: throw new Error("Given tap type is not recognized");
    }
}
