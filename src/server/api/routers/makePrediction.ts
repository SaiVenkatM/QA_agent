import { z } from "zod";

import axios from "axios";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { AdbFrameBuffer } from "@yume-chan/adb";

import { createCanvas } from "canvas";
import fs from "fs";

import responseHelpers from "@/lib/testUtils/responseHelpers";


//NOTE: what we could do, if this doesnt work, 
//is host inside docker container on uni grounds 
//so that way the server always has access to the model

const uint8ArrayValidator = (value: unknown): value is Uint8Array => {
  return value instanceof Uint8Array;
};


// type that the frame buffer will be in
const AdbFrameBufferSchema = z.object({
  bpp: z.number(),
  size: z.number(),
  width: z.number(),
  height: z.number(),
  red_offset: z.number(),
  red_length: z.number(),
  blue_offset: z.number(),
  blue_length: z.number(),
  green_offset: z.number(),
  green_length: z.number(),
  alpha_offset: z.number(),
  alpha_length: z.number(),
  data: z.custom(uint8ArrayValidator),
});

export const predictionRouter = createTRPCRouter({

  predictTap: publicProcedure
    .input(
      z.object({
        buffer: AdbFrameBufferSchema,
        elementDescription: z.string(),
      }),
    )
    .query(async ({ input }) => {
      //@ts-ignore okay i just know for a fact that the type is right, dw
      let imageFile = convertToPNG(input.buffer);

      const result = await axios.postForm(
        env.MODEL_ROOT_URL + "/run_inference",
        {
          imageFile: imageFile,
          prompt: `bounding box coordinates [[x0, y0, x1, y1]] of ${input.elementDescription.replace(".", "")}`,
          conv_data: "[]",
        },
      );

      //TODO: Not actually sure if this is the correct type xd
      const actionResponse: string = result["data"]["response"];

      //TODO: yeah im fully unsure how this whole area is supposed to go
      let cordsArr = responseHelpers.parseCoordinatesFromBoundingBox(
        actionResponse,
        input.buffer.width,
        input.buffer.height,
      );

      return cordsArr;
    }),

  predictScroll: publicProcedure
    .input(
      z.object({
        buffer: AdbFrameBufferSchema,
        elementDescription: z.string(),
        //NOTE: do we even need this?
        // direction: z.nativeEnum(SCROLL_DIRECTION),
      }),
    )

    .query(async ({ input }) => {
      //@ts-ignore okay i just know for a fact that the type is right, dw
      let imageFile = convertToPNG(input.buffer);

      const result = await axios.postForm(
        env.MODEL_ROOT_URL + "/run_inference",
        {
          imageFile: imageFile,
          prompt: `bounding box coordinates [[x0, y0, x1, y1]] of ${input.elementDescription.replace(".", "")}`,
          conv_data: "[]",
        },
      );
      const actionResponse: string = result["data"]["response"];

      let cordsArr = responseHelpers.parseCoordinatesFromBoundingBox(
        actionResponse,
        input.buffer.width,
        input.buffer.height,
      );

      return cordsArr;
    }),
});

// helper function to convert a frame buffer into a png, which is what the model wants
async function convertToPNG(frameBuffer: AdbFrameBuffer) {
  // Create a new canvas using the 'canvas' library
  const canvas = createCanvas(frameBuffer.width, frameBuffer.height);
  const context = canvas.getContext("2d");

  // Create an ImageData object from the frameBuffer data
  const imageData = new ImageData(
    new Uint8ClampedArray(frameBuffer.data),
    frameBuffer.width,
    frameBuffer.height,
  );

  // Put the image data onto the canvas
  context.putImageData(imageData, 0, 0);

  // Get the buffer representation of the canvas
  const buffer = canvas.toBuffer("image/png");

  // Write the buffer data to a file
  const fileName = "imageFile.png";
  const filePath = `./${fileName}`;
  fs.writeFileSync(filePath, buffer);

  // Create a File object from the buffer data
  const file = new File([buffer], fileName, { type: "image/png" });

  // Return the File object and the original frameBuffer data
  return file;
}
