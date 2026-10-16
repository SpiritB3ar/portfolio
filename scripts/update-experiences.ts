/**
 * Script para actualizar el modelo de experiencia en Prisma usando datos de portfolio-data.md.
 * Para ejecutar este script:
 * 1. Asegúrate de que tu base de datos esté corriendo y accesible.
 * 2. Asegúrate de tener las dependencias de Prisma instaladas (`npm install @prisma/client`).
 * 3. Compila el script TypeScript: `npx ts-node d:\spiritbear\PROYECTS\FRONT\NEXTJS\portfolio_frontend\scripts\update-experiences.ts`
 *    O, si tienes `ts-node` configurado globalmente: `ts-node d:\spiritbear\PROYECTS\FRONT\NEXTJS\portfolio_frontend\scripts\update-experiences.ts`
 */

import "dotenv/config";
import db from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // const markdownPath = path.join(__dirname, '../../porfolio-data.md');
  const markdownPath = path.resolve(process.cwd(), 'porfolio-data.md');
  console.log(`Reading markdown from: ${markdownPath}`);
  const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

  const experiences: any[] = [];
  const experienceSectionMatch = markdownContent.match(/Experiencia\n([\s\S]*?)(?:\nEducación|\n|$)/);

  if (experienceSectionMatch && experienceSectionMatch[1]) {
    const experienceText = experienceSectionMatch[1].trim();
    const experienceEntries = experienceText.split(/\n(?=[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\n(?:Senior|Desarrollador|Ingeniero|Software Engineer|Desarrollador de back-end))/);

    for (const entry of experienceEntries) {
      const lines = entry.trim().split('\n');
      if (lines.length < 3) continue;

      const name = lines[0].trim();
      const title = lines[1].trim();
      const dateLocationMatch = lines[2].match(/(.*?)\s\((.*?)\)\n(.*)/);
      let startEndString = '';
      let location = '';
      let descriptionLines: string[] = [];

      if (dateLocationMatch) {
        startEndString = dateLocationMatch[1].trim();
        location = dateLocationMatch[2].trim();
        descriptionLines = dateLocationMatch[3].trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
      } else {
        // Fallback if the date/location line format is different
        startEndString = lines[2].trim();
        location = lines[3].trim();
        descriptionLines = lines.slice(4).map(line => line.trim()).filter(line => line.length > 0);
      }

      const parseDate = (dateString: string): Date => {
        if (dateString.toLowerCase() === 'presente') {
          return new Date(); // Fecha actual para 'Presente'
        }
        // Asume formato "mes de año" o "mes de año - mes de año"
        const parts = dateString.split(' de ');
        if (parts.length < 2) {
          // Handle cases like just a year or malformed date
          return new Date(dateString);
        }
        const [monthStr, yearStr] = parts;
        const monthMap: { [key: string]: number } = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
          'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };
        const monthIndex = monthMap[monthStr.toLowerCase()];
        if (monthIndex === undefined) {
          // Fallback for unknown month names or other formats
          return new Date(dateString);
        }
        return new Date(parseInt(yearStr), monthIndex);
      };

      let startDate: Date;
      let endDate: Date;

      if (startEndString.includes(' - ')) {
        const [startPart, endPart] = startEndString.split(' - ');
        startDate = parseDate(startPart.trim());
        endDate = parseDate(endPart.trim());
      } else {
        startDate = parseDate(startEndString.trim());
        endDate = new Date(); // Si solo hay una fecha, asume que es la fecha de inicio y el final es "Presente"
      }

      experiences.push({
        name,
        title,
        startDate,
        endDate,
        location,
        descriptionLines,
      });
    }
  }

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  for (const exp of experiences) {
    // Crear o actualizar experiencia
    const slug = generateSlug(`${exp.title}-${exp.name}`);
    const existing = await db.orm.Experience.where({ slug }).first();
    let experienceId: string;
    if (existing) {
      await db.orm.Experience.where({ slug }).update({
        name: exp.name,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        location: exp.location,
      });
      experienceId = existing._id;
      await db.orm.ExperienceInput.where({ experienceId }).deleteAndCount();
    } else {
      const created = await db.orm.Experience.create({
        name: exp.name,
        title: exp.title,
        slug,
        startDate: exp.startDate,
        endDate: exp.endDate,
        location: exp.location,
        technologies: [],
      });
      experienceId = created._id;
    }
    for (const content of exp.descriptionLines as string[]) {
      await db.orm.ExperienceInput.create({ content, experienceId });
    }
    console.log(`Nueva experiencia creada: ${exp.name} - ${exp.title}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });
