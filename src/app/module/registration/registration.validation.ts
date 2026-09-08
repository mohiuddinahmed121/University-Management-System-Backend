import z from "zod";

export const CreateRegistrationValidationZodSchema = z.object({
   sectionId: z.string().min(1, "Section Id Is Required"),
});
