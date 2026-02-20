"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MagnifyingGlass,
  User,
  Heart,
  ShoppingCart,
  List,
  ShareNetwork,
  CheckCircle,
  Truck,
  ArrowsClockwise,
  CurrencyDollar,
  MapPin,
  CaretRight,
  CaretDown,
  Star,
  ShieldCheck,
} from "@phosphor-icons/react";

const WARRANTY_OPTIONS = [
  { label: "1 Year manufacturer warranty", price: "Free", default: true },
  { label: "2 Year warranty", price: "+ AED 10,626.00" },
  { label: "3 Year warranty", price: "+ AED 21,252.00" },
];

const PRODUCT_IMAGES = [
  { src: "/demo/h100-main.png", alt: "NVIDIA H100 PCIe - 3/4 view" },
  { src: "/demo/h100-front.jpg", alt: "NVIDIA H100 PCIe - front angle" },
  { src: "/demo/h100-lenovo.jpg", alt: "NVIDIA H100 PCIe - top angle" },
  { src: "/demo/h100-nvidia-hpc.jpg", alt: "NVIDIA H100 in HPC system" },
];

const NAV_CATEGORIES = [
  "ALL CATEGORIES",
  "COMPUTERS & LAPTOPS",
  "OFFICE & NETWORKING",
  "MOBILES & TABLETS",
  "ELECTRONICS",
  "HOME",
];

const BREADCRUMB = [
  "Home",
  "Computers & Laptops",
  "Computer Hardware",
  "Video / Graphic Cards",
];

export default function EcommerceDemo() {
  const [selectedWarranty, setSelectedWarranty] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <>
      {/* Override the global cursor:none from globals.css for this demo page */}
      <style>{`
        .ecommerce-demo *, .ecommerce-demo { cursor: auto !important; }
        .ecommerce-demo button, .ecommerce-demo a, .ecommerce-demo select,
        .ecommerce-demo label, .ecommerce-demo input[type="checkbox"],
        .ecommerce-demo input[type="radio"],
        .ecommerce-demo [role="button"] { cursor: pointer !important; }
        .ecommerce-demo input[type="text"] { cursor: text !important; }
      `}</style>
    <div className="ecommerce-demo relative z-10 min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Top banner bar */}
      <div className="bg-[#1a1a1a] text-white text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <span>Deliver to</span>
            <span className="inline-flex items-center gap-1 font-semibold">
              <span className="text-base">🇦🇪</span> Dubai
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-gray-300">
            <span className="flex items-center gap-1"><CurrencyDollar size={14} /> Cash on Delivery</span>
            <span className="flex items-center gap-1"><Truck size={14} /> Express Delivery</span>
            <span className="flex items-center gap-1"><ArrowsClockwise size={14} /> Free Returns</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> Our Location</span>
            <span>Sell On Microless</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400">AED</span>
            <span className="text-gray-400">English</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-white tracking-tight">
              Micro<span className="text-[#f5c518]">less</span>
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="flex">
              <input
                type="text"
                placeholder="What are you looking for?"
                className="w-full px-4 py-2.5 rounded-l-md bg-white text-gray-900 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                style={{ cursor: "text" }}
              />
              <button
                className="px-4 bg-[#f5c518] hover:bg-[#e6b800] rounded-r-md transition-colors"
                style={{ cursor: "pointer" }}
              >
                <MagnifyingGlass size={20} weight="bold" className="text-[#1a1a1a]" />
              </button>
            </div>
          </div>

          {/* Account / Wishlist / Cart */}
          <div className="flex items-center gap-6 text-white">
            <button className="flex flex-col items-center gap-0.5 text-xs hover:text-[#f5c518] transition-colors" style={{ cursor: "pointer" }}>
              <User size={22} />
              <span className="hidden sm:block">YOUR ACCOUNT</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-xs hover:text-[#f5c518] transition-colors" style={{ cursor: "pointer" }}>
              <Heart size={22} />
              <span className="hidden sm:block">WISHLIST</span>
            </button>
            <button className="relative flex flex-col items-center gap-0.5 text-xs hover:text-[#f5c518] transition-colors" style={{ cursor: "pointer" }}>
              <ShoppingCart size={22} />
              <span className="hidden sm:block">YOUR CART</span>
              <span className="absolute -top-1 -right-2 bg-[#f5c518] text-[#1a1a1a] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Category nav */}
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
              style={{ cursor: "pointer" }}
            >
              {i === 0 && <List size={16} weight="bold" />}
              {cat}
            </button>
          ))}
          <button className="px-4 py-3 text-xs font-semibold tracking-wide text-red-400 hover:bg-[#3a3a3a] whitespace-nowrap transition-colors" style={{ cursor: "pointer" }}>
            NEW RELEASES
          </button>
          <button className="px-4 py-3 text-xs font-semibold tracking-wide text-red-400 hover:bg-[#3a3a3a] whitespace-nowrap transition-colors" style={{ cursor: "pointer" }}>
            CLEARANCE SALE
          </button>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          {BREADCRUMB.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1">
              {i > 0 && <CaretRight size={12} className="text-gray-400" />}
              <span className={`hover:text-[#f5c518] transition-colors ${i === BREADCRUMB.length - 1 ? "text-gray-700" : ""}`} style={{ cursor: "pointer" }}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Main product area */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column - Product image */}
          <div className="lg:col-span-5">
            {/* Main image */}
            <div className="bg-[#f7f7f7] rounded-lg p-6 flex items-center justify-center aspect-square border border-gray-100 overflow-hidden">
              <Image
                src={PRODUCT_IMAGES[selectedThumb].src}
                alt={PRODUCT_IMAGES[selectedThumb].alt}
                width={600}
                height={600}
                className="object-contain w-full h-full"
                priority
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 mt-3">
              {PRODUCT_IMAGES.map((img, i) => (
                <button
                  key={img.src}
                  onClick={() => setSelectedThumb(i)}
                  className={`w-16 h-16 rounded border-2 transition-all overflow-hidden bg-[#f7f7f7] ${
                    selectedThumb === i
                      ? "border-[#f5c518] shadow-sm"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={64}
                    height={64}
                    className="object-contain w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Middle column - Product details */}
          <div className="lg:col-span-4 space-y-5">
            <h1 className="text-xl font-semibold leading-snug text-gray-900">
              NVIDIA H100 PCIe Tensor Core Workstation Graphics Card, 80GB 5120
              bits HBM2 Memory, 1935 GB/s Memory Speed, 14592 Stream Processors,
              Tensor Cores 456 | 900-21010-0000-000 / 90SKC000-M7LAN0
            </h1>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>
                <strong className="text-gray-900">Model:</strong> H100 PCIe
              </span>
              <span>
                <strong className="text-gray-900">SKU:</strong> 128540
              </span>
            </div>

            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#f5c518] transition-colors" style={{ cursor: "pointer" }}>
              <ShareNetwork size={16} />
              Share
            </button>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start gap-3">
                <span className="font-semibold text-gray-900">Warranty:</span>
                <div>
                  <span className="font-bold text-gray-900">1 Year</span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Effortless warranty claims with global coverage; shipping
                    costs are on us*.{" "}
                    <span className="text-blue-600 hover:underline" style={{ cursor: "pointer" }}>
                      Learn more
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                style={{ cursor: "pointer" }}
              >
                <Heart
                  size={20}
                  weight={wishlisted ? "fill" : "regular"}
                  className={wishlisted ? "text-red-500" : ""}
                />
              </button>
              <label className="flex items-center gap-1.5 text-sm text-gray-500" style={{ cursor: "pointer" }}>
                <input type="checkbox" className="accent-[#f5c518]" style={{ cursor: "pointer" }} />
                Compare
              </label>
            </div>

            {/* NVIDIA logo */}
            <div className="flex justify-end">
              <Image
                src="/demo/nvidia-logo.png"
                alt="NVIDIA"
                width={100}
                height={56}
                className="object-contain"
              />
            </div>

            <p className="text-sm text-gray-400 flex items-center gap-1">
              <input type="checkbox" className="accent-gray-400" style={{ cursor: "pointer" }} />
              Report incorrect or inappropriate product information.
            </p>
          </div>

          {/* Right column - Price & actions */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 sticky top-4">
              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-500">AED</span>
                  <span className="text-3xl font-bold text-gray-900">132,825.00</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Inclusive of VAT</p>
                <p className="text-xs text-gray-500 mt-1">
                  As low as AED <strong>11,068.75</strong> per month{" "}
                  <span className="text-blue-600">↗</span>
                </p>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Sold By: </span>
                <strong className="text-gray-900">Microless</strong>
              </div>

              <span className="inline-block text-xs font-semibold text-[#76b900] border border-[#76b900] rounded px-2 py-1">
                Fulfilled by Microless
              </span>

              {/* Warranty selection */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Select your warranty</p>
                {WARRANTY_OPTIONS.map((opt, i) => (
                  <label
                    key={opt.label}
                    className={`flex items-center gap-2 text-sm p-2 rounded transition-colors ${
                      selectedWarranty === i ? "bg-[#f5c518]/10" : "hover:bg-gray-50"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="warranty"
                      checked={selectedWarranty === i}
                      onChange={() => setSelectedWarranty(i)}
                      className="accent-[#76b900]"
                      style={{ cursor: "pointer" }}
                    />
                    <span className="flex-1">{opt.label}</span>
                    <span className={`font-semibold ${opt.default ? "text-gray-900" : "text-gray-600"}`}>
                      {opt.price}
                    </span>
                  </label>
                ))}
              </div>

              {/* Stock status */}
              <p className="text-[#76b900] font-bold text-lg">In Stock</p>

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="appearance-none w-16 px-3 py-2.5 border border-gray-300 rounded text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                    style={{ cursor: "pointer" }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <CaretDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-[#f5c518] hover:bg-[#e6b800] text-[#1a1a1a] font-bold py-2.5 px-6 rounded transition-colors text-sm"
                  style={{ cursor: "pointer" }}
                >
                  <ShoppingCart size={18} weight="fill" />
                  Add To Cart
                </button>
              </div>

              {/* Condition */}
              <div className="flex items-center gap-2 text-sm border-t border-gray-200 pt-4">
                <ShieldCheck size={18} className="text-gray-500" />
                <span className="text-gray-500">Condition:</span>
                <strong>New</strong>
              </div>

              {/* Availability */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle size={18} weight="fill" className="text-blue-600" />
                  Available In
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 hover:underline" style={{ cursor: "pointer" }}>
                    Showroom - Dubai, Al Quoz
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-0.5 bg-gray-300 rounded" />
                    <span className="text-gray-500">0</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Warehouse</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-0.5 bg-[#76b900] rounded" />
                    <span className="text-gray-700 font-medium">Many</span>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Truck size={18} className="text-gray-600" />
                    Deliver To Dubai
                  </div>
                  <button className="text-sm text-blue-600 flex items-center gap-1" style={{ cursor: "pointer" }}>
                    Change <CaretDown size={12} />
                  </button>
                </div>
                <div className="text-sm">
                  <strong>FREE</strong> Delivery{" "}
                  <span className="text-[#76b900] font-semibold">Mar 03</span>
                </div>
                <p className="text-xs text-gray-500">
                  If you order within 14 Hours, 18 Minutes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description section */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#f5c518] rounded-full inline-block" />
            Description for NVIDIA H100 PCIe Tensor Core Workstation Graphics Card
          </h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                The Most Powerful GPU for AI and HPC
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                The NVIDIA H100 Tensor Core GPU delivers world-leading
                performance, scalability, and security for the largest AI
                models. The NVIDIA H100 is based on the new NVIDIA Hopper
                GPU architecture and is designed to give you order-of-magnitude
                improvements for large-scale AI and HPC compared to the prior
                generation.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                With its Transformer Engine, fourth-generation Tensor Cores,
                and advanced connectivity via NVLink and PCIe Gen5, the H100
                PCIe is the ultimate accelerator for demanding AI training,
                inference, and HPC workloads in mainstream server platforms.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Key Specifications
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {[
                  ["GPU Architecture", "NVIDIA Hopper"],
                  ["CUDA Cores", "14,592"],
                  ["Tensor Cores", "456 (4th Gen)"],
                  ["GPU Memory", "80GB HBM2e"],
                  ["Memory Bandwidth", "1,935 GB/s"],
                  ["Memory Interface", "5120-bit"],
                  ["Interconnect", "PCIe Gen5 x16"],
                  ["Form Factor", "Dual-slot, Full-height"],
                  ["TDP", "350W"],
                ].map(([key, value], i) => (
                  <div
                    key={key}
                    className={`flex justify-between px-4 py-2.5 text-sm ${
                      i % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <span className="text-gray-500">{key}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews placeholder */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#f5c518] rounded-full inline-block" />
            Customer Reviews
          </h2>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={20} weight="fill" className="text-[#f5c518]" />
              ))}
            </div>
            <span className="text-sm text-gray-500">No reviews yet</span>
          </div>
          <button
            className="mt-4 px-6 py-2 text-sm font-semibold border border-[#f5c518] text-[#1a1a1a] rounded hover:bg-[#f5c518]/10 transition-colors"
            style={{ cursor: "pointer" }}
          >
            Write a Review
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="text-white font-semibold mb-3">Shop</h4>
            <ul className="space-y-2">
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Computers & Laptops</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Office & Networking</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Mobiles & Tablets</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Electronics</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Customer Service</h4>
            <ul className="space-y-2">
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Contact Us</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Returns & Refunds</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Warranty</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">About</h4>
            <ul className="space-y-2">
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">About Microless</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Careers</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Sell on Microless</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Follow Us</h4>
            <ul className="space-y-2">
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Facebook</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Twitter</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">Instagram</li>
              <li style={{ cursor: "pointer" }} className="hover:text-[#f5c518] transition-colors">YouTube</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 text-center py-4 text-xs text-gray-500">
          © 2026 Microless. All rights reserved. — Demo page for Sobek integration.
        </div>
      </footer>
    </div>
    </>
  );
}
