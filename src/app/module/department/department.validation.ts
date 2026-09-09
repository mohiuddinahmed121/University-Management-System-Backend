import { z } from "zod";

export const CreateDepartmentValidationZodSchema = z.object({
   name: z.string().trim().min(2, "Department Name Is Required"),

   code: z.string().trim().min(2, "Department Code Is Required"),

   description: z.string().trim().optional(),
});

export const UpdateDepartmentValidationZodSchema = z.object({
   name: z.string().trim().min(2, "Department Name Is Required").optional(),

   code: z.string().trim().min(2, "Department Code Is Required").optional(),

   description: z.string().trim().optional(),
});
