import bcrypt from "bcryptjs";
import { Role, UserModel } from "../models/user.model";

// Uso: npm run user:create -- "Nombre Apellido" correo@dominio.edu "Contraseña123" teacher|student
const [name, email, password, role] = process.argv.slice(2);

if (!name || !email || !password || !["teacher", "student"].includes(role)) {
  console.error('Uso: npm run user:create -- "Nombre" correo@dominio.edu "Contraseña" teacher|student');
  process.exit(1);
}
if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}
try {
  const id = UserModel.create({ name, email: email.toLowerCase(), passwordHash: bcrypt.hashSync(password, 10), role: role as Role });
  console.log(`Usuario creado (id ${id}).`);
} catch (e) {
  console.error("No se pudo crear el usuario (¿el correo ya existe?).");
  process.exit(1);
}
