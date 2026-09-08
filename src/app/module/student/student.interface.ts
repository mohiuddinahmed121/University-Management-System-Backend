export interface IUpdateStudentProfilePayload {
   address?: string;
   contactNumber?: string;
   dateOfBirth?: Date;
   gender?: "MALE" | "FEMALE" | "OTHER";
}
