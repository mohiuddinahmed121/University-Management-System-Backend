import { z } from "zod";

export const CreateSectionValidationZodSchema = z.object({
   sectionName: z.string().trim().min(1, "Section Name Is Required"),

   capacity: z
      .number("Capacity Must Be A Number")
      .int("Capacity Must Be An Integer")
      .min(1, "Capacity Must Be At Least 1"),

   courseId: z.string().min(1, "Course Id Is Required"),

   semesterId: z.string().min(1, "Semester Id Is Required"),

   instructorId: z.string().min(1, "Instructor Id Is Required").optional(),
});

export const UpdateSectionValidationZodSchema = z.object({
   sectionName: z.string().trim().min(1, "Section Name Is Required").optional(),

   capacity: z
      .number("Capacity Must Be A Number")
      .int("Capacity Must Be An Integer")
      .min(1, "Capacity Must Be At Least 1")
      .optional(),

   instructorId: z.string().min(1, "Instructor Id Is Required").optional(),
});
