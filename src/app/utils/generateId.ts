import { prisma } from "../lib/prisma";

export const generateInstructorId = async (): Promise<string> => {
   const currentYear = new Date().getFullYear();
   const prefix = `INS-${currentYear}`;

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
      const lastSequenceStr = lastInstructor.instructorId.split("-").pop();
      const lastSequence = parseInt(lastSequenceStr || "0");
      sequence = lastSequence + 1;
   }

   const paddedSequence = String(sequence).padStart(4, "0");

   return `${prefix}-${paddedSequence}`;
};
