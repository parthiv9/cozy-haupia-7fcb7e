import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from 'react-slick';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NewsCard from './NewsCard';
import 'slick-carousel/slick/slick.css';
import '../styles/news-carousel.css';

const ICON_STROKE = 2;

/**
 * Read slick inner state for prev/next enable (fractional slidesToShow–safe).
 * @param {React.RefObject<import('react-slick').default | null>} sliderRef
 */
function getNavState(sliderRef) {
  const inner = sliderRef.current?.innerSlider;
  if (!inner?.state) {
    return { canPrev: false, canNext: true };
  }
  const { currentSlide, slideCount } = inner.state;
  const slidesToShow = Number(inner.props.slidesToShow) || 1;
  const tol = 0.02;
  const maxSlide = Math.max(0, slideCount - slidesToShow);
  return {
    canPrev: currentSlide > tol,
    canNext: currentSlide < maxSlide - tol,
  };
}

/**
 * Weather news row powered by react-slick (touch swipe, fractional peek, smooth transitions).
 * @param {{ articles: import('../utils/weatherNewsApi').WeatherNewsArticle[], indexOffset?: number, country?: string, ariaLabel?: string }} props
 */
export default function NewsCarousel({ articles, indexOffset = 3, country = '', ariaLabel = 'Additional weather news headlines' }) {
  const sliderRef = useRef(/** @type {import('react-slick').default | null} */ (null));
  const [nav, setNav] = useState({ canPrev: false, canNext: true });

  const syncNav = useCallback(() => {
    setNav((prev) => {
      const next = getNavState(sliderRef);
      if (prev.canPrev === next.canPrev && prev.canNext === next.canNext) return prev;
      return next;
    });
  }, []);

  const settings = useMemo(
    () => ({
      dots: false,
      infinite: false,
      speed: 420,
      cssEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
      slidesToShow: 2.2,
      slidesToScroll: 1,
      swipeToSlide: true,
      touchThreshold: 7,
      arrows: false,
      /** Only user-driven slide changes — onInit/onReInit + setState caused update loops with InnerSlider */
      afterChange: syncNav,
      /**
       * Slick applies ranges: 0–bp0, bp0+1–bp1, …, lastBp+1–∞ (see react-slick slider.js).
       * Keep ≤640px at 1 slide so a full card stays visible; avoid 1.75 in the tablet band (641–900)
       * which cramped ~2 cards + clipped third inside padded sections.
       */
      responsive: [
        { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } },
        { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1 } },
        { breakpoint: 900, settings: { slidesToShow: 1.12, slidesToScroll: 1 } },
        { breakpoint: 1200, settings: { slidesToShow: 1.85, slidesToScroll: 1 } },
      ],
    }),
    [syncNav]
  );

  useEffect(() => {
    const id = requestAnimationFrame(syncNav);
    return () => cancelAnimationFrame(id);
  }, [articles.length, syncNav]);

  if (!articles.length) return null;

  return (
    <div
      className="news-carousel-slick relative mt-3 min-w-0 w-full max-w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className="news-carousel-toolbar-btn"
          disabled={!nav.canPrev}
          onClick={() => sliderRef.current?.slickPrev()}
          aria-label="Previous headlines"
        >
          <ChevronLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
        </button>
        <button
          type="button"
          className="news-carousel-toolbar-btn"
          disabled={!nav.canNext}
          onClick={() => sliderRef.current?.slickNext()}
          aria-label="Next headlines"
        >
          <ChevronRight className="h-[18px] w-[18px] shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
        </button>
      </div>

      <Slider key={country} ref={sliderRef} {...settings} className="news-carousel-slider">
        {articles.map((a, i) => (
          <NewsCard
            key={`${country}-${a.id}`}
            article={a}
            index={indexOffset + i}
            carouselTile
            className="w-full max-w-none min-[641px]:max-w-[20rem]"
          />
        ))}
      </Slider>
    </div>
  );
}
