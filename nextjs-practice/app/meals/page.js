import React from "react";
import classes from "./page.module.css";
import Link from "next/link";
import { MealsGrid } from "../components/meals/meal-grid";
import { getMeal } from "@/lib/meals";

const Meals = async () => {
  const meals = await getMeal();

  // console.log(meals);

  return (
    <>
      Meals Page
      <header className={classes.header}>
        <h1>
          Delicious meals, created{" "}
          <span className={classes.highlight}>by you</span>
        </h1>

        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Perspiciatis
          dolorem voluptates.
        </p>
        <p className={classes.cta}>
          <Link href="/meals/share">Share your favorite Recipe</Link>
        </p>
      </header>
      <main className={classes.main}>
        <MealsGrid meals={meals} />
      </main>
    </>
  );
};

export default Meals;
