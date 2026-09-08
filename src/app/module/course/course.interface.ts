export interface ICreateCoursePayload {
   code: string;
   title: string;
   description?: string;
   credit: number;
   departmentId: string;
}

export interface IUpdateCoursePayload {
   code?: string;
   title?: string;
   description?: string;
   credit?: number;
   departmentId?: string;
}

export interface ICreateCoursePrerequisitePayload {
   prerequisiteCourseId: string;
}
