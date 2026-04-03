'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Percent, Leaf, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
  image: string;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeColor: string;
  badgeShadow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  primaryBtn: string;
  secondaryBtn: string;
  gradientDirection: string;
}

const slides: Slide[] = [
  {
    image: '/hero-fresh-fruits.png',
    badge: 'Fresh & Seasonal',
    badgeIcon: <Sparkles className="size-3 mr-1.5" />,
    badgeColor: 'bg-emerald-500/90 hover:bg-emerald-500',
    badgeShadow: 'shadow-lg shadow-emerald-500/25',
    titleLine1: 'Fresh Fruits',
    titleLine2: 'Delivered in 2 Hours',
    subtitle: 'Hand-picked seasonal fruits sourced directly from farms. Sweet, juicy, and packed with nutrition.',
    primaryBtn: 'Shop Fruits',
    secondaryBtn: 'Browse All',
    gradientDirection: 'from-black/75 via-black/50 to-black/20',
  },
  {
    image: '/hero-daily-essentials.png',
    badge: 'Daily Essentials',
    badgeIcon: <ShoppingBag className="size-3 mr-1.5" />,
    badgeColor: 'bg-amber-500/90 hover:bg-amber-500',
    badgeShadow: 'shadow-lg shadow-amber-500/25',
    titleLine1: 'Your Daily',
    titleLine2: 'Kitchen Needs',
    subtitle: 'From rice and flour to spices and oils — everything you need for your everyday meals.',
    primaryBtn: 'Shop Essentials',
    secondaryBtn: 'View All',
    gradientDirection: 'from-black/75 via-black/50 to-black/20',
  },
  {
    image: '/hero-offers.png',
    badge: 'Special Offers',
    badgeIcon: <Percent className="size-3 mr-1.5" />,
    badgeColor: 'bg-red-500/90 hover:bg-red-500',
    badgeShadow: 'shadow-lg shadow-red-500/25',
    titleLine1: 'Up to 40% Off',
    titleLine2: 'Today Only',
    subtitle: 'Grab amazing deals on your favorite products. Limited time offers you cannot miss.',
    primaryBtn: 'Shop Deals',
    secondaryBtn: 'All Offers',
    gradientDirection: 'from-black/80 via-black/55 to-black/20',
  },
  {
    image: '/hero-organic-veggies.png',
    badge: '100% Organic',
    badgeIcon: <Leaf className="size-3 mr-1.5" />,
    badgeColor: 'bg-green-600/90 hover:bg-green-600',
    badgeShadow: 'shadow-lg shadow-green-600/25',
    titleLine1: 'Farm Fresh',
    titleLine2: 'Organic Vegetables',
    subtitle: 'Premium quality organic produce delivered fresh from local farms to your doorstep.',
    primaryBtn: 'Shop Organic',
    secondaryBtn: 'Learn More',
    gradientDirection: 'from-black/75 via-black/50 to-black/20',
  },
];

const AUTO_PLAY_INTERVAL = 4000;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1.02,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98,
  }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.12,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function HeroBanner() {
  const { navigate, selectCategory } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setDirection(index > currentSlide ? 1 : -1);
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 700);
    },
    [currentSlide, isTransitioning]
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleShopNow = () => {
    selectCategory(null);
    navigate('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrowseCategories = () => {
    const categoriesSection = document.getElementById('categories-section');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative overflow-hidden group/hero" aria-label="Hero banner carousel">
      {/* Carousel Container */}
      <div
        className="relative w-full h-[320px] sm:h-[400px] lg:h-[500px] xl:h-[540px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured promotions"
      >
        {/* Slides */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
              opacity: { duration: 0.4 },
              scale: { duration: 0.5 },
            }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={slide.image}
                alt={slide.titleLine1}
                className="w-full h-full object-cover object-center"
                loading={currentSlide === 0 ? 'eager' : 'lazy'}
              />
            </div>

            {/* Multi-layer gradient overlays */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradientDirection}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentSlide}`}
            className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-12 lg:px-16 max-w-7xl mx-auto"
          >
            <div className="max-w-lg">
              {/* Badge */}
              <motion.div
                custom={0}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Badge
                  className={`mb-5 ${slide.badgeColor} text-white border-0 text-xs px-3.5 py-1.5 ${slide.badgeShadow} font-medium transition-colors duration-300 cursor-default`}
                >
                  {slide.badgeIcon}
                  {slide.badge}
                </Badge>
              </motion.div>

              {/* Title */}
              <motion.h1
                custom={1}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-extrabold text-white leading-[1.15] mb-4"
              >
                {slide.titleLine1}
                <br />
                <span className="bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
                  {slide.titleLine2}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                custom={2}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-sm sm:text-base text-gray-200/90 mb-7 leading-relaxed max-w-md"
              >
                {slide.subtitle}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                custom={3}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-wrap gap-3 mb-8"
              >
                <Button
                  onClick={handleShopNow}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-full px-7 shadow-xl shadow-green-600/30 hover:shadow-green-500/40 transition-all duration-300 h-12 text-base font-semibold active:scale-[0.97]"
                >
                  {slide.primaryBtn}
                </Button>
                <Button
                  onClick={handleBrowseCategories}
                  variant="outline"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/25 hover:border-white/40 rounded-full px-7 backdrop-blur-md transition-all duration-300 h-12 text-base font-medium active:scale-[0.97]"
                >
                  {slide.secondaryBtn}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 opacity-60 sm:opacity-0 sm:group-hover/hero:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
        >
          <ChevronLeft className="size-5 sm:size-6" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 opacity-60 sm:opacity-0 sm:group-hover/hero:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
        >
          <ChevronRight className="size-5 sm:size-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`relative transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'w-8 h-3'
                  : 'w-3 h-3 hover:w-4 hover:bg-white/60'
              }`}
            >
              <span
                className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                  index === currentSlide
                    ? 'bg-white'
                    : 'bg-white/40'
                }`}
              />
              {/* Animated fill for active dot */}
              {index === currentSlide && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-white"
                  layoutId="activeDot"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Auto-play progress bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-black/10">
          {!isPaused && (
            <motion.div
              key={currentSlide}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
            />
          )}
        </div>
      </div>

      {/* Info Badges */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center gap-3.5 justify-center sm:justify-start p-3 rounded-xl hover:bg-green-50/50 transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center shrink-0 border border-green-100 group-hover:shadow-md group-hover:shadow-green-100/50 transition-all">
                <Truck className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Free Delivery</p>
                <p className="text-xs text-gray-500">On orders above &#8377;500</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 justify-center p-3 rounded-xl hover:bg-amber-50/50 transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center shrink-0 border border-amber-100 group-hover:shadow-md group-hover:shadow-amber-100/50 transition-all">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Express Delivery</p>
                <p className="text-xs text-gray-500">Get it in 2 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 justify-center sm:justify-end p-3 rounded-xl hover:bg-rose-50/50 transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center shrink-0 border border-rose-100 group-hover:shadow-md group-hover:shadow-rose-100/50 transition-all">
                <RotateCcw className="size-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Easy Returns</p>
                <p className="text-xs text-gray-500">7-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
