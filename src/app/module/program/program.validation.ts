import { z } from "zod";

export const CreateProgramValidationZodSchema = z.object({
   name: z.string().trim().min(2, "Program Name Is Required"),

   code: z.string().trim().min(2, "Program Code Is Required"),

   description: z.string().trim().optional(),

   durationYears: z
      .number("Duration Must Be A Number")
      .int("Duration Must Be An Integer")
      .min(1, "Duration Must Be At Least 1 Year"),

   departmentId: z.string().min(1, "Department Id Is Required"),
});

export const UpdateProgramValidationZodSchema = z.object({
   name: z.string().trim().min(2, "Program Name Is Required").optional(),

   code: z.string().trim().min(2, "Program Code Is Required").optional(),

   description: z.string().trim().optional(),

   durationYears: z
      .number("Duration Must Be A Number")
      .int("Duration Must Be An Integer")
      .min(1, "Duration Must Be At Least 1 Year")
      .optional(),

   departmentId: z.string().min(1, "Department Id Is Required").optional(),
});
