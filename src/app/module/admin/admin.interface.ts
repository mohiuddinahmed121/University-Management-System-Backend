export interface ICreateInstructorPayload {
   name: string;
   email: string;
   password: string;
   contactNumber?: string;
   address?: string;
   specialization?: string;
   designation?: string;
   departmentId: string;
}

export interface IUpdateUserStatusPayload {
   status: "ACTIVE" | "BLOCKED";
}
