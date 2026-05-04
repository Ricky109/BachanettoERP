import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Rol } from '@bachanetto/shared';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

interface LoginInput {
  email:    string;
  password: string;
}

export const authService = {

  async login({ email, password }: LoginInput) {
    // Buscar usuario activo por email
    const usuario = await prisma.gEN_USR.findFirst({
      where: { EMAIL_USR: email.toLowerCase(), ACT_USR: true },
    });

    if (!usuario) throw new Error('Credenciales incorrectas');

    // Verificar contraseña
    const passwordOk = await bcrypt.compare(password, usuario.PWD_USR);
    if (!passwordOk) throw new Error('Credenciales incorrectas');

    // Generar JWT
    const token = jwt.sign(
      {
        sub:    usuario.ID_USR,
        email:  usuario.EMAIL_USR,
        rol:    usuario.ROL_USR as Rol,
        nombre: usuario.NOM_USR,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      usuario: {
        id:     usuario.ID_USR,
        nombre: usuario.NOM_USR,
        email:  usuario.EMAIL_USR,
        rol:    usuario.ROL_USR as Rol,
      },
    };
  },
};