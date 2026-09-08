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
   };
}

export interface IApproveInstructorPayload {
   instructorId: string;
}

export interface IUpdateInstructorProfilePayload {
   address?: string;
   specialization?: string;
   designation?: string;
   contactNumber?: string;
}
