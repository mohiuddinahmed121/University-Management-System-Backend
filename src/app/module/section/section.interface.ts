export interface ICreateSectionPayload {
   sectionName: string;
   capacity: number;
   courseId: string;
   semesterId: string;
   instructorId?: string;
}

export interface IUpdateSectionPayload {
   sectionName?: string;
   capacity?: number;
   instructorId?: string;
}
