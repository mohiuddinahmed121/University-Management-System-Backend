import { z } from "zod";

export const CreateSemesterValidationZodSchema = z
   .object({
      name: z.string().trim().min(2, "Semester Name Is Required"),

      year: z
         .number("Year Must Be A Number")
         .int("Year Must Be An Integer")
         .min(2000, "Invalid Semester Year"),

      startDate: z.coerce.date("Invalid Start Date"),

      endDate: z.coerce.date("Invalid End Date"),

      feeAmount: z
         .number("Fee Amount Must Be A Number")
         .positive("Fee Amount Must Be Greater Than 0"),
   })
   .refine((data) => data.endDate > data.startDate, {
      message: "End Date Must Be After Start Date",
      path: ["endDate"],
   });

export const UpdateSemesterValidationZodSchema = z.object({
   name: z.string().trim().min(2, "Semester Name Is Required").optional(),

   year: z
      .number("Year Must Be A Number")
      .int("Year Must Be An Integer")
      .min(2000, "Invalid Semester Year")
      .optional(),

   startDate: z.coerce.date("Invalid Start Date").optional(),

   endDate: z.coerce.date("Invalid End Date").optional(),

   feeAmount: z
      .number("Fee Amount Must Be A Number")
      .positive("Fee Amount Must Be Greater Than 0")
      .optional(),
});

export const UpdateSemesterStatusValidationZodSchema = z.object({
   status: z.enum(["UPCOMING", "ONGOING", "COMPLETED"]),
});
