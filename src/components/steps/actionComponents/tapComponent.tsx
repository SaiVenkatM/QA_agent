import { Adb, AdbFrameBuffer } from "@yume-chan/adb";
import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import { ActionController } from "~/lib/testUtils/actionController";
import { StepRecreation, TAP_TYPE, TapStep, prettyStringFromTapType, stringFromTapType, tapTypeFromString } from "~/lib/testUtils/stepObject";
import { api } from "@lib/api";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { Label } from "~/components/ui/label";
export type TapComponentProps = {
  adb: Adb | undefined;
  actionController: ActionController | undefined;
  stepRecreation: StepRecreation;
  //Expand as needed
};

import type { RunRef } from "../stepContainer";



// wrap this in a forward ref to expose something inside to parent
export const TapComponent = forwardRef<RunRef, TapComponentProps>((props, ref) => {


  const [tapStep, setTapStep] = useState<TapStep>();

  // this stores the description, we set it to default in stepRecreation
  const [description, setDescription] = useState<string>(() => {
    if (!props.stepRecreation.actionStepInfo) {
      return "";
    } else {
      return props.stepRecreation.actionStepInfo.description;
    }
  });

  //stores taptype, we set to whatever is in stepRecreation, default => single tap
  const [tapType, setTapType] = useState<TAP_TYPE>(() => {
    //
    if (!props.stepRecreation.actionStepInfo) return TAP_TYPE.SINGLE_TAP;

    // if actionstep info is of tap type, then we can use it, we chillen
    if ("tapType" in props.stepRecreation.actionStepInfo) {
      return props.stepRecreation.actionStepInfo.tapType;
    }
    // this will be the default tap type
    return TAP_TYPE.SINGLE_TAP;
  });


  // exposes this function to parent component (stepContainer in our case)
  useImperativeHandle(ref, () => ({
    run: () => {
      testRun();
    }
  }))

  // main run function, we would use this with server
  async function run() {
    if (!tapType) {
      //NOTE: probably want different error checking, just throwing error as of now
      throw new Error("please select tap type");
    }

    if (!description) {
      //NOTE: probably want different error checking, just throwing error as of now
      throw new Error("Please describle what you want to do");
    }

    if (!props.actionController) {
      throw new Error("action controller not found");
    }
    if (!props.adb) {
      throw new Error("adb controller not found");
    }

    let screenshot: AdbFrameBuffer = await props.adb.framebuffer();

    let { data, isLoading } = api.makePrediction.predictTap.useQuery({
      buffer: screenshot,
      elementDescription: description,
    });

    let actionCords = data;

    if (!actionCords) {
      throw new Error("action response error from server");
    }

    setTapStep(
      new TapStep({
        x_cord: actionCords.x,
        y_cord: actionCords.y,
        description: description,
        tapType: tapType,
        actionController: props.actionController,
      }),
    );

    //execute on component
    tapStep?.execute();
  }


  // test run funciton for now
  async function testRun() {

    if (!props.actionController) {
      throw new Error("action controller not found");
    }
    if (!props.adb) {
      throw new Error("adb controller not found");
    }


      let tapStep = new TapStep({
        //TODO: change how the response helpers function works later
        x_cord: 500,
        y_cord: 1100,
        description: "wahooo",
        tapType: TAP_TYPE.SINGLE_TAP,
        actionController: props.actionController,
      });

      tapStep.execute();

  }

  function selectTapType(tap: string) {
    let tapValue = tapTypeFromString(tap);
    setTapType(tapValue)
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLInputElement>) {
    setDescription(event.target.value)
  }

  //TODO: make componenets that set the values
  return (
    <div className=" space-y-4">
      <div className="h-4" />
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="email">Description</Label>
        <Input onChange={handleDescriptionChange} type="email" id="email" placeholder="Tap on ..." />
      </div>

      <Select onValueChange={(value) => {
        selectTapType(value)
      }} >
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">Tap Type</Label>
          <SelectTrigger id="framework">
            {/*TODO: better way to select default thing, surely*/}
            <SelectValue defaultValue={stringFromTapType(tapType)} placeholder={prettyStringFromTapType(tapType)} />
          </SelectTrigger>
        </div>
        <SelectContent position="popper">
          <SelectItem value={stringFromTapType(TAP_TYPE.SINGLE_TAP)}>{prettyStringFromTapType(TAP_TYPE.SINGLE_TAP)}</SelectItem>
          <SelectItem value={stringFromTapType(TAP_TYPE.DOUBLE_TAP)}>{prettyStringFromTapType(TAP_TYPE.DOUBLE_TAP)}</SelectItem>
          <SelectItem value={stringFromTapType(TAP_TYPE.HOLD)}>{prettyStringFromTapType(TAP_TYPE.HOLD)}</SelectItem>
        </SelectContent>
      </Select>
    </div>

  );
})
