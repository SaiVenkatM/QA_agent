import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";


import { Button } from "@components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { Adb } from "@yume-chan/adb";
import { TapComponent } from "./actionComponents/tapComponent";


import { ACTION_TYPE, StepRecreation, actionFromString, prettyStringFromAction, stringFromAction } from "~/lib/testUtils/stepObject";
import { ActionController } from "~/lib/testUtils/actionController";
import { ScrollComponent } from "./actionComponents/scrollComponent";

// export this type to scroll and tap so we can use useRef to interact with their inner functions
export type RunRef = {
  run: () => void;
}

export const supportedSteps = {
  "Choose an Action": undefined,
  Tap: ACTION_TYPE.TAP,
  Scroll: ACTION_TYPE.SCROLL,
};

export type StepContainerProps = {
  order: number;
  adb: Adb | undefined;
  actionController: ActionController | undefined;
  addStepAfter: Function;
  deleteStep: Function;
  stepRecreation: StepRecreation;
  startTestList: boolean[]
  setStartTestList: Dispatch<SetStateAction<boolean[]>>
};

export function StepContainer(props: StepContainerProps) {

  // set this to the type we find inside of stepRecreation
  const [action, setAction] = useState<ACTION_TYPE | undefined>(
    props.stepRecreation.actionStepInfo?.actionType
  );

  // a little funky logic so the select behaves as expected
  function selectAction(choice: string) {
    let action = actionFromString(choice)
    setAction(action)
    console.log(action);
  }

  // this is the part that runs the execute function inside of the tap component
  const RunRef = useRef<RunRef>(null);

  // to execute the run function of the child component ( action component )
  const executeChild = () => {
    RunRef.current?.run();
  }


  //TODO: make this logic clearer lmfao :sob:

  // logic to determine if we should run test
  if (props.startTestList[props.order] 
    // if whatever is next is false
  && !props.startTestList[props.order + 1] 
    // and whatever is next is not undefined
  && props.startTestList[props.order + 1] !== undefined) {
  
    // we can execute
    executeChild()

    // set timeout just to make sure that it fully registers
    setTimeout(() => {

      props.setStartTestList(prevStartTestList => {
      return [
        ...prevStartTestList.slice(0, props.order + 1),
        true,
        ...prevStartTestList.slice(props.order + 2)]})

    }, 3000)
    
  }
  
  // if the next step is undefined ( we are at the last step)
  if (props.startTestList[props.order] 
  && props.startTestList[props.order + 1] === undefined) {
    executeChild()

    console.log("reset list", props.startTestList)
    props.setStartTestList(Array(props.startTestList.length).fill(false))
  }


  // based off the type of action from stepRecreation, we can insert the desired action component type here
  function returnActionComponent() {
    switch (action) {
      case ACTION_TYPE.TAP:
        return <TapComponent ref={RunRef} {...props} />;
      case ACTION_TYPE.SCROLL:
        return <ScrollComponent ref={RunRef} {...props} />;
      default:
        return <></>;
    }
  }

  return (
    <div className="p-8 pl-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Action Type</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Select onValueChange={(value) => {
                  selectAction(value)
                }} >
                  <SelectTrigger id="framework">
                    {(action === undefined) ?
                      <SelectValue placeholder="Select" />
                      :
                      <SelectValue defaultValue={stringFromAction(action)} placeholder={prettyStringFromAction(action)} />

                    }
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={stringFromAction(ACTION_TYPE.TAP)}>{prettyStringFromAction(ACTION_TYPE.TAP)}</SelectItem>
                    <SelectItem value={stringFromAction(ACTION_TYPE.SCROLL)}>{prettyStringFromAction(ACTION_TYPE.SCROLL)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
          {
            returnActionComponent()
          }

        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex ">
            <Button onClick={() => {
              props.deleteStep(props.order)
            }} className="text-red-400 font-bold">Delete Step</Button>
            <div className="w-8" />
            <Button onClick={() => {
              props.addStepAfter(props.order)
            }}>New Step</Button>
          </div>
          <Button onClick={executeChild} className="text-green-400 font-bold">Run Step</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
