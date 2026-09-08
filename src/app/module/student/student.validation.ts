import { z } from "zod";

export const UpdateStudentProfileValidationZodSchema = z.object({
   address: z.string().trim().min(5, "Address must be at least 5 characters long").optional(),

   contactNumber: z.string().trim().min(5, "Contact number is invalid").optional(),

   dateOfBirth: z.coerce.date().optional(),

   gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});
