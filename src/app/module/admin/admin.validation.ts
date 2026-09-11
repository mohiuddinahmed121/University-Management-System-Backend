import { z } from "zod";

export const CreateInstructorValidationZodSchema = z.object({
   name: z.string().trim().min(2, "Instructor Name Is Required"),

   email: z.string().trim().email("Invalid Email Address"),

   password: z.string().min(6, "Password Must Be At Least 6 Characters"),

   contactNumber: z.string().trim().optional(),

   address: z.string().trim().optional(),

   specialization: z.string().trim().optional(),

   designation: z.string().trim().optional(),

   departmentId: z.string().min(1, "Department Id Is Required"),
});

export const UpdateUserStatusValidationZodSchema = z.object({
   status: z.enum(["ACTIVE", "BLOCKED"]),
});
