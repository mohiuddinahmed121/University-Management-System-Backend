import { z } from "zod";

export const CreateCourseValidationZodSchema = z.object({
   code: z.string().trim().min(2, "Course Code Is Required"),

   title: z.string().trim().min(2, "Course Title Is Required"),

   description: z.string().trim().optional(),

   credit: z.number("Credit Must Be A Number").positive("Credit Must Be Greater Than 0"),

   departmentId: z.string().min(1, "Department Id Is Required"),
});

export const UpdateCourseValidationZodSchema = z.object({
   code: z.string().trim().min(2, "Course Code Is Required").optional(),

   title: z.string().trim().min(2, "Course Title Is Required").optional(),

   description: z.string().trim().optional(),

   credit: z.number("Credit Must Be A Number").positive("Credit Must Be Greater Than 0").optional(),

   departmentId: z.string().min(1, "Department Id Is Required").optional(),
});

export const CreateCoursePrerequisiteValidationZodSchema = z.object({
   prerequisiteCourseId: z.string().min(1, "Prerequisite Course Id Is Required"),
});
