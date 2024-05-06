import { Adb, AdbFrameBuffer } from "@yume-chan/adb";
import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import { api } from "@lib/api";
import { ActionController } from "~/lib/testUtils/actionController";
import {
  SCROLL_DIRECTION,
  ScrollStep,
  StepRecreation,
  prettyStringFromScrollDirection,
  scrollDirectionFromString,
  stringFromScrollDirection,
} from "~/lib/testUtils/stepObject";

import { RunRef } from "../stepContainer";
import { Label } from "~/components/ui/label";
import { Input } from "@components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
export type ScrollComponentProps = {
  adb: Adb | undefined;
  actionController: ActionController | undefined;
  stepRecreation: StepRecreation;
};



export const ScrollComponent = forwardRef<RunRef, ScrollComponentProps>((props, ref) => {

  // going to save the instance of scroll step
  const [scrollStep, setScrollStep] = useState<ScrollStep>();

  // we set description to the value inside stepRecreation, otherwise ""
  const [description, setDescription] = useState<string>(() => {
    if (!props.stepRecreation.actionStepInfo) {
      return "";
    } else {
      return props.stepRecreation.actionStepInfo.description;
    }
  });

  //same thing here, we use step recreation to get scrollstep, default is down
  const [scrollDirection, setScrollDirection] = useState<
    SCROLL_DIRECTION
  >(() => {
    if (!props.stepRecreation.actionStepInfo)
      return SCROLL_DIRECTION.DOWN;

    //NOTE: check if there is pre-existing data here
    if ("scrollDirection" in props.stepRecreation.actionStepInfo) {
      return props.stepRecreation.actionStepInfo.scrollDirection;
    }

    // this will be the default scroll direction
    return SCROLL_DIRECTION.DOWN;
  });

  // this exposes the run function to the step container, 
  // so they can be called from one place
  useImperativeHandle(ref, () => ({
    run: () => {
      testRun();
    }
  }))

  // this is the main run function, that we would use with the server model
  async function run() {
    if (!scrollDirection) {
      //TODO: Use toats for these!!
      throw new Error("please select proper scroll direction");
    }

    if (!description) {
      throw new Error("Please describle what you want to do");
    }

    if (!props.adb) {
      throw new Error("adb not accessible ");
    }

    if (!props.actionController) {
      throw new Error("action controller not accessible ");
    }

    let screenshot: AdbFrameBuffer = await props.adb.framebuffer();

    let { data, isLoading } = api.makePrediction.predictScroll.useQuery({
      buffer: screenshot,
      elementDescription: description,
    });

    let actionCords = data;

    if (!actionCords) {
      throw new Error("action response error from server");
    }

    setScrollStep(
      new ScrollStep({
        x_cord: actionCords.x,
        y_cord: actionCords.y,
        description: description,
        scrollDirection: scrollDirection,
        actionController: props.actionController,
      }),
    );

    scrollStep?.execute();
  }

  // this is just the test run function since the server cant be used rn
  async function testRun() {
    if (!props.actionController) {
      throw new Error("action controller not found");
    }
    if (!props.adb) {
      throw new Error("adb controller not found");
    }

    setScrollStep(
      new ScrollStep({
        x_cord: 500,
        y_cord: 1000,
        description: "idk lmfao",
        scrollDirection: scrollDirection,
        actionController: props.actionController,
      }),
    );

    scrollStep?.execute();
  }

  
  function selectScrollDirection(direction: string) {
    let directionValue = scrollDirectionFromString(direction);
    setScrollDirection(directionValue);
  }


  function handleDescriptionChange(event: ChangeEvent<HTMLInputElement>) {
    setDescription(event.target.value)
  }


  return (
    <div className=" space-y-4">
      <div className="h-4" />
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="email">Description</Label>
        <Input onChange={handleDescriptionChange} type="email" id="email" placeholder="Scroll ..." />
      </div>

      <Select onValueChange={(value) => {
        selectScrollDirection(value)
      }} >
        <SelectTrigger id="framework">
          {/*TODO: better way to select default thing, surely*/}

          <SelectValue
            defaultValue={stringFromScrollDirection(scrollDirection)}
            placeholder={prettyStringFromScrollDirection(scrollDirection)} />

        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={stringFromScrollDirection(SCROLL_DIRECTION.LEFT)}>{prettyStringFromScrollDirection(SCROLL_DIRECTION.LEFT)}</SelectItem>
          <SelectItem value={stringFromScrollDirection(SCROLL_DIRECTION.RIGHT)}>{prettyStringFromScrollDirection(SCROLL_DIRECTION.RIGHT)}</SelectItem>
          <SelectItem value={stringFromScrollDirection(SCROLL_DIRECTION.UP)}>{prettyStringFromScrollDirection(SCROLL_DIRECTION.UP)}</SelectItem>
          <SelectItem value={stringFromScrollDirection(SCROLL_DIRECTION.DOWN)}>{prettyStringFromScrollDirection(SCROLL_DIRECTION.DOWN)}</SelectItem>
          <SelectItem value={stringFromScrollDirection(SCROLL_DIRECTION.CUSTOM)}>{prettyStringFromScrollDirection(SCROLL_DIRECTION.CUSTOM)}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
})
