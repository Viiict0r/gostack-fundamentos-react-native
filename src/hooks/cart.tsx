import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('@goMarket:cart');

      if (data) setProducts(JSON.parse(data));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const product = products.find(prd => prd.id === id);

      if (product) {
        const index = products.findIndex(prd => prd.id === id);

        product.quantity += 1;

        const newData = [...products];
        newData[index] = product;

        setProducts(newData);
        await AsyncStorage.setItem('@goMarket:cart', JSON.stringify(newData));
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(prd => prd.id === id);

      if (product) {
        const index = products.findIndex(prd => prd.id === id);

        product.quantity -= 1;

        const newData = [...products];
        newData[index] = product;

        setProducts(newData);
        await AsyncStorage.setItem('@goMarket:cart', JSON.stringify(newData));
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const hasProductInCart = products.find(prd => prd.id === product.id);

      if (hasProductInCart) {
        increment(product.id);
        return;
      }

      Object.assign(product, { quantity: 1 });

      const newData = [...products, product];

      setProducts(newData);

      await AsyncStorage.setItem('@goMarket:cart', JSON.stringify(newData));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
