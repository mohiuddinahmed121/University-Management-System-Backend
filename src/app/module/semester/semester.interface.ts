export interface ICreateSemesterPayload {
   name: string;
   year: number;
   startDate: Date;
   endDate: Date;
   feeAmount: number;
}

export interface IUpdateSemesterPayload {
   name?: string;
   year?: number;
   startDate?: Date;
   endDate?: Date;
   feeAmount?: number;
}
