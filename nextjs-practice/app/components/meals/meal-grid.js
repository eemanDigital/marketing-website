import classes from "./meal-grid.module.css";
import MealItem from "./meal-item";

export const MealsGrid = ({ meals }) => {
  return (
    <div className={classes.meals}>
      {meals.map((meal) => {
        return (
          <li key={meal.id}>
            <MealItem {...meal} />
          </li>
        );
      })}
    </div>
  );
};
