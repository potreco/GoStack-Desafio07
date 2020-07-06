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
  /**
   * Querido Deus da programação, por favor, me perdoe pelo que
   * está por vir, não encontrei outra forma de fazer!
   * Foi mal :(
   */

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.removeItem('@GoMarketplace:cart');
      const cart = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (!cart) {
        setProducts([]);
        return;
      }

      setProducts(JSON.parse(cart));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const addedProduct = product;

      const inCartProducts: Product[] = products.filter(
        (inCartProduct: Product) => inCartProduct.id === addedProduct.id,
      );

      const othersInCartProducts: Product[] = products.filter(
        (inCartProduct: Product) => inCartProduct.id !== addedProduct.id,
      );

      if (inCartProducts.length > 0) {
        const qtd = inCartProducts.reduce((total, inCartProduct) => {
          return total + inCartProduct.quantity;
        }, 0);
        addedProduct.quantity = qtd + 1;
      } else {
        addedProduct.quantity = 1;
      }

      setProducts([...othersInCartProducts, addedProduct]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const inCartProduct: Product[] = products.filter(
        (product: Product) => product.id === id,
      );

      const othersInCartProducts: Product[] = products.filter(
        (product: Product) => product.id !== id,
      );

      const product = inCartProduct[0];

      product.quantity += 1;

      setProducts([...othersInCartProducts, product]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const inCartProduct: Product[] = products.filter(
        (product: Product) => product.id === id,
      );

      const othersInCartProducts: Product[] = products.filter(
        (product: Product) => product.id !== id,
      );

      const product = inCartProduct[0];

      product.quantity -= 1;

      setProducts([...othersInCartProducts, product]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
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
