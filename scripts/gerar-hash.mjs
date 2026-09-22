// Gera o hash bcrypt de uma senha, para trocar a senha do professor no banco.
// Uso: npm run hash -- "minha nova senha"
import bcrypt from "bcryptjs";

const senha = process.argv[2];
if (!senha) {
  console.error('Uso: npm run hash -- "sua senha"');
  process.exit(1);
}

const hash = await bcrypt.hash(senha, 10);
console.log("\nHash gerado:\n");
console.log(hash);
console.log("\nAplique no banco com:\n");
console.log(`UPDATE professor SET senha_hash = '${hash}' WHERE email = 'professor@senai.br';\n`);
