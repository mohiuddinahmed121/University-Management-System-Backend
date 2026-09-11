import { z } from "zod";

export const SubmitResultValidationZodSchema = z.object({
   registrationId: z.string().min(1, "Registration Id Is Required"),
   marks: z
      .number("Marks Must Be A Number")
      .min(0, "Marks Cannot Be Less Than 0")
      .max(100, "Marks Cannot Be Greater Than 100"),
});

export const UpdateResultValidationZodSchema = z.object({
   marks: z
      .number("Marks Must Be A Number")
      .min(0, "Marks Cannot Be Less Than 0")
      .max(100, "Marks Cannot Be Greater Than 100"),
});
