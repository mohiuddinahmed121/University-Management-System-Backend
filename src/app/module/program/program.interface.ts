export interface ICreateProgramPayload {
   name: string;
   code: string;
   description?: string;
   durationYears: number;
   departmentId: string;
}

export interface IUpdateProgramPayload {
   name?: string;
   code?: string;
   description?: string;
   durationYears?: number;
   departmentId?: string;
}
