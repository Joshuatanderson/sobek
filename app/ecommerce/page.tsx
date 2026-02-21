"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  MagnifyingGlass,
  User,
  Heart,
  ShoppingCart,
  List,
  Truck,
  ArrowsClockwise,
  CurrencyDollar,
  MapPin,
  CaretLeft,
  CaretRight,
  Star,
} from "@phosphor-icons/react";

/* ── static data ─────────────────────────────────────────────── */

const NAV_CATEGORIES = [
  "ALL CATEGORIES",
  "COMPUTERS & LAPTOPS",
  "OFFICE & NETWORKING",
  "MOBILES & TABLETS",
  "ELECTRONICS",
  "HOME",
];

const HERO_SLIDES = [
  {
    headline: "ULTIMATE CASES FOR YOUR BUILD",
    subline: "LIMITED-TIME OFFERS ON",
    accent: "PREMIUM CASES",
    offer: "UP TO 50% OFF",
    offerSub: "ON ALL CASES",
    cta: "SHOP NOW",
    bg: "from-[#1a1040] via-[#1e1850] to-[#0d0a2a]",
  },
  {
    headline: "LEVEL UP YOUR GAMING",
    subline: "EXCLUSIVE DEALS ON",
    accent: "GAMING LAPTOPS",
    offer: "UP TO 35% OFF",
    offerSub: "SELECT MODELS",
    cta: "SHOP NOW",
    bg: "from-[#0a1628] via-[#122040] to-[#0a0f1a]",
  },
  {
    headline: "BUILD YOUR DREAM RIG",
    subline: "TOP PERFORMANCE WITH",
    accent: "LATEST GPUs",
    offer: "STARTING AT AED 2,999",
    offerSub: "GRAPHICS CARDS",
    cta: "EXPLORE",
    bg: "from-[#1a0a0a] via-[#2a1020] to-[#0d0a1a]",
  },
];

interface Product {
  id: number;
  name: string;
  image: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  badges: { label: string; color: string }[];
  fulfilled?: boolean;
}

const DAILY_OFFERS: Product[] = [
  {
    id: 1,
    name: 'Microless x Cybeart Limited Edition Gaming Chair, Premium APEX 2.0 Licensed Gaming Chair, Endura',
    image: "/demo/home/gaming-chair.jpg",
    price: "1,699.99",
    badges: [
      { label: "Limited Edition 5 Years Warranty", color: "bg-[#f5c518] text-[#1a1a1a]" },
      { label: "New", color: "bg-[#76b900] text-white" },
    ],
    fulfilled: true,
  },
  {
    id: 2,
    name: 'Lenovo Legion 5 15IAX10 Gaming Laptop, 15.1" WQXGA OLED 165Hz Display, Intel Core Ultra 7 255HX',
    image: "/demo/home/laptop.jpg",
    price: "5,048.00",
    badges: [{ label: "New", color: "bg-[#76b900] text-white" }],
    fulfilled: true,
  },
  {
    id: 3,
    name: "HP Elite Mini 800 G9 Desktop Computer, Intel Core i5-14500 Processor, 16GB RAM, 512GB SSD",
    image: "/demo/home/desktop-pc.jpg",
    price: "2,995.00",
    originalPrice: "3,360.00",
    discount: "11% OFF",
    badges: [],
    fulfilled: true,
  },
  {
    id: 4,
    name: "Razer BlackWidow V4 Pro Mechanical Gaming Keyboard, Yellow Switches, Chroma RGB, Magnetic Wrist Rest",
    image: "/demo/home/keyboard.jpg",
    price: "1,420.07",
    originalPrice: "2,000.00",
    discount: "29% OFF",
    badges: [],
  },
  {
    id: 5,
    name: 'Gigabyte Aorus FO32U2 Gaming Monitor, 32" 4K UHD OLED Display, 240Hz Refresh Rate, 0.03ms (GtG)',
    image: "/demo/home/gaming-monitor.jpg",
    price: "3,499.00",
    originalPrice: "5,040.00",
    discount: "31% OFF",
    badges: [{ label: "Ramadan Deal", color: "bg-red-600 text-white" }],
    fulfilled: true,
  },
  {
    id: 6,
    name: "Battleborn Gaming PC AMD Ryzen 7 9800X3D, Radeon RX 9070 XT 16GB, 16GB DDR5 RAM, 1TB M.2",
    image: "/demo/home/gaming-pc.jpg",
    price: "7,979.00",
    originalPrice: "9,450.00",
    discount: "16% OFF",
    badges: [
      { label: "Powered By AMD", color: "bg-red-600 text-white" },
      { label: "New", color: "bg-[#76b900] text-white" },
    ],
    fulfilled: true,
  },
];

const TOP_SELLING: Product[] = [
  {
    id: 7,
    name: "ASUS ROG Strix GeForce RTX 5080 OC Edition, 16GB GDDR7, DLSS 4, AI-Powered Graphics",
    image: "/demo/h100-main.png",
    price: "6,299.00",
    badges: [{ label: "New", color: "bg-[#76b900] text-white" }],
    fulfilled: true,
  },
  {
    id: 8,
    name: 'Samsung Odyssey OLED G8 34" Ultra WQHD Gaming Monitor, 175Hz, 0.03ms, FreeSync Premium Pro',
    image: "/demo/home/gaming-monitor.jpg",
    price: "4,199.00",
    originalPrice: "4,999.00",
    discount: "16% OFF",
    badges: [],
    fulfilled: true,
  },
  {
    id: 9,
    name: "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6400MHz CL32 Desktop Memory Kit, Intel XMP 3.0",
    image: "/demo/home/desktop-pc.jpg",
    price: "549.00",
    badges: [{ label: "Best Seller", color: "bg-[#f5c518] text-[#1a1a1a]" }],
    fulfilled: true,
  },
  {
    id: 10,
    name: "Logitech G Pro X Superlight 2 Wireless Gaming Mouse, HERO 2 Sensor, 44G Ultralight",
    image: "/demo/home/keyboard.jpg",
    price: "579.00",
    originalPrice: "699.00",
    discount: "17% OFF",
    badges: [],
  },
  {
    id: 11,
    name: 'MSI MAG 274UPF 27" 4K UHD Rapid IPS Gaming Monitor, 144Hz, 1ms, USB-C, HDR 400',
    image: "/demo/home/gaming-monitor.jpg",
    price: "1,849.00",
    originalPrice: "2,199.00",
    discount: "16% OFF",
    badges: [{ label: "Ramadan Deal", color: "bg-red-600 text-white" }],
    fulfilled: true,
  },
  {
    id: 12,
    name: "WD Black SN850X 2TB NVMe M.2 2280 Internal SSD, PCIe Gen4, Up to 7300MB/s Read",
    image: "/demo/home/desktop-pc.jpg",
    price: "599.00",
    originalPrice: "849.00",
    discount: "29% OFF",
    badges: [],
    fulfilled: true,
  },
];

const CATEGORIES = [
  { name: "Laptops", icon: "💻" },
  { name: "Desktops", icon: "🖥️" },
  { name: "Graphics Cards", icon: "🎮" },
  { name: "Monitors", icon: "📺" },
  { name: "Storage", icon: "💾" },
  { name: "Peripherals", icon: "⌨️" },
  { name: "Networking", icon: "📡" },
  { name: "Smart Home", icon: "🏠" },
];

/* ── components ──────────────────────────────────────────────── */

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex-shrink-0 w-[220px] bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Badges */}
      <div className="relative">
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.badges.map((b) => (
            <span
              key={b.label}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${b.color}`}
            >
              {b.label}
            </span>
          ))}
        </div>
        {/* Image */}
        <div className="w-full h-[180px] bg-white flex items-center justify-center p-4">
          <Image
            src={product.image}
            alt={product.name}
            width={160}
            height={160}
            className="object-contain max-h-[160px] group-hover:scale-105 transition-transform"
          />
        </div>
      </div>

      <div className="p-3 space-y-2">
        {/* Discount badge */}
        {product.discount && (
          <span className="inline-block text-[11px] font-bold text-white bg-red-500 rounded px-2 py-0.5">
            {product.discount}
          </span>
        )}

        {/* Title */}
        <p className="text-xs text-gray-700 leading-snug line-clamp-2 h-8">
          {product.name}
        </p>

        {/* Fulfilled */}
        {product.fulfilled && (
          <span className="inline-block text-[10px] font-semibold text-[#76b900] border border-[#76b900] rounded px-1.5 py-0.5">
            Fulfilled by Microless
          </span>
        )}

        {/* Price */}
        <div className="pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] text-gray-400">AED</span>
            <span className="text-base font-bold text-gray-900">
              {product.price}
            </span>
          </div>
          {product.originalPrice && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 line-through">
                AED {product.originalPrice}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrollableRow({
  title,
  products,
  seeMore,
}: {
  title: string;
  products: Product[];
  seeMore?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 460;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-wide uppercase">
          {title}
        </h2>
        {seeMore && (
          <button className="text-sm text-gray-500 hover:text-[#f5c518] transition-colors">
            See more
          </button>
        )}
      </div>

      <div className="relative group/row">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white"
        >
          <CaretLeft size={18} className="text-gray-600" />
        </button>

        {/* Products */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white"
        >
          <CaretRight size={18} className="text-gray-600" />
        </button>
      </div>
    </section>
  );
}

/* ── page ─────────────────────────────────────────────────────── */

export default function EcommerceHome() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = HERO_SLIDES[activeSlide];

  const prevSlide = () =>
    setActiveSlide((s) => (s === 0 ? HERO_SLIDES.length - 1 : s - 1));
  const nextSlide = () =>
    setActiveSlide((s) => (s === HERO_SLIDES.length - 1 ? 0 : s + 1));

  return (
    <>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="relative z-10 min-h-screen bg-[#f5f5f5] text-gray-900"
        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
      >
        {/* ── Top banner bar ── */}
        <div className="bg-[#1a1a1a] text-white text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-1">
              <span>Deliver to</span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span className="text-base">🇦🇪</span> Dubai
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-gray-300">
              <span className="flex items-center gap-1">
                <CurrencyDollar size={14} /> Cash on Delivery
              </span>
              <span className="flex items-center gap-1">
                <Truck size={14} /> Express Delivery
              </span>
              <span className="flex items-center gap-1">
                <ArrowsClockwise size={14} /> Free Returns
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> Our Location
              </span>
              <span>Sell On Microless</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">AED</span>
              <span className="text-gray-400">English</span>
            </div>
          </div>
        </div>

        {/* ── Header ── */}
        <header className="bg-[#1a1a1a] border-b border-gray-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
            <Link href="/ecommerce" className="flex-shrink-0">
              <span className="text-2xl font-bold text-white tracking-tight">
                Micro<span className="text-[#f5c518]">less</span>
              </span>
            </Link>

            <div className="flex-1 max-w-2xl">
              <div className="flex">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full px-4 py-2.5 rounded-l-md bg-white text-gray-900 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                />
                <button className="px-4 bg-[#f5c518] hover:bg-[#e6b800] rounded-r-md transition-colors">
                  <MagnifyingGlass
                    size={20}
                    weight="bold"
                    className="text-[#1a1a1a]"
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-white">
              <button className="flex flex-col items-center gap-0.5 text-xs hover:text-[#f5c518] transition-colors">
                <User size={22} />
                <span className="hidden sm:block">YOUR ACCOUNT</span>
              </button>
              <button className="flex flex-col items-center gap-0.5 text-xs hover:text-[#f5c518] transition-colors">
                <Heart size={22} />
                <span className="hidden sm:block">WISHLIST</span>
              </button>
              <button className="relative flex flex-col items-center gap-0.5 text-xs hover:text-[#f5c518] transition-colors">
                <ShoppingCart size={22} />
                <span className="hidden sm:block">YOUR CART</span>
                <span className="absolute -top-1 -right-2 bg-[#f5c518] text-[#1a1a1a] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Category nav ── */}
        <nav className="bg-[#2a2a2a] border-b border-gray-700">
          <div className="max-w-7xl mx-auto flex items-center px-4 gap-0 overflow-x-auto">
            {NAV_CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors ${
                  i === 0
                    ? "bg-[#f5c518] text-[#1a1a1a]"
                    : "text-white hover:bg-[#3a3a3a]"
                }`}
              >
                {i === 0 && <List size={16} weight="bold" />}
                {cat}
              </button>
            ))}
            <button className="px-4 py-3 text-xs font-semibold tracking-wide text-red-400 hover:bg-[#3a3a3a] whitespace-nowrap transition-colors">
              NEW RELEASES
            </button>
            <button className="px-4 py-3 text-xs font-semibold tracking-wide text-red-400 hover:bg-[#3a3a3a] whitespace-nowrap transition-colors">
              CLEARANCE SALE
            </button>
          </div>
        </nav>

        {/* ── Hero banner carousel ── */}
        <section className="max-w-7xl mx-auto px-4 mt-4">
          <div
            className={`relative rounded-lg overflow-hidden bg-gradient-to-r ${slide.bg} h-[340px] md:h-[400px]`}
          >
            {/* Background image overlay */}
            <div className="absolute inset-0 opacity-30">
              <Image
                src="/demo/home/hero-cases.jpg"
                alt="PC Cases"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center h-full px-8 md:px-16">
              <div className="flex-1 space-y-3">
                <p className="text-sm md:text-base text-gray-300 uppercase tracking-wider">
                  {slide.headline}
                </p>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                  {slide.subline}
                  <br />
                  <span className="text-[#f5c518]">{slide.accent}</span>
                </h2>
                <button className="mt-4 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-sm rounded transition-all shadow-lg">
                  {slide.cta}
                </button>
              </div>

              <div className="hidden md:flex flex-col items-center justify-center text-center px-8">
                <p className="text-3xl md:text-5xl font-black text-white leading-none">
                  {slide.offer.split(" ").slice(0, 2).join(" ")}
                </p>
                <p className="text-5xl md:text-7xl font-black text-[#f5c518] leading-none mt-1">
                  {slide.offer.split(" ").slice(2).join(" ")}
                </p>
                <p className="text-sm text-gray-300 mt-2 uppercase tracking-wider">
                  {slide.offerSub}
                </p>
              </div>
            </div>

            {/* Left/Right arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors"
            >
              <CaretLeft size={22} className="text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors"
            >
              <CaretRight size={22} className="text-white" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activeSlide === i
                      ? "bg-[#f5c518] w-6"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Main content ── */}
        <main className="max-w-7xl mx-auto px-4 pb-16">
          {/* Daily Offers */}
          <ScrollableRow
            title="Daily Offers"
            products={DAILY_OFFERS}
            seeMore
          />

          {/* Shop by Category */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 tracking-wide uppercase mb-4">
              Shop by Category
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#f5c518] hover:shadow-md transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </span>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Top Selling */}
          <ScrollableRow
            title="Top Selling"
            products={TOP_SELLING}
            seeMore
          />

          {/* Promotional banner */}
          <section className="mt-10 rounded-lg overflow-hidden bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-8 md:p-12 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-400 uppercase tracking-wider">
                Free & Fast Delivery
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Get it delivered to your doorstep
              </h3>
              <p className="text-sm text-gray-400">
                Orders over AED 100 qualify for free express delivery across the
                UAE.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#f5c518]/10 flex items-center justify-center">
                <Truck size={32} className="text-[#f5c518]" />
              </div>
              <div className="w-16 h-16 rounded-full bg-[#76b900]/10 flex items-center justify-center">
                <ArrowsClockwise size={32} className="text-[#76b900]" />
              </div>
            </div>
          </section>

          {/* Recently viewed placeholder */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 tracking-wide uppercase mb-4">
              Recently Viewed
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {DAILY_OFFERS.slice(0, 4).map((p) => (
                <ProductCard key={`rv-${p.id}`} product={p} />
              ))}
            </div>
          </section>

          {/* Customer reviews banner */}
          <section className="mt-10 bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    weight="fill"
                    className="text-[#f5c518]"
                  />
                ))}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  Rated 4.8 out of 5
                </p>
                <p className="text-sm text-gray-500">
                  Based on 12,400+ customer reviews
                </p>
              </div>
            </div>
            <button className="px-6 py-2 text-sm font-semibold border border-[#f5c518] text-[#1a1a1a] rounded hover:bg-[#f5c518]/10 transition-colors">
              Read Reviews
            </button>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="bg-[#1a1a1a] text-gray-400">
          <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <h4 className="text-white font-semibold mb-3">Shop</h4>
              <ul className="space-y-2">
                <li className="hover:text-[#f5c518] transition-colors">
                  Computers & Laptops
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Office & Networking
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Mobiles & Tablets
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Electronics
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">
                Customer Service
              </h4>
              <ul className="space-y-2">
                <li className="hover:text-[#f5c518] transition-colors">
                  Contact Us
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Returns & Refunds
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Warranty
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  FAQ
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">About</h4>
              <ul className="space-y-2">
                <li className="hover:text-[#f5c518] transition-colors">
                  About Microless
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Careers
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Sell on Microless
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Follow Us</h4>
              <ul className="space-y-2">
                <li className="hover:text-[#f5c518] transition-colors">
                  Facebook
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Twitter
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  Instagram
                </li>
                <li className="hover:text-[#f5c518] transition-colors">
                  YouTube
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 text-center py-4 text-xs text-gray-500">
            © 2026 Microless. All rights reserved. — Demo page for Sobek
            integration.
          </div>
        </footer>
      </div>

    </>
  );
}
