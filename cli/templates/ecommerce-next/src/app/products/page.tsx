'use client';

import { useState } from 'react';
import { ShoppingCart, Star, Filter } from 'lucide-react';
import { useCart } from '../lib/store';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  category: string;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Headphones',
    price: 299,
    image: '/headphones.jpg',
    rating: 4.8,
    category: 'Electronics',
  },
  {
    id: '2',
    name: 'Wireless Keyboard',
    price: 149,
    image: '/keyboard.jpg',
    rating: 4.5,
    category: 'Electronics',
  },
  {
    id: '3',
    name: 'Smart Watch Pro',
    price: 399,
    image: '/watch.jpg',
    rating: 4.9,
    category: 'Wearables',
  },
  {
    id: '4',
    name: 'Minimalist Backpack',
    price: 89,
    image: '/backpack.jpg',
    rating: 4.6,
    category: 'Accessories',
  },
  {
    id: '5',
    name: 'Bluetooth Speaker',
    price: 79,
    image: '/speaker.jpg',
    rating: 4.4,
    category: 'Electronics',
  },
  {
    id: '6',
    name: 'USB-C Hub',
    price: 49,
    image: '/hub.jpg',
    rating: 4.3,
    category: 'Accessories',
  },
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem, items } = useCart();

  const categories = [...new Set(PRODUCTS.map((p) => p.category))];
  const filteredProducts = selectedCategory
    ? PRODUCTS.filter((p) => p.category === selectedCategory)
    : PRODUCTS;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ShopNext
          </h1>
          <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <ShoppingCart className="w-6 h-6" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="flex items-center gap-4 mb-8">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                !selectedCategory
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  {product.name}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{product.rating}</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${product.price}</span>
                  <button
                    onClick={() => addItem(product)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
