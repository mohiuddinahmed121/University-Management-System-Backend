import z from "zod";

const StudentRegistrationZodSchema = z.object({
   name: z
      .string("Name Must Be A String")
      .min(3, "Name must be at least 3 characters long")
      .max(100, "Name must not exceed 100 characters"),
   email: z.email("Invalid Email Format"),
   password: z
      .string()
      .min(8, "Password Must Minimum 8 Characters Long.")
      .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
      .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")
      .regex(/[0-9]/, "Password must contain atleast 1 Number")
      .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
   student: z
      .object({
         contactNumber: z.string().optional(),
         programId: z.string().min(1, "Program ID is required"),
      })
      .optional(),
});

const StudentEmailVerifyZodSchema = z.object({
   email: z.email("Not email!!"),
   otp: z.string().length(6),
});

const LoginZodSchema = z.object({
   email: z.email(),
   password: z
      .string()
      .min(8, "Password Must Minimum 8 Characters Long.")
      .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
      .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")
      .regex(/[0-9]/, "Password must contain atleast 1 Number")
      .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
});

const ForgotPasswordZodSchema = z.object({
   email: z.email(),
});

const ResetPasswordZodSchema = z.object({
   email: z.email(),
   newPassword: z
      .string()
      .min(8, "Password Must Minimum 8 Characters Long.")
      .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
      .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")
      .regex(/[0-9]/, "Password must contain atleast 1 Number")
      .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
   otp: z.string().length(6),
});

export const UserValidation = {
   StudentRegistrationZodSchema,
   StudentEmailVerifyZodSchema,
   LoginZodSchema,
   ForgotPasswordZodSchema,
   ResetPasswordZodSchema,
};
