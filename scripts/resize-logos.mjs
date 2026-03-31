#!/usr/bin/env node
/**
 * Redimensiona os logos em public/ para tamanhos adequados.
 * Usa sharp (devDependency) para não depender de ferramentas externas.
 *
 * Uso: pnpm run resize-logos
 * Requer: pnpm add -D sharp
 */

import { stat, rename } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const TARGETS = [
  { name: "default_logo.png", width: 1600 },
  { name: "logo.png", width: 1600 },
];

async function resizeLogos() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Erro: sharp não encontrado. Instale com: pnpm add -D sharp");
    process.exit(1);
  }

  for (const { name, width } of TARGETS) {
    const inputPath = join(publicDir, name);

    try {
      const info = await stat(inputPath);
      if (!info.isFile()) continue;
    } catch {
      continue;
    }

    const img = sharp(inputPath);
    const meta = await img.metadata();
    const currentWidth = meta.width || 0;

    if (currentWidth >= width) {
      console.log(`${name}: já possui ${currentWidth}px de largura, mantendo`);
      continue;
    }

    const tempPath = join(tmpdir(), `resize-${name}`);
    await img
      .resize(width, null, { withoutEnlargement: false })
      .png({ quality: 90 })
      .toFile(tempPath);

    await rename(tempPath, inputPath);
    const newMeta = await sharp(inputPath).metadata();
    console.log(
      `${name}: ${currentWidth}x${meta.height} → ${newMeta.width}x${newMeta.height}`,
    );
  }
}

resizeLogos().catch((err) => {
  console.error(err);
  process.exit(1);
});
