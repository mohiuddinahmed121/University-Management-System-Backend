export interface ISubmitResultPayload {
   registrationId: string;
   marks: number;
}

export interface IUpdateResultPayload {
   marks?: number;
}

export interface IGradeResult {
   grade: string;
   gradePoint: number;
}
