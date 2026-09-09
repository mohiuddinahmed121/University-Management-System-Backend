export interface ICreateDepartmentPayload {
   name: string;
   code: string;
   description?: string;
}

export interface IUpdateDepartmentPayload {
   name?: string;
   code?: string;
   description?: string;
}
