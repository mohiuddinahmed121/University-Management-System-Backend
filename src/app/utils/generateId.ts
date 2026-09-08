import { prisma } from "../lib/prisma"; // path adjust করো

export const generateInstructorId = async (): Promise<string> => {
   const currentYear = new Date().getFullYear();
   const prefix = `INS-${currentYear}`;

   // এই বছরের সর্বশেষ instructor খুঁজে বের করা
   const lastInstructor = await prisma.instructor.findFirst({
      where: {
         instructorId: {
            startsWith: prefix,
         },
      },
      orderBy: {
         createdAt: "desc",
      },
   });

   let sequence = 1;

   if (lastInstructor) {
      // "INS-2026-0007" থেকে শেষের নাম্বারটা বের করা
      const lastSequenceStr = lastInstructor.instructorId.split("-").pop();
      const lastSequence = parseInt(lastSequenceStr || "0");
      sequence = lastSequence + 1;
   }

   const paddedSequence = String(sequence).padStart(4, "0");

   return `${prefix}-${paddedSequence}`;
   // Output হবে: INS-2026-0001, INS-2026-0002 ...
};
