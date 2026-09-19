export interface IApplyAsInstructorPayload {
   user: {
      name: string;
      email: string;
   };

   instructor: {
      address?: string;
      specialization?: string;
      designation?: string;
      contactNumber?: string;
      departmentId: string;
   };
}

export interface IApproveInstructorPayload {
   instructorId: string;
   action: "APPROVE" | "REJECT";
   rejectionReason?: string;
}

export interface IUpdateInstructorProfilePayload {
   address?: string;
   specialization?: string;
   designation?: string;
   contactNumber?: string;
}
