import { AndroidMotionEventAction, AndroidMotionEventButton, ScrcpyControlMessageWriter, ScrcpyPointerId } from "@yume-chan/scrcpy";

//NOTE: handles the barebones interactions with the phone, any new features should be implemented and tested here first, make sure to implement things very primitively
export class ActionController {
  controller: ScrcpyControlMessageWriter;

  screenHeight: number;
  screenWidth: number;


  constructor(controller: ScrcpyControlMessageWriter, height: number, width: number) {
    this.controller = controller;
    this.screenHeight = height;
    this.screenWidth = width;
  }


  scroll(scroll_info: { x_cord: number, y_cord: number, x_strength: number, y_strength: number }) {

    //TODO: could look into a [pressdown, move, release] form of scrolling
    let scroll_object = {
      pointerX: scroll_info.x_cord,
      pointerY: scroll_info.y_cord,
      screenHeight: this.screenHeight,
      screenWidth: this.screenWidth,
      scrollX: scroll_info.x_strength,
      scrollY: scroll_info.y_strength,
      buttons: 0
    }

    this.controller.injectScroll(scroll_object)
  }


  tap(tap_info: { x_cord: number, y_cord: number }) {

    // tap down
    this.controller.injectTouch({
      action: AndroidMotionEventAction.Down,
      pointerX: tap_info.x_cord,
      pointerY: tap_info.y_cord,
      screenHeight: this.screenHeight,
      screenWidth: this.screenWidth,
      pointerId: ScrcpyPointerId.Finger,
      pressure: 0,
      actionButton: AndroidMotionEventButton.Primary,
      //@ts-ingore this should be working, idk why it isnt
      type: 1
    })

    // lift bak p
    this.controller.injectTouch({
      action: AndroidMotionEventAction.Up,
      pointerX: tap_info.x_cord,
      pointerY: tap_info.y_cord,
      screenHeight: this.screenHeight,
      screenWidth: this.screenWidth,
      pointerId: ScrcpyPointerId.Finger,
      pressure: 0,
      actionButton: AndroidMotionEventButton.Primary,
      //@ts-ingore this should be working, idk why it isnt
      type: 1
    })
  }

}
