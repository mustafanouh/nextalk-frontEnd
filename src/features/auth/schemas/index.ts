import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'اكتب اسم المستخدم أو البريد الإلكتروني'),
  password: z.string().min(1, 'اكتب كلمة المرور'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

const passwordRule = z
  .string()
  .min(8, 'كلمة المرور لازم تكون 8 حروف على الأقل')
  .regex(/[a-z]/, 'لازم تحتوي على حرف صغير')
  .regex(/[A-Z]/, 'لازم تحتوي على حرف كبير')
  .regex(/[0-9]/, 'لازم تحتوي على رقم');

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'اسم المستخدم لازم يكون 3 حروف على الأقل')
      .max(32)
      .regex(/^[a-zA-Z0-9_-]+$/, 'اسم المستخدم يقبل حروف إنجليزية وأرقام و - أو _ فقط'),
    name: z.string().min(1, 'اكتب الاسم').max(100),
    email: z.string().email('بريد إلكتروني غير صحيح'),
    phone: z.string().optional().or(z.literal('')),
    password: passwordRule,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['password_confirmation'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    email: z.string().email(),
    password: passwordRule,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['password_confirmation'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
