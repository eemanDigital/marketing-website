import { Stars } from "@/components/Icon";
import { REVIEWS, REVIEWS_SUMMARY } from "@/lib/catalog";

export default function Reviews() {
  return (
    <section className="reviews" id="reviews">
      <div className="shell">
        <header className="section-head" data-reveal>
          <h2>Client Reviews</h2>
          <p>What clients say after the fitting</p>
        </header>

        <div className="reviews__summary" data-reveal>
          <span className="reviews__score">{REVIEWS_SUMMARY.score}</span>
          <div>
            <div className="review__stars">
              <Stars rating={5} />
            </div>
            <p className="reviews__of">
              Based on {REVIEWS_SUMMARY.count} verified reviews
            </p>
          </div>
        </div>

        <div className="reviews__grid">
          {REVIEWS.map((r) => (
            <article className="review" key={r.name} data-reveal>
              <div className="review__stars">
                <Stars rating={r.rating} />
              </div>
              <blockquote>&ldquo;{r.quote}&rdquo;</blockquote>
              <div className="review__who">
                <span className="avatar" aria-hidden="true">
                  {r.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div>
                  <cite>{r.name}</cite>
                  <span>{r.meta}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
