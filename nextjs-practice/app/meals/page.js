import React, { Suspense } from "react";
import classes from "./page.module.css";
import Link from "next/link";
import { MealsGrid } from "../components/meals/meal-grid";
import { getMeals } from "@/lib/meals";

//metadata
export const metadata = {
  title: "All Meals",
  description: "browse the delicious meals shared by our fun community",
};

const MealsPage = async () => {
  const meals = await getMeals();

  return <MealsGrid meals={meals} />;
};

const Meals = () => {
  return (
    <>
      <header className={classes.header}>
        <h1>
          Delicious meals, created{" "}
          <span className={classes.highlight}>by you</span>
        </h1>
        <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit.</p>
        <p className={classes.cta}>
          <Link href="/meals/share">Share your favorite Recipe</Link>
        </p>
      </header>
      <main className={classes.main}>
        <Suspense
          fallback={<p className={classes.loading}>Fetching Meals...</p>}>
          <MealsPage />
        </Suspense>
      </main>
    </>
  );
};

export default Meals;
