import "dotenv/config";
import db from "../../lib/db";
import { generateSlug } from "../../lib/slug-util";

async function main() {
  const experiences = await db.orm.Experience.all();

  for (const experience of experiences) {
      const baseSlug = generateSlug(`${experience.title}-${experience.name}`);
      let newSlug = baseSlug;
      let counter = 0;
      let existingExperience = await db.orm.Experience.where({ slug: newSlug }).first();

      while (existingExperience && existingExperience._id !== experience._id) {
        counter++;
        newSlug = `${baseSlug}-${counter}`;
        existingExperience = await db.orm.Experience.where({ slug: newSlug }).first();
      }
      console.log(`Updating experience "${experience.title}" with new slug: ${newSlug}`);
      await db.orm.Experience.where({ _id: experience._id }).update({ slug: newSlug });
  }
  console.log('Experience slugs populated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });
