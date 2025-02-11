"use server";
import { redirect } from "next/navigation";
import { saveMeal } from "./meals";
import { revalidatePath } from "next/cache";
// server actions only

// validator function
function isInvalidText(text) {
  return !text || text.trim() === "";
}

// form submission handler
export async function shareMeal(prevState, formData) {
  "use server";

  const meal = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    instructions: formData.get("instructions"),
    image: formData.get("image"),
    creator: formData.get("name"),
    creator_email: formData.get("email"),
  };

  // backend input validator
  if (
    isInvalidText(meal.title) ||
    isInvalidText(meal.summary) ||
    isInvalidText(meal.instructions) ||
    isInvalidText(meal.creator) ||
    isInvalidText(meal.creator_email) ||
    !meal.creator_email.includes("@") ||
    !meal.image ||
    meal.image.size == 0
  ) {
    // throw new Error("Invalid Input");
    return {
      message: "Invalid Input",
    };
  }

  await saveMeal(meal);
  //to reset the path validation to reflect new data and reset next default cache. It throws away the cache the second arg can be 'page' you want to set it on the page alone
  // revalidatePath('/meals', 'layout');
  // revalidatePath('/meals', 'page');
  revalidatePath("/meals"); //revalidate only meal path

  redirect("/meals");
}
