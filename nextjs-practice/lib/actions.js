"use server"; // server actions only

// form submission handler
export async function shareMeal(formData) {
  "use server";
  const meal = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    instruction: formData.get("instructions"),
    image: formData.get("image"),
    creator: formData.get("name"),
    creator_email: formData.get("email"),
  };

  console.log(meal);
}
