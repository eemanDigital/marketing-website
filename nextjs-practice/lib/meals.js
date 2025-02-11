import fs from "node:fs";
import sql from "better-sqlite3";
const db = sql("meals.db");
import slugify from "slugify";
import xss from "xss";

export async function getMeals() {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // throw new Error("An error occurred!!!");
  return db.prepare("SELECT * FROM meals").all();
}

export function getMeal(slug) {
  return db.prepare("SELECT * FROM meals WHERE slug = ?").get(slug);
}

export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true }); //generate slug
  meal.instructions = xss(meal.instructions); //prevent xss attacks

  // store image in file AND NOT THE DATABASE
  const extension = meal.image.name.split(".").pop();

  const fileName = `${meal.slug}.${extension}`;

  const stream = fs.createWriteStream(`public/images/${fileName}`);

  const bufferedImage = await meal.image.arrayBuffer();
  stream.write(Buffer.from(bufferedImage), (error) => {
    if (error) {
      throw new Error("saving image failed");
    }
  });

  meal.image = `/images/${fileName}`;

  try {
    db.prepare(
      `
      INSERT INTO meals 
      (title, summary, instructions, creator, creator_email, image, slug)

      VALUES(
      @title,@summary,@instructions,@creator,@creator_email,@image,@slug
      )
    `
    ).run(meal);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error(" A Meal with this slug already exist");
    } else {
      throw error;
    }
  }
}
