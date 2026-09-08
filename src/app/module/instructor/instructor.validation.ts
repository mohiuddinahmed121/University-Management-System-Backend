import { z } from "zod";

export const UpdateInstructorProfileValidationZodSchema = z.object({
   address: z.string().trim().min(5, "Address must be at least 5 characters long").optional(),

   specialization: z
      .string()
      .trim()
      .min(2, "Specialization must be at least 2 characters long")
      .optional(),

   designation: z
      .string()
      .trim()
      .min(2, "Designation must be at least 2 characters long")
      .optional(),

   contactNumber: z.string().trim().min(5, "Contact number is invalid").optional(),
});
