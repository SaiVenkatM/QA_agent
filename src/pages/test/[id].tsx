// going to load the test from the slug here
"use client";
import { BIN, VERSION } from "@yume-chan/fetch-scrcpy-server";
import { Adb } from "@yume-chan/adb";
import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { AdbDaemonTransport } from "@yume-chan/adb";
import {
  AdbScrcpyClient,
  AdbScrcpyOptions2_1,
} from "@yume-chan/adb-scrcpy";
import { Consumable, ReadableStream } from "@yume-chan/stream-extra";
import { useState, useRef, Dispatch, SetStateAction, RefObject, useEffect } from "react";
import {
  ACTION_TYPE,
  SCROLL_DIRECTION,
  StepRecreation,
  TAP_TYPE,
  actionFromString,
  scrollDirectionFromString,
  tapTypeFromString,
} from "~/lib/testUtils/stepObject";
import { ScrcpyOptions2_1, ScrcpyVideoCodecId } from "@yume-chan/scrcpy";

import { Button } from "@components/ui/button";
import { WebCodecsDecoder } from "@yume-chan/scrcpy-decoder-webcodecs";
import { ActionController } from "~/lib/testUtils/actionController";
import { StepContainer, RunRef } from "~/components/steps/stepContainer";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useRouter } from "next/router";
import { api } from "~/lib/api";

const CredentialStore = new AdbWebCredentialStore();

// To get past ssr checks (the server ha no window => no document => this will always error with ssr)
let decoder: any;
if (typeof window !== "undefined") {
  decoder = new WebCodecsDecoder(ScrcpyVideoCodecId.H264);
}

// this is the actual video of phone being rendedred
function MobileIframe() {
  // defauly value of true, and we have a setter
  const [loadingIframe, setLoadingIframe] = useState(true);

  return (
    <div id="video-thumbnail" className=" jusitfy-center flex h-[90vh]">
      <div id="screen_video" />
    </div>
  );
}

export default async function ManageTestScreen() {

  const router = useRouter();
  // waits for router to initialize
  useEffect(() => {
    if (!router.isReady) return;
  }, [router.isReady])

  // test id of the test we want to fetch
  const testId = router.query.id![0];

  if (!testId) {
    throw new Error("was not able to read testId")
  }

  // need this ref to show phone screen later
  const ref = useRef(null);

  const [adb, setAdb] = useState<Adb>();
  const [actionController, setActionController] = useState<ActionController>();
  const [deviceName, setDeviceName] = useState("Choose Device");

  // // represents what an example test would look like in json for[
  //   //TODO: the initial step lest is to be reacreated from the query call
  //
  //   {
  //     id: "dawojijdoai",
  //     actionStepInfo: undefined
  //   },
  //   {
  //     id: "doadwoiajd",
  //     actionStepInfo: {
  //       actionType: ACTION_TYPE.TAP,
  //       tapType: TAP_TYPE.SINGLE_TAP,
  //       description: "more things",
  //     },
  //   },
  //   {
  //     id: "daoiwjdowai",
  //     actionStepInfo: {
  //       actionType: ACTION_TYPE.SCROLL,
  //       scrollDirection: SCROLL_DIRECTION.DOWN,
  //       description: "something",
  //     },
  //   },
  // ]

  const [stepsList, setStepsList] = useState<StepRecreation[]>([]);

  const { data: testWithSteps, isLoading } = await api.tests.getTestWithSteps.useQuery({ id: testId });

  //TODO: should redirect to an error page
  if (!testWithSteps) {
    throw new Error("invaid test id, check something")
  }

  //TODO: make this cleaner later
  //

  //NOTE: when someone creates a new test, they should have one undefined step already in the db
    
  //@ts-ignore saying that testswithsteps could be undefined, deal with that later
  function turnIntoStepRecreations(input: typeof testWithSteps.steps) {
    let stepRecreations: StepRecreation[] = []

    for (const step of input) {

      if (step.actionType === null) {
        stepRecreations.push({
          id: step.id,
          actionStepInfo: undefined
        })
      }
      else if (actionFromString(step.actionType) == ACTION_TYPE.SCROLL) {
        stepRecreations.push({
          id: step.id,
          actionStepInfo: {
            description: step.description || "",
            actionType: ACTION_TYPE.SCROLL,
            // going to bang this because the scrolldirection should be required when
            // updating / adding a step with scroll direction
            // TODO: just make sure this always exists lol
            scrollDirection: scrollDirectionFromString(step.scrollDirection!)
          }
        })
      }

      else if (actionFromString(step.actionType) == ACTION_TYPE.TAP) {
        stepRecreations.push({
          id: step.id,
          actionStepInfo: {
            description: step.description || "",
            actionType: ACTION_TYPE.TAP,
            // going to bang this because the scrolldirection should be required when
            // updating / adding a step with scroll direction
            // TODO: just make sure this always exists lol
            tapType: tapTypeFromString(step.tapType!)
          }
        })
      }

      // would need more the more things we add, really need to make this look nicer though, looks so bad
      //
    }

    setStepsList(stepRecreations);
  }




  // holds the start flag for each step container component
  const [startTestList, setStartTestList] = useState<boolean[]>(Array(stepsList.length).fill(false))

  // adds step after the idx specefied
  function addStepAfter(idx: number) {
    //
    //TODO: could query db to create this?

    let newStep: StepRecreation = {
      id: "doaijidajdioa",
      actionStepInfo: undefined
    }

    const newStepsList = [...stepsList.slice(0, idx + 1), newStep, ...stepsList.slice(idx + 1)];
    setStepsList(newStepsList)
  }

  const chooseDevice = async (setDeviceName: any) => {
    //@ts-ignore yeah idk what this is even about
    let [adbReference, actionControllerReference] =
      await connect(setDeviceName);
    setAdb(adbReference);
    setActionController(actionControllerReference);
  };

  async function disconnect() {
    //TODO: make this
  }


  //TODO: make this work
  function runTest() {
    setStartTestList(prevStartTestList => {
      // Update the first element to true and leave other elements unchanged
      return [true, ...prevStartTestList.slice(1)];
    });
    console.log("oduahouwodauw")

  }


  //TODO: make this work
  function deleteStep(idx: number) {
    console.log("asked to delete step", idx)
  }

  return (
    <div className="flex h-screen ">
      <div id="leftHalf" className="w-7/12">
        <div className="flex justify-between pt-5 pl-11">
          <text className="col-span-7 font-sans text-6xl font-bold text-black ">
            Test Name
          </text>
          <div className="flex">
            <Button
              className="col-span-2  text-lg font-bold text-green-300 min-w-56 h-25 mt-2 mr-4"
              onClick={runTest}
            >
              Run Test
            </Button>

            <div className="col-span-1" />

            {!adb ? (
              <Button
                className="col-span-2 h-full text-lg font-bold text-white min-w-56 h-25 mt-2"
                onClick={() => {
                  chooseDevice(setDeviceName);
                }}
              >
                Connect to device
              </Button>
            ) : (
              <Button
                className="col-span-2 h-full text-lg font-bold text-red-500 h-25 mt-2"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>

        <div className="h-8" />
        <ScrollArea className=" h-[80vh]">
          {stepsList.map((step, index) => (
            <div key={index} className="">
              {" "}
              {/* Add margin bottom */}
              <StepContainer
                order={index}
                adb={adb}
                startTestList={startTestList}
                setStartTestList={setStartTestList}
                actionController={actionController}
                addStepAfter={addStepAfter}
                deleteStep={deleteStep}
                stepRecreation={step}
              />
            </div>
          ))}
        </ScrollArea>
      </div>

      <div id="rightHalf" className="flex w-5/12 items-center justify-center">
        <div className="bg-slate-600 flex px-3 py-3 rounded-xl">
          <div id="phone_interface" className="h-[90vh] w-[40.5vh] bg-black">
            {/*@ts-ignore idk why it complaing here*/}
            <MobileIframe ref={ref} />
          </div>
        </div>
      </div>
    </div>
  );

  // this takes in a function that sets the state of the device name
  async function connect(setDeviceName: any): Promise<[Adb, ActionController]> {
    const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;

    const device = await Manager?.requestDevice({
      filters: [
        {
          classCode: 0xff,
          subclassCode: 0x42,
          protocolCode: 1,
        },
      ],
    });

    setDeviceName(device?.name + " " + device?.serial);

    const connection = await device?.connect();

    if (connection === undefined) {
      throw new Error("error with connection");
    }

    const transport = await AdbDaemonTransport.authenticate({
      serial: device!.serial,
      connection,
      credentialStore: CredentialStore,
    });

    const adb = new Adb(transport);

    console.log(VERSION); // 2.1

    const server = await fetch(BIN).then((res) => {
      console.log(res.status);
      return res.arrayBuffer();
    });

    await AdbScrcpyClient.pushServer(
      adb,
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Consumable(new Uint8Array(server)));
          controller.close();
        },
      }),
    );

    let client = await AdbScrcpyClient.start(
      adb,
      "/data/local/tmp/scrcpy-server.jar",
      "2.1",
      new AdbScrcpyOptions2_1(
        new ScrcpyOptions2_1({
          // options
        }),
      ),
    );

    const controlMessageWriter = client?.controlMessageWriter;

    if (!controlMessageWriter) {
      throw new Error("unable to use Client Message Writer");
    }

    // getting device height and stuff
    var clientHeight = 0;
    var clientWidth = 0;

    if (client.videoStream) {
      const { metadata: videoMetadata, stream: videoPacketStream } =
        await client.videoStream;

      if (!(videoMetadata.height && videoMetadata.width)) {
        throw new Error("Cannot access device height specs");
      }

      clientHeight = videoMetadata.height;
      clientWidth = videoMetadata.width;

      //@ts-ignore cant be bothered to deal with document stuff
      document
        .getElementById("video-thumbnail")
        .replaceChild(
          decoder.renderer,
          //@ts-ignore cant be bothered to deal with document stuff
          document.getElementById("screen_video"),
        );

      videoPacketStream.pipeTo(decoder.writable);
    }

    const actionController: ActionController = new ActionController(
      controlMessageWriter,
      clientHeight,
      clientWidth,
    );

    return [adb, actionController];
  }
}
