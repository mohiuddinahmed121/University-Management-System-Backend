import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Role, UserStatus } from "../../../../generated/prisma/enums";
import { UserWhereInput } from "../../../../generated/prisma/models";
import config from "../../config";
import { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";

//    name: string;
//    email: string;
//    password: string;
//    contactNumber?: string;
//    address?: string;
//    specialization?: string;
//    designation?: string;
//    departmentId: string;
// }) => {
//    const {
//       name,
//       email,
//       password,
//       contactNumber,
//       address,
//       specialization,
//       designation,
//       departmentId,
//    } = payload;

//    const normalizedEmail = email.toLowerCase();

//    const existingUser = await prisma.user.findUnique({
//       where: {
//          email: normalizedEmail,
//       },
//    });

//    if (existingUser) {
//       throw new AppError(httpStatus.CONFLICT, "User With This Email Already Exists");
//    }

//    const department = await prisma.department.findUnique({
//       where: {
//          id: departmentId,
//       },
//    });

//    if (!department || department.isDeleted) {
//       throw new AppError(httpStatus.NOT_FOUND, "Department Not Found");
//    }

//    const instructorId = await generateInstructorId();

//    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

//    const instructor = await prisma.user.create({
//       data: {
//          name,
//          email: normalizedEmail,
//          password: hashedPassword,
//          role: Role.INSTRUCTOR,
//          authProvider: "CREDENTIAL",
//          emailVerified: true,
//          needPasswordChange: false,

//          instructor: {
//             create: {
//                instructorId,
//                name,
//                email: normalizedEmail,
//                contactNumber,
//                address,
//                specialization,
//                designation,
//                departmentId,
//             },
//          },
//       },
//       include: {
//          instructor: {
//             include: {
//                department: true,
//             },
//          },
//       },
//    });

//    const { password: _, ...result } = instructor;

//    return result;
// };

const getAllUsers = async (query: IQuery) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;

   const sortBy = query.sortBy || "createdAt";
   const sortOrder = query.sortOrder || "desc";

   const andConditions: UserWhereInput[] = [];

   if (query.searchTerm) {
      andConditions.push({
         OR: [
            {
               name: {
                  contains: query.searchTerm,
                  mode: "insensitive",
               },
            },
            {
               email: {
                  contains: query.searchTerm,
                  mode: "insensitive",
               },
            },
         ],
      });
   }

   if (query.role) {
      andConditions.push({
         role: query.role,
      });
   }

   if (query.status) {
      andConditions.push({
         status: query.status,
      });
   }

   const users = await prisma.user.findMany({
      where: {
         AND: andConditions,
      },
      skip,
      take: limit,
      orderBy: {
         [sortBy]: sortOrder,
      },
      select: {
         id: true,
         name: true,
         email: true,
         role: true,
         status: true,
         authProvider: true,
         emailVerified: true,
         imageUrl: true,
         isDeleted: true,
         createdAt: true,
         updatedAt: true,
         student: {
            select: {
               id: true,
               studentId: true,
               program: {
                  select: {
                     id: true,
                     name: true,
                     code: true,
                  },
               },
            },
         },
         instructor: {
            select: {
               id: true,
               instructorId: true,
               department: {
                  select: {
                     id: true,
                     name: true,
                     code: true,
                  },
               },
            },
         },
      },
   });

   const total = await prisma.user.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: users,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const updateUserStatus = async (userId: string, status: UserStatus, currentUser: RequestUser) => {
   if (userId === currentUser.userId) {
      throw new AppError(httpStatus.BAD_REQUEST, "You Cannot Change Your Own Account Status");
   }

   const user = await prisma.user.findUnique({
      where: {
         id: userId,
      },
   });

   if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
   }

   if (user.role === Role.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, "Admin Account Status Cannot Be Changed");
   }

   if (user.isDeleted || user.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Deleted User Cannot Be Updated");
   }

   const updatedUser = await prisma.user.update({
      where: {
         id: userId,
      },
      data: {
         status,
      },
      select: {
         id: true,
         name: true,
         email: true,
         role: true,
         status: true,
         emailVerified: true,
         updatedAt: true,
      },
   });

   return updatedUser;
};

const getSingleUser = async (userId: string) => {
   const user = await prisma.user.findUnique({
      where: {
         id: userId,
      },
      select: {
         id: true,
         name: true,
         email: true,
         role: true,
         status: true,
         authProvider: true,
         emailVerified: true,
         imageUrl: true,
         imagePublicId: true,
         isDeleted: true,
         createdAt: true,
         updatedAt: true,

         student: {
            include: {
               program: {
                  include: {
                     department: true,
                  },
               },
            },
         },

         instructor: {
            include: {
               department: true,
            },
         },
      },
   });

   if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
   }

   return user;
};

export const AdminServices = {
   getAllUsers,
   updateUserStatus,
   getSingleUser,
};
