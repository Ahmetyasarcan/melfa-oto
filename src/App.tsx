// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, ChangeEvent, useCallback, ReactElement } from 'react';
import { Layout, Menu, Button, Card, Modal, Form, Input, message, notification, Drawer, Row, Col, Carousel, Badge, Divider, Empty } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, MenuOutlined, HomeOutlined, AppstoreOutlined, InfoCircleOutlined, PhoneOutlined, MailOutlined, DeleteOutlined, RightOutlined, LeftOutlined, PlusOutlined, MinusOutlined, FacebookOutlined, InstagramOutlined, TwitterOutlined, LinkedinOutlined, CheckCircleFilled, SettingOutlined } from '@ant-design/icons';
import logo from './assets/melfa-logo.png';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './components/Login';
import Settings from './components/Settings';
import soldoutImg from './assets/soldout.jpeg';

const { Header, Content, Footer } = Layout;
const { Meta } = Card;
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  brand: string;
  images: string[];
  stock: number;
  isNew?: boolean; // yeni ürün işareti
}
interface CartItem extends Product {
  quantity: number;
}

interface InfoModalState {
  visible: boolean;
  title: string;
  content: React.ReactNode;
}

interface RawProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  brand: string;
  image: string;
  stock: number;
  isNew?: boolean; // yeni ürün işareti
}

interface ScrollState {
  startTime: number | null;
  startPosition: number;
  distance: number;
  duration: number;
}

const animateScroll = (scrollState: ScrollState, currentTime: number): void => {
  if (!scrollState.startTime) {
    scrollState.startTime = currentTime;
  }
  const progress = Math.min((currentTime - scrollState.startTime) / scrollState.duration, 1);
  window.scrollTo(0, scrollState.startPosition + (scrollState.distance * progress));
  if (progress < 1) {
    window.requestAnimationFrame((time) => animateScroll(scrollState, time));
  }
};

const App: React.FC = (): ReactElement | null => {
  const [mobileMenuVisible, setMobileMenuVisible] = useState<boolean>(false);
  const [cartVisible, setCartVisible] = useState<boolean>(false);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandModalVisible, setBrandModalVisible] = useState<boolean>(false);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResultsVisible, setSearchResultsVisible] = useState<boolean>(false);
  const [activeQuickLink, setActiveQuickLink] = useState<string | null>(null);
  const [privacyModalVisible, setPrivacyModalVisible] = useState<boolean>(false);
  const [infoModal, setInfoModal] = useState<InfoModalState>({visible: false, title: '', content: null});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8; // Her sayfada gösterilecek ürün sayısı
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const rawProducts = [
    {
      id: 1,
      name: "Fiat Egea Ön Tampon",
      price: 8500,
      category: "Kaporta",
      brand: "Fiat",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20front%20bumper%20for%20Fiat%20Egea%20car%2C%20automotive%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20automotive%20component%2C%20car%20body%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=1&orientation=landscape",
      stock: 120,
      isNew: false
    },
    {
      id: 2,
      name: "Renault Clio Motor Contası",
      price: 6200,
      category: "Mekanik",
      brand: "Renault",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20engine%20gasket%20for%20Renault%20Clio%2C%20automotive%20engine%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20engine%20seal%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=2&orientation=landscape",
      stock: 80,
      isNew: false
    },
    {
      id: 3,
      name: "Dacia Duster Ön Far",
      price: 9500,
      category: "Kaporta",
      brand: "Dacia",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20headlight%20for%20Dacia%20Duster%20SUV%2C%20automotive%20lighting%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20front%20light%20component%2C%20car%20exterior%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=3&orientation=landscape",
      stock: 60,
      isNew: false
    },
    {
      id: 4,
      name: "Alfa Romeo Giulietta Fren Balatası",
      price: 5400,
      category: "Mekanik",
      brand: "Alfa Romeo",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20brake%20pad%20set%20for%20Alfa%20Romeo%20Giulietta%2C%20automotive%20braking%20system%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20car%20brake%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=4&orientation=landscape",
      stock: 32,
      isNew: false
    },
    {
      id: 5,
      name: "Jeep Renegade Yan Ayna",
      price: 950,
      category: "Kaporta",
      brand: "Jeep",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20side%20mirror%20for%20Jeep%20Renegade%20SUV%2C%20automotive%20exterior%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20car%20mirror%20component%2C%20car%20body%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=5&orientation=landscape",
      stock: 11,
      isNew: false
    },
    {
      id: 6,
      name: "Fiat Doblo Radyatör",
      price: 780,
      category: "Mekanik",
      brand: "Fiat",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20radiator%20for%20Fiat%20Doblo%20van%2C%20automotive%20cooling%20system%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20engine%20cooling%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=6&orientation=landscape",
      stock: 19,
      isNew: false
    },
    {
      id: 7,
      name: "Renault Megane Arka Tampon",
      price: 1100,
      category: "Kaporta",
      brand: "Renault",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20rear%20bumper%20for%20Renault%20Megane%20car%2C%20automotive%20body%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20exterior%20component%2C%20car%20body%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=7&orientation=landscape",
      stock: 7,
      isNew: false
    },
    {
      id: 8,
      name: "Jeep Compass Yağ Filtresi",
      price: 120,
      category: "Mekanik",
      brand: "Jeep",
      image: "https://readdy.ai/api/search-image?query=A%20high-quality%20oil%20filter%20for%20Jeep%20Compass%20SUV%2C%20automotive%20engine%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20engine%20maintenance%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=8&orientation=landscape",
      stock: 45,
      isNew: false
    },
    {
      id: 17,
      name: "Ford Focus Ön Süspansiyon",
      price: 1850,
      category: "Mekanik",
      brand: "Ford",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 18,
      name: "Hyundai i20 Debriyaj Seti",
      price: 1650,
      category: "Mekanik",
      brand: "Hyundai",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 19,
      name: "Kia Sportage Arka Tampon",
      price: 1950,
      category: "Kaporta",
      brand: "Kia",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 20,
      name: "Mazda 3 Motor Yağı Filtresi",
      price: 180,
      category: "Mekanik",
      brand: "Mazda",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 21,
      name: "Nissan Qashqai Ön Far",
      price: 1350,
      category: "Kaporta",
      brand: "Nissan",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 22,
      name: "Suzuki Vitara Radyatör",
      price: 1450,
      category: "Mekanik",
      brand: "Suzuki",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 23,
      name: "Mitsubishi L200 Alternatör",
      price: 1550,
      category: "Mekanik",
      brand: "Mitsubishi",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 24,
      name: "Subaru Forester Direksiyon Kutusu",
      price: 2250,
      category: "Mekanik",
      brand: "Subaru",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 25,
      name: "Renault Megane Ön Süspansiyon",
      price: 1750,
      category: "Mekanik",
      brand: "Renault",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 26,
      name: "Dacia Duster Debriyaj Seti",
      price: 1550,
      category: "Mekanik",
      brand: "Dacia",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 27,
      name: "Seat Leon Arka Tampon",
      price: 1850,
      category: "Kaporta",
      brand: "Seat",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 28,
      name: "Skoda Octavia Motor Yağı Filtresi",
      price: 190,
      category: "Mekanik",
      brand: "Skoda",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 29,
      name: "Volvo XC60 Ön Far",
      price: 1650,
      category: "Kaporta",
      brand: "Volvo",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 30,
      name: "Land Rover Discovery Radyatör",
      price: 1950,
      category: "Mekanik",
      brand: "Land Rover",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 31,
      name: "Jaguar XE Alternatör",
      price: 1850,
      category: "Mekanik",
      brand: "Jaguar",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    },
    {
      id: 32,
      name: "Mini Cooper Direksiyon Kutusu",
      price: 2150,
      category: "Mekanik",
      brand: "Mini",
      image: soldoutImg,
      images: [soldoutImg],
      stock: 0,
      isNew: true
    }
  ];
  const transformProduct = (product: RawProduct): Product => {
    const baseImage = product.image;
    const images = [
      baseImage,
      baseImage.includes('seq=') ? baseImage.replace(/seq=\d+/, 'seq=101') : baseImage + '&seq=101',
      baseImage.includes('seq=') ? baseImage.replace(/seq=\d+/, 'seq=102') : baseImage + '&seq=102',
    ];
    return { ...product, images, isNew: product.isNew };
  };
  const [products, setProducts] = useState<Product[]>(
    rawProducts.map(transformProduct)
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mailModalVisible, setMailModalVisible] = useState(false);
  const [mailName, setMailName] = useState('');
  const [mailEmail, setMailEmail] = useState('');
  const [mailMessage, setMailMessage] = useState('');
  const [showMailSuccess, setShowMailSuccess] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderForm] = Form.useForm();
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [orderSummaryModalVisible, setOrderSummaryModalVisible] = useState(false);

  const handleMenuInfo = (title: string, content: React.ReactNode) => {
    setInfoModal({ visible: true, title, content });
  };
  const handleProductClick = (product: Product): void => {
    setSelectedProduct(product);
  };
  const addToCart = (product: Product): void => {
    const existingItem = cart.find((item: CartItem) => item.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };
  const removeFromCart = (productId: number): void => {
    setCart(cart.filter((item: CartItem) => item.id !== productId));
  };
  const updateQuantity = (productId: number, quantity: number): void => {
    setCart(cart.map((item: CartItem) => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };
  const calculateTotal = (): number => {
    return cart.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
  };
  const toggleMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };
  const toggleCart = () => {
    setCartVisible(!cartVisible);
  };
  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
  };
  const bannerImages = [
    {
      image: "https://readdy.ai/api/search-image?query=A%20professional%20automotive%20scene%20featuring%20various%20car%20parts%20for%20Fiat%2C%20Renault%2C%20Dacia%2C%20Alfa%20Romeo%20and%20Jeep%20brands.%20The%20image%20shows%20high-quality%20auto%20parts%20arranged%20elegantly%20against%20a%20clean%20gradient%20background.%20The%20lighting%20is%20perfect%20to%20highlight%20the%20metallic%20and%20plastic%20components.%20Modern%20and%20professional%20product%20photography%20style&width=1440&height=500&seq=9&orientation=landscape",
      title: "Orijinal Yedek Parçalar",
      description: "Aracınız için en kaliteli orijinal parçalar"
    },
    {
      image: "https://readdy.ai/api/search-image?query=A%20collection%20of%20automotive%20body%20parts%20including%20bumpers%2C%20hoods%2C%20and%20doors%20for%20various%20car%20brands%20displayed%20professionally.%20The%20parts%20are%20arranged%20in%20a%20showroom%20setting%20with%20soft%20lighting%20that%20highlights%20their%20contours.%20Clean%2C%20professional%20product%20photography%20with%20a%20simple%20background%20that%20emphasizes%20the%20quality%20of%20the%20auto%20parts&width=1440&height=500&seq=10&orientation=landscape",
      title: "Kaporta Parçaları",
      description: "Tüm araç modelleri için kaporta çözümleri"
    },
    {
      image: "https://readdy.ai/api/search-image?query=A%20professional%20display%20of%20mechanical%20auto%20parts%20including%20filters%2C%20belts%2C%20and%20engine%20components%20for%20various%20car%20brands.%20The%20mechanical%20parts%20are%20arranged%20in%20a%20technical%2C%20workshop-like%20setting%20with%20precise%20lighting%20that%20shows%20their%20details.%20Clean%2C%20professional%20product%20photography%20with%20a%20simple%20background%20that%20emphasizes%20the%20quality%20of%20the%20mechanical%20components&width=1440&height=500&seq=11&orientation=landscape",
      title: "Mekanik Parçalar",
      description: "Motor ve şanzıman için profesyonel çözümler"
    }
  ];
  const categories = [
    {
      name: "Kaporta Parçaları",
      description: "Tampon, far, kaput ve daha fazlası",
      image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80" // Unsplash: araba kaporta
    },
    {
      name: "Mekanik Parçalar",
      description: "Motor, şanzıman, fren ve süspansiyon parçaları",
      image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80" // Unsplash: otomotiv motor bloğu
    }
  ];
  const initialBrands = [
    {
      name: "Fiat",
      logo: "https://readdy.ai/api/search-image?query=Fiat%20car%20brand%20logo%20on%20a%20clean%20white%20background%2C%20professional%20automotive%20photography%2C%20minimalist%20design%2C%20high%20quality%20product%20shot%2C%20clear%20and%20crisp%20details%2C%20modern%20branding%20presentation&width=100&height=100&seq=14&orientation=squarish",
      products: [
        {
          id: 101,
          name: "Fiat Egea Ön Tampon",
          price: 1250,
          category: "Kaporta",
          brand: "Fiat",
          image: "https://readdy.ai/api/search-image?query=Front%20bumper%20for%20Fiat%20Egea%20car%2C%20automotive%20part%20on%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20car%20component&width=400&height=300&seq=15&orientation=landscape",
          stock: 15,
          isNew: false
        },
        {
          id: 102,
          name: "Fiat Doblo Radyatör",
          price: 780,
          category: "Mekanik",
          brand: "Fiat",
          image: "https://readdy.ai/api/search-image?query=Radiator%20for%20Fiat%20Doblo%20van%2C%20automotive%20cooling%20system%20part%20on%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20engine%20cooling%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=16&orientation=landscape",
          stock: 19,
          isNew: false
        }
      ]
    },
    {
      name: "Renault",
      logo: "https://readdy.ai/api/search-image?query=Renault%20car%20brand%20logo%20on%20a%20clean%20white%20background%2C%20professional%20automotive%20photography%2C%20minimalist%20design%2C%20high%20quality%20product%20shot%2C%20clear%20and%20crisp%20details%2C%20modern%20branding%20presentation&width=100&height=100&seq=17&orientation=squarish",
      products: [
        {
          id: 201,
          name: "Renault Clio Motor Contası",
          price: 350,
          category: "Mekanik",
          brand: "Renault",
          image: "https://readdy.ai/api/search-image?query=Engine%20gasket%20for%20Renault%20Clio%2C%20automotive%20engine%20part%20on%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component&width=400&height=300&seq=18&orientation=landscape",
          stock: 23,
          isNew: false
        },
        {
          id: 202,
          name: "Renault Megane Arka Tampon",
          price: 1100,
          category: "Kaporta",
          brand: "Renault",
          image: "https://readdy.ai/api/search-image?query=Rear%20bumper%20for%20Renault%20Megane%2C%20automotive%20body%20part%20on%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20exterior%20component&width=400&height=300&seq=19&orientation=landscape",
          stock: 7,
          isNew: false
        }
      ]
    },
    {
      name: "Dacia",
      logo: "https://readdy.ai/api/search-image?query=Dacia%20car%20brand%20logo%20on%20a%20clean%20white%20background%2C%20professional%20automotive%20photography%2C%20minimalist%20design%2C%20high%20quality%20product%20shot%2C%20clear%20and%20crisp%20details%2C%20modern%20branding%20presentation&width=100&height=100&seq=20&orientation=squarish",
      products: [
        {
          id: 301,
          name: "Dacia Duster Ön Far",
          price: 875,
          category: "Kaporta",
          brand: "Dacia",
          image: "https://readdy.ai/api/search-image?query=Headlight%20for%20Dacia%20Duster%20SUV%2C%20automotive%20lighting%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20front%20light%20component&width=400&height=300&seq=21&orientation=landscape",
          stock: 8,
          isNew: false
        }
      ]
    },
    {
      name: "Alfa Romeo",
      logo: "https://readdy.ai/api/search-image?query=Alfa%20Romeo%20car%20brand%20logo%20on%20a%20clean%20white%20background%2C%20professional%20automotive%20photography%2C%20minimalist%20design%2C%20high%20quality%20product%20shot%2C%20clear%20and%20crisp%20details%2C%20modern%20branding%20presentation&width=100&height=100&seq=22&orientation=squarish",
      products: [
        {
          id: 401,
          name: "Alfa Romeo Giulietta Fren Balatası",
          price: 450,
          category: "Mekanik",
          brand: "Alfa Romeo",
          image: "https://readdy.ai/api/search-image?query=Brake%20pad%20set%20for%20Alfa%20Romeo%20Giulietta%2C%20automotive%20braking%20system%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20car%20brake%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=23&orientation=landscape",
          stock: 32,
          isNew: false
        }
      ]
    },
    {
      name: "Jeep",
      logo: "https://readdy.ai/api/search-image?query=Jeep%20car%20brand%20logo%20on%20a%20clean%20white%20background%2C%20professional%20automotive%20photography%2C%20minimalist%20design%2C%20high%20quality%20product%20shot%2C%20clear%20and%20crisp%20details%2C%20modern%20branding%20presentation&width=100&height=100&seq=24&orientation=squarish",
      products: [
        {
          id: 501,
          name: "Jeep Renegade Yan Ayna",
          price: 950,
          category: "Kaporta",
          brand: "Jeep",
          image: "https://readdy.ai/api/search-image?query=Side%20mirror%20for%20Jeep%20Renegade%20SUV%2C%20automotive%20exterior%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20car%20mirror%20component%2C%20car%20body%20part%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=25&orientation=landscape",
          stock: 11,
          isNew: false
        }
      ]
    }
  ];
  const brands = initialBrands.map(brand => ({ ...brand, products: brand.products.map(transformProduct) }));
  const handleMailSend = () => {
    const subject = encodeURIComponent('Yedek Parça Talebi / Şikayet');
    const body = encodeURIComponent(
      `Ad: ${mailName}\nE-posta: ${mailEmail}\nMesaj: ${mailMessage}`
    );
    window.location.href = `mailto:melfaotoyedekparca@gmail.com?subject=${subject}&body=${body}`;
    setMailModalVisible(false);
    setMailName('');
    setMailEmail('');
    setMailMessage('');
    setShowMailSuccess(true);
    setTimeout(() => setShowMailSuccess(false), 2500);
  };

  // Fisher-Yates shuffle algoritması
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Ürünleri karıştır ve göster
  const shuffleAndShowProducts = () => {
    if (!hasMoreProducts) return;
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const shuffledProducts = shuffleArray(allProducts);
    const newProducts = shuffledProducts.slice(startIndex, endIndex);
    
    if (newProducts.length === 0) {
      setHasMoreProducts(false);
      return;
    }

    setDisplayedProducts(prevProducts => [...prevProducts, ...newProducts]);
    setCurrentPage(prev => prev + 1);
  };

  // Ürünleri göster
  const showMoreProducts = () => {
    if (!hasMoreProducts) return;
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const newProducts = allProducts.slice(startIndex, endIndex);
    
    // 32. üründen sonra hasMoreProducts'ı false yap
    if (displayedProducts.length + newProducts.length >= 32) {
      setHasMoreProducts(false);
    }

    if (newProducts.length === 0) {
      // Yeni ürünler ekle
      const additionalProductsRaw = currentPage === 3 ? [
        {
          id: 17,
          name: "Ford Focus Ön Süspansiyon",
          price: 1850,
          category: "Mekanik",
          brand: "Ford",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 18,
          name: "Hyundai i20 Debriyaj Seti",
          price: 1650,
          category: "Mekanik",
          brand: "Hyundai",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 19,
          name: "Kia Sportage Arka Tampon",
          price: 1950,
          category: "Kaporta",
          brand: "Kia",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 20,
          name: "Mazda 3 Motor Yağı Filtresi",
          price: 180,
          category: "Mekanik",
          brand: "Mazda",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 21,
          name: "Nissan Qashqai Ön Far",
          price: 1350,
          category: "Kaporta",
          brand: "Nissan",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 22,
          name: "Suzuki Vitara Radyatör",
          price: 1450,
          category: "Mekanik",
          brand: "Suzuki",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 23,
          name: "Mitsubishi L200 Alternatör",
          price: 1550,
          category: "Mekanik",
          brand: "Mitsubishi",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 24,
          name: "Subaru Forester Direksiyon Kutusu",
          price: 2250,
          category: "Mekanik",
          brand: "Subaru",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 25,
          name: "Renault Megane Ön Süspansiyon",
          price: 1750,
          category: "Mekanik",
          brand: "Renault",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 26,
          name: "Dacia Duster Debriyaj Seti",
          price: 1550,
          category: "Mekanik",
          brand: "Dacia",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 27,
          name: "Seat Leon Arka Tampon",
          price: 1850,
          category: "Kaporta",
          brand: "Seat",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 28,
          name: "Skoda Octavia Motor Yağı Filtresi",
          price: 190,
          category: "Mekanik",
          brand: "Skoda",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 29,
          name: "Volvo XC60 Ön Far",
          price: 1650,
          category: "Kaporta",
          brand: "Volvo",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 30,
          name: "Land Rover Discovery Radyatör",
          price: 1950,
          category: "Mekanik",
          brand: "Land Rover",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 31,
          name: "Jaguar XE Alternatör",
          price: 1850,
          category: "Mekanik",
          brand: "Jaguar",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 32,
          name: "Mini Cooper Direksiyon Kutusu",
          price: 2150,
          category: "Mekanik",
          brand: "Mini",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        }
      ] : currentPage === 2 ? [
        // İkinci ek ürün seti (17-24)
        {
          id: 17,
          name: "Ford Focus Ön Süspansiyon",
          price: 1850,
          category: "Mekanik",
          brand: "Ford",
          image: soldoutImg,
          images: [soldoutImg],
          stock: 0,
          isNew: true
        },
        {
          id: 18,
          name: "Hyundai i20 Debriyaj Seti",
          price: 1650,
          category: "Mekanik",
          brand: "Hyundai",
          image: soldoutImg,
          stock: 0,
          isNew: true
        },
        {
          id: 19,
          name: "Kia Sportage Arka Tampon",
          price: 1950,
          category: "Kaporta",
          brand: "Kia",
          image: soldoutImg,
          stock: 0,
          isNew: true
        },
        {
          id: 20,
          name: "Mazda 3 Motor Yağı Filtresi",
          price: 180,
          category: "Mekanik",
          brand: "Mazda",
          image: soldoutImg,
          stock: 0,
          isNew: true
        },
        {
          id: 21,
          name: "Nissan Qashqai Ön Far",
          price: 1350,
          category: "Kaporta",
          brand: "Nissan",
          image: soldoutImg,
          stock: 0,
          isNew: true
        },
        {
          id: 22,
          name: "Suzuki Vitara Radyatör",
          price: 1450,
          category: "Mekanik",
          brand: "Suzuki",
          image: require('./assets/soldout.jpeg'),
          stock: 0,
          isNew: true
        },
        {
          id: 23,
          name: "Mitsubishi L200 Alternatör",
          price: 1550,
          category: "Mekanik",
          brand: "Mitsubishi",
          image: require('./assets/soldout.jpeg'),
          stock: 0,
          isNew: true
        },
        {
          id: 24,
          name: "Subaru Forester Direksiyon Kutusu",
          price: 2250,
          category: "Mekanik",
          brand: "Subaru",
          image: require('./assets/soldout.jpeg'),
          stock: 0,
          isNew: true
        },
        {
          id: 25,
          name: "Renault Megane Ön Süspansiyon",
          price: 1750,
          category: "Mekanik",
          brand: "Renault",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20front%20suspension%20for%20Renault%20Megane%2C%20automotive%20suspension%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=47&orientation=landscape",
          stock: 14,
          isNew: true
        },
        {
          id: 26,
          name: "Dacia Duster Debriyaj Seti",
          price: 1550,
          category: "Mekanik",
          brand: "Dacia",
          image: "https://readdy.ai/api/search-image?query=A%20complete%20clutch%20kit%20for%20Dacia%20Duster%2C%20automotive%20transmission%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=48&orientation=landscape",
          stock: 18,
          isNew: true
        },
        {
          id: 27,
          name: "Seat Leon Arka Tampon",
          price: 1850,
          category: "Kaporta",
          brand: "Seat",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20rear%20bumper%20for%20Seat%20Leon%2C%20automotive%20body%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20exterior%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=49&orientation=landscape",
          stock: 11,
          isNew: true
        },
        {
          id: 28,
          name: "Skoda Octavia Motor Yağı Filtresi",
          price: 190,
          category: "Mekanik",
          brand: "Skoda",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20oil%20filter%20for%20Skoda%20Octavia%2C%20automotive%20engine%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=50&orientation=landscape",
          stock: 22,
          isNew: true
        },
        {
          id: 29,
          name: "Volvo XC60 Ön Far",
          price: 1650,
          category: "Kaporta",
          brand: "Volvo",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20headlight%20for%20Volvo%20XC60%2C%20automotive%20lighting%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20exterior%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=51&orientation=landscape",
          stock: 9,
          isNew: true
        },
        {
          id: 30,
          name: "Land Rover Discovery Radyatör",
          price: 1950,
          category: "Mekanik",
          brand: "Land Rover",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20radiator%20for%20Land%20Rover%20Discovery%2C%20automotive%20cooling%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=52&orientation=landscape",
          stock: 7,
          isNew: true
        },
        {
          id: 31,
          name: "Jaguar XE Alternatör",
          price: 1850,
          category: "Mekanik",
          brand: "Jaguar",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20alternator%20for%20Jaguar%20XE%2C%20automotive%20electrical%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=53&orientation=landscape",
          stock: 6,
          isNew: true
        },
        {
          id: 32,
          name: "Mini Cooper Direksiyon Kutusu",
          price: 2150,
          category: "Mekanik",
          brand: "Mini",
          image: "https://readdy.ai/api/search-image?query=A%20steering%20gear%20box%20for%20Mini%20Cooper%2C%20automotive%20steering%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=54&orientation=landscape",
          stock: 8,
          isNew: true
        }
      ] : [
        // Üçüncü ek ürün seti (25-32)
        {
          id: 25,
          name: "Renault Megane Ön Süspansiyon",
          price: 1750,
          category: "Mekanik",
          brand: "Renault",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20front%20suspension%20for%20Renault%20Megane%2C%20automotive%20suspension%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=47&orientation=landscape",
          stock: 14,
          isNew: true
        },
        {
          id: 26,
          name: "Dacia Duster Debriyaj Seti",
          price: 1550,
          category: "Mekanik",
          brand: "Dacia",
          image: "https://readdy.ai/api/search-image?query=A%20complete%20clutch%20kit%20for%20Dacia%20Duster%2C%20automotive%20transmission%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=48&orientation=landscape",
          stock: 18,
          isNew: true
        },
        {
          id: 27,
          name: "Seat Leon Arka Tampon",
          price: 1850,
          category: "Kaporta",
          brand: "Seat",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20rear%20bumper%20for%20Seat%20Leon%2C%20automotive%20body%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20exterior%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=49&orientation=landscape",
          stock: 11,
          isNew: true
        },
        {
          id: 28,
          name: "Skoda Octavia Motor Yağı Filtresi",
          price: 190,
          category: "Mekanik",
          brand: "Skoda",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20oil%20filter%20for%20Skoda%20Octavia%2C%20automotive%20engine%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=50&orientation=landscape",
          stock: 22,
          isNew: true
        },
        {
          id: 29,
          name: "Volvo XC60 Ön Far",
          price: 1650,
          category: "Kaporta",
          brand: "Volvo",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20headlight%20for%20Volvo%20XC60%2C%20automotive%20lighting%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20exterior%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=51&orientation=landscape",
          stock: 9,
          isNew: true
        },
        {
          id: 30,
          name: "Land Rover Discovery Radyatör",
          price: 1950,
          category: "Mekanik",
          brand: "Land Rover",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20radiator%20for%20Land%20Rover%20Discovery%2C%20automotive%20cooling%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=52&orientation=landscape",
          stock: 7,
          isNew: true
        },
        {
          id: 31,
          name: "Jaguar XE Alternatör",
          price: 1850,
          category: "Mekanik",
          brand: "Jaguar",
          image: "https://readdy.ai/api/search-image?query=A%20high-quality%20alternator%20for%20Jaguar%20XE%2C%20automotive%20electrical%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=53&orientation=landscape",
          stock: 6,
          isNew: true
        },
        {
          id: 32,
          name: "Mini Cooper Direksiyon Kutusu",
          price: 2150,
          category: "Mekanik",
          brand: "Mini",
          image: "https://readdy.ai/api/search-image?query=A%20steering%20gear%20box%20for%20Mini%20Cooper%2C%20automotive%20steering%20part%2C%20clean%20white%20background%2C%20professional%20product%20photography%2C%20detailed%20mechanical%20component%2C%20pristine%20condition%2C%20automotive%20aftermarket%20part%2C%20clear%20lighting&width=400&height=300&seq=54&orientation=landscape",
          stock: 8,
          isNew: true
        }
      ];

      const transformedAdditionalProducts = additionalProductsRaw.map(transformProduct);
      setAllProducts(prev => [...prev, ...transformedAdditionalProducts]);
      setTotalProductCount(32); // Toplam ürün sayısını 32 olarak sabitle
      setDisplayedProducts(prev => [...prev, ...transformedAdditionalProducts]);
      setCurrentPage(prev => prev + 1);
      return;
    }

    setDisplayedProducts(prevProducts => [...prevProducts, ...newProducts]);
    setCurrentPage(prev => prev + 1);
  };

  // İlk yüklemede ürünleri ayarla
  useEffect(() => {
    const initialProducts = rawProducts.map(transformProduct);
    setAllProducts(initialProducts);
    setDisplayedProducts(initialProducts.slice(0, productsPerPage));
    setCurrentPage(2); // İlk sayfa zaten gösterildi
    setTotalProductCount(initialProducts.length + 16); // İlk ürünler + ek ürünler
  }, []);

  // Link tıklama işleyicisi
  const handleLinkClick = (linkName: string) => {
    setActiveMenu(linkName);
    setTimeout(() => setActiveMenu(null), 1500); // 1.5 saniye sonra rengi normale döndür
  };

  // Menü tıklama işleyicisi (header menüsü için)
  const handleMenuClick = (menuKey: string) => {
    setActiveMenu(menuKey);
    setTimeout(() => setActiveMenu(null), 1500);
  };

  // Alt menü öğeleri için tıklama işleyicisi
  const handleSubMenuClick = (menuKey: string) => {
    setActiveMenu(menuKey);
    setTimeout(() => setActiveMenu(null), 1500);
  };

  // Hızlı erişim link tıklama işleyicisi (sadece yukarı scroll)
  const handleQuickLinkClick = (linkName: string) => {
    const header = document.querySelector('header');
    if (header) {
      // Önce renklendirmeyi başlat
      setActiveMenu(linkName);
      setActiveQuickLink(linkName);

      // Header'ın pozisyonunu al
      const headerRect = header.getBoundingClientRect();
      const headerTop = headerRect.top + window.pageYOffset;
      
      // Mevcut scroll pozisyonunu al
      const currentScroll = window.pageYOffset;
      
      // Scroll mesafesini hesapla
      const scrollDistance = headerTop - currentScroll;
      
      // Scroll animasyonu için başlangıç zamanı
      const startTime = performance.now();
      const duration = 1000; // 1 saniye

      // Smooth scroll animasyonu
      function smoothScroll(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing fonksiyonu (easeInOutQuad)
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Yeni scroll pozisyonu
        const newScroll = currentScroll + (scrollDistance * easeProgress);
        window.scrollTo(0, newScroll);

        // Animasyon devam ediyorsa
        if (progress < 1) {
          requestAnimationFrame(smoothScroll);
        } else {
          // Animasyon bittiğinde renklendirmeyi kaldır
          setTimeout(() => {
            setActiveMenu(null);
            setActiveQuickLink(null);
          }, 500);
        }
      }

      // Animasyonu başlat
      requestAnimationFrame(smoothScroll);

      // İlgili menü öğesini bul ve vurgula
      const menuItems = document.querySelectorAll('.ant-menu-item, .ant-menu-submenu-title');
      menuItems.forEach((item) => {
        const key = item.getAttribute('data-menu-id');
        if (key === linkName) {
          item.classList.add('ant-menu-item-selected');
          setTimeout(() => {
            item.classList.remove('ant-menu-item-selected');
          }, 1500);
        }
      });
    }
  };

  const handleCartItemQuantity = (item: CartItem, newQuantity: number): void => {
    if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleCartItemRemove = (item: CartItem): void => {
    removeFromCart(item.id);
  };

  const handleSmoothScroll = useCallback((targetPosition: number): void => {
    const scrollState: ScrollState = {
      startTime: null,
      startPosition: window.pageYOffset,
      distance: targetPosition - window.pageYOffset,
      duration: 1000
    };

    window.requestAnimationFrame((time) => animateScroll(scrollState, time));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          setIsAuthenticated(true);
        } else {
          auth.signOut();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleOrder = () => {
    setOrderModalVisible(true);
  };

  const handleOrderSubmit = async () => {
    try {
      setOrderLoading(true);
      const values = await orderForm.validateFields();
      // Stok kontrolü
      let stockError = false;
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          if (product.stock < cartItem.quantity) {
            stockError = true;
          }
          return {
            ...product,
            stock: product.stock - cartItem.quantity
          };
        }
        return product;
      });
      if (stockError) {
        message.error('Sepetteki bazı ürünlerin stoğu yetersiz!');
        setOrderLoading(false);
        return;
      }
      setProducts(updatedProducts);
      // Sipariş özeti ve kodu hazırla
      setOrderSummary({
        ...values,
        items: cart,
        total: calculateTotal(),
      });
      setOrderSummaryModalVisible(true);
      setCart([]);
      setOrderModalVisible(false);
      orderForm.resetFields();
      message.success('Siparişiniz başarıyla alındı!');
    } catch (e) {
      // Form validasyon hatası
    } finally {
      setOrderLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <>
      <Layout className="min-h-screen">
        <Header id="header" className="bg-white shadow-md flex items-center justify-between px-4 md:px-8 fixed w-full z-10 h-20">
          <div className="flex items-center">
            <img src={logo} alt="Melfa Oto Logo" className="h-12 w-auto mr-3" style={{objectFit: 'contain'}} />
            <div className="hidden md:block">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-red-600 m-0">MELFA OTO YEDEK PARÇA</h1>
              </div>
            </div>
            <div className="md:hidden flex items-center">
              <Button
                type="text"
                icon={<MenuOutlined className="text-xl" />}
                onClick={toggleMobileMenu}
                className="mr-3 cursor-pointer"
              />
              <h1 className="text-lg font-bold text-red-600 m-0">MELFA OTO</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Menu mode="horizontal" className="border-0">
              <Menu.SubMenu 
                key="home" 
                icon={<HomeOutlined />} 
                title={
                  <span 
                    className={`transition-colors duration-300 ${
                      activeMenu === 'home' ? 'text-red-500 font-medium' : ''
                    }`}
                    data-menu-id="home"
                  >
                    Anasayfa
                  </span>
                }
                onTitleClick={() => handleMenuClick('home')}
              >
                <Menu.Item 
                  key="featured" 
                  onClick={() => {
                    handleMenuClick('featured');
                    handleMenuInfo('Öne Çıkanlar', (
                      <div>
                        <h3>Öne Çıkan Ürünler</h3>
                        <p>En çok tercih edilen ürünlerimiz</p>
                      </div>
                    ));
                  }}
                  className={`transition-colors duration-300 ${activeMenu === 'featured' ? 'text-red-500 font-medium' : ''}`}
                >
                  Öne Çıkanlar
                </Menu.Item>
                <Menu.Item 
                  key="new" 
                  onClick={() => {
                    handleMenuClick('new');
                    handleMenuInfo('Yeni Ürünler', (
                      <div>
                        <h3>Yeni Ürünler</h3>
                        <p>En son eklenen ürünlerimiz</p>
                      </div>
                    ));
                  }}
                  className={`transition-colors duration-300 ${activeMenu === 'new' ? 'text-red-500 font-medium' : ''}`}
                >
                  Yeni Ürünler
                </Menu.Item>
                <Menu.Item 
                  key="campaigns" 
                  onClick={() => {
                    handleMenuClick('campaigns');
                    handleMenuInfo('Kampanyalar', (
                      <div>
                        <h3>Kampanyalar</h3>
                        <p>Güncel kampanyalarımız</p>
                      </div>
                    ));
                  }}
                  className={`transition-colors duration-300 ${activeMenu === 'campaigns' ? 'text-red-500 font-medium' : ''}`}
                >
                  Kampanyalar
                </Menu.Item>
                <Menu.Item 
                  key="blog" 
                  onClick={() => {
                    handleMenuClick('blog');
                    handleMenuInfo('Blog', (
                      <div>
                        <h3>Blog</h3>
                        <p>Son blog yazılarımız</p>
                      </div>
                    ));
                  }}
                  className={`transition-colors duration-300 ${activeMenu === 'blog' ? 'text-red-500 font-medium' : ''}`}
                >
                  Blog
                </Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu 
                key="products" 
                icon={<AppstoreOutlined />} 
                title={
                  <span className={`transition-colors duration-300 ${activeMenu === 'products' ? 'text-red-500 font-medium' : ''}`}>
                    Ürünler
                  </span>
                }
                onTitleClick={() => handleMenuClick('products')}
              >
                <Menu.ItemGroup title="Kaporta Parçaları">
                  <Menu.Item 
                    key="bumper" 
                    onClick={() => {
                      handleMenuClick('bumper');
                      handleMenuInfo('Tamponlar', (
                        <div>
                          <h3>Tamponlar</h3>
                          <p>Ön ve arka tampon çeşitleri.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'bumper' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Tamponlar
                  </Menu.Item>
                  <Menu.Item 
                    key="hood" 
                    onClick={() => {
                      handleMenuClick('hood');
                      handleMenuInfo('Kaputlar', (
                        <div>
                          <h3>Kaputlar</h3>
                          <p>Farklı marka ve modellere uygun kaputlar.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'hood' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Kaputlar
                  </Menu.Item>
                  <Menu.Item 
                    key="fender" 
                    onClick={() => {
                      handleMenuClick('fender');
                      handleMenuInfo('Çamurluklar', (
                        <div>
                          <h3>Çamurluklar</h3>
                          <p>Dayanıklı ve kaliteli çamurluklar.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'fender' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Çamurluklar
                  </Menu.Item>
                  <Menu.Item 
                    key="door" 
                    onClick={() => {
                      handleMenuClick('door');
                      handleMenuInfo('Kapılar', (
                        <div>
                          <h3>Kapılar</h3>
                          <p>Orijinal ve uyumlu kapı seçenekleri.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'door' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Kapılar
                  </Menu.Item>
                </Menu.ItemGroup>
                <Menu.ItemGroup title="Mekanik Parçalar">
                  <Menu.Item 
                    key="engine" 
                    onClick={() => {
                      handleMenuClick('engine');
                      handleMenuInfo('Motor Parçaları', (
                        <div>
                          <h3>Motor Parçaları</h3>
                          <p>Motor bloğu, conta, piston ve daha fazlası.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'engine' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Motor Parçaları
                  </Menu.Item>
                  <Menu.Item 
                    key="transmission" 
                    onClick={() => {
                      handleMenuClick('transmission');
                      handleMenuInfo('Şanzıman', (
                        <div>
                          <h3>Şanzıman</h3>
                          <p>Şanzıman ve aktarma organları.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'transmission' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Şanzıman
                  </Menu.Item>
                  <Menu.Item 
                    key="brake" 
                    onClick={() => {
                      handleMenuClick('brake');
                      handleMenuInfo('Fren Sistemi', (
                        <div>
                          <h3>Fren Sistemi</h3>
                          <p>Fren balatası, disk, hidrolik ve daha fazlası.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'brake' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Fren Sistemi
                  </Menu.Item>
                  <Menu.Item 
                    key="suspension" 
                    onClick={() => {
                      handleMenuClick('suspension');
                      handleMenuInfo('Süspansiyon', (
                        <div>
                          <h3>Süspansiyon</h3>
                          <p>Amortisör, yay ve süspansiyon parçaları.</p>
                        </div>
                      ));
                    }}
                    className={`transition-colors duration-300 ${activeMenu === 'suspension' ? 'text-red-500 font-medium' : ''}`}
                  >
                    Süspansiyon
                  </Menu.Item>
                </Menu.ItemGroup>
              </Menu.SubMenu>
              <Menu.SubMenu 
                key="about" 
                icon={<InfoCircleOutlined />} 
                title={
                  <span className={`transition-colors duration-300 ${activeMenu === 'about' ? 'text-red-500 font-medium' : ''}`}>
                    Hakkımızda
                  </span>
                }
                onTitleClick={() => handleMenuClick('about')}
              >
                <Menu.Item key="company" onClick={() => handleMenuInfo('Şirket Profili', (
                      <div>
                        <h3>Şirket Profili</h3>
                        <p>Melfa Oto Yedek Parça, Adana'da yıllardır otomotiv yedek parça sektöründe güvenin ve kalitenin adresidir. Müşteri memnuniyetini ve orijinal ürün tedarikini ilke edinmiş, yenilikçi ve çözüm odaklı bir ekiple hizmet vermektedir.</p>
                        <ul style={{marginTop: 16, marginBottom: 0, paddingLeft: 20, color: '#16a34a', fontWeight: 500}}>
                          <li>Orijinal ve garantili ürünler</li>
                          <li>Hızlı teslimat ve profesyonel destek</li>
                          <li>Geniş ürün yelpazesi</li>
                          <li>Adana ve çevresinde lider marka</li>
                        </ul>
                      </div>
                ))}>Şirket Profili</Menu.Item>
                <Menu.Item key="team" onClick={() => handleMenuInfo('Ekibimiz', (
                      <div>
                        <h3>Ekibimiz</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                            <span style={{background:'#f87171',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>MÇ</span>
                            <div>
                              <div style={{fontWeight:600}}>Melisa Çiftçi</div>
                              <div style={{color:'#888'}}>Müdür</div>
                            </div>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                            <span style={{background:'#fbbf24',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>FÇ</span>
                            <div>
                              <div style={{fontWeight:600}}>Fatihan Çiftçi</div>
                              <div style={{color:'#888'}}>Müdür Yardımcısı</div>
                            </div>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                            <span style={{background:'#60a5fa',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>YY</span>
                            <div>
                              <div style={{fontWeight:600}}>Yusuf Yaşarcan</div>
                              <div style={{color:'#888'}}>Muhasebe</div>
                            </div>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                            <span style={{background:'#34d399',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>AY</span>
                            <div>
                              <div style={{fontWeight:600}}>Ahmet Yaşarcan</div>
                              <div style={{color:'#888'}}>Müşteri Danışmanı</div>
                            </div>
                          </div>
                        </div>
                      </div>
                ))}>Ekibimiz</Menu.Item>
                <Menu.Item key="certificates" onClick={() => handleMenuInfo('Sertifikalar', (
                  <div>
                    <h3>Sertifikalar</h3>
                    <ul style={{marginTop: 16, marginBottom: 0, paddingLeft: 20}}>
                      <li>Fiat Yetkili Servis Sertifikası</li>
                      <li>Renault Orijinal Parça Kalite Belgesi</li>
                      <li>Dacia Müşteri Memnuniyeti Ödülü</li>
                      <li>Jeep Satış Sonrası Hizmet Sertifikası</li>
                      <li>Mercedes-Benz Yedek Parça Güvenlik Belgesi</li>
                    </ul>
                  </div>
                ))}>Sertifikalar</Menu.Item>
                <Menu.Item key="partners" onClick={() => handleMenuInfo('İş Ortakları', (
                  <div>
                    <h3>İş Ortaklarımız</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                        <span style={{background:'#ef4444',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>MÜ</span>
                        <div>
                          <div style={{fontWeight:600}}>Murat Ülker</div>
                          <div style={{color:'#888'}}>Ülker Holding Yönetim Kurulu Başkanı</div>
                        </div>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                        <span style={{background:'#3b82f6',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>AK</span>
                        <div>
                          <div style={{fontWeight:600}}>Ali Koç</div>
                          <div style={{color:'#888'}}>Koç Holding Yönetim Kurulu Başkanı</div>
                        </div>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                        <span style={{background:'#10b981',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>FS</span>
                        <div>
                          <div style={{fontWeight:600}}>Ferit Şahenk</div>
                          <div style={{color:'#888'}}>Doğuş Holding Yönetim Kurulu Başkanı</div>
                        </div>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                        <span style={{background:'#f59e0b',color:'#fff',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20}}>MS</span>
                        <div>
                          <div style={{fontWeight:600}}>Mehmet Şimşek</div>
                          <div style={{color:'#888'}}>Sabancı Holding Yönetim Kurulu Üyesi</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}>İş Ortakları</Menu.Item>
              </Menu.SubMenu>
              <Menu.SubMenu 
                key="contact" 
                icon={<PhoneOutlined />} 
                title={
                  <span className={`transition-colors duration-300 ${activeMenu === 'contact' ? 'text-red-500 font-medium' : ''}`}>
                    İletişim
                  </span>
                }
                onTitleClick={() => handleMenuClick('contact')}
              >
                <Menu.Item key="stores" onClick={() => handleMenuInfo('Mağazalarımız', (
                  <div>
                    <h3>Mağazamız</h3>
                    <p>Fevzipaşa Mah. 48046 Sokak No29A Seyhan/ADANA, Adana, Türkiye 01100</p>
                    <div style={{width: '100%', height: 300, margin: '16px 0'}}>
                      <iframe
                        title="Melfa Oto Konum"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{border:0, borderRadius: 8}}
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3187.442964295385!2d35.32133531531244!3d37.0024799799007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15288f4e2e2e2e2e%3A0x123456789abcdef!2sFevzipa%C5%9Fa%20Mah.%2048046%20Sk.%20No%3A29A%2C%20Seyhan%2FAdana!5e0!3m2!1str!2str!4v1680000000000!5m2!1str!2str"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                ))}>Mağazalarımız</Menu.Item>
                <Menu.Item key="support" onClick={() => handleMenuInfo('Teknik Destek', (
                  <div>
                    <h3>Teknik Destek</h3>
                    <p>Her türlü teknik sorunuz için bize ulaşın.</p>
                    <div style={{margin: '16px 0'}}>
                      <Button
                        type="primary"
                        icon={<PhoneOutlined />}
                        href="tel:05416322634"
                        className="bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                      >
                        0541 632 2634
                      </Button>
                    </div>
                  </div>
                ))}>Teknik Destek</Menu.Item>
                <Menu.Item key="complaint" onClick={() => setMailModalVisible(true)}>Şikayet/Öneri</Menu.Item>
              </Menu.SubMenu>
            </Menu>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                placeholder="Ürün ara..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setSearchResultsVisible(e.target.value.length > 0);
                }}
                onFocus={() => searchTerm.length > 0 && setSearchResultsVisible(true)}
                onBlur={() => setTimeout(() => setSearchResultsVisible(false), 200)}
                className="w-64"
              />
              {searchResultsVisible && searchTerm && (
                <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg mt-1 z-50">
                  {/* Arama sonuçları buraya gelecek */}
                </div>
              )}
            </div>

            <Button
              type="text"
              icon={<SettingOutlined className="text-xl text-red-600" />}
              onClick={toggleSettings}
              className="flex items-center justify-center h-10 w-10 cursor-pointer !rounded-button whitespace-nowrap"
            />

            <Badge count={cart.length} className="cursor-pointer" onClick={toggleCart}>
              <Button
                type="text"
                icon={<ShoppingCartOutlined className="text-xl text-red-600" />}
                className="flex items-center justify-center h-10 w-10 cursor-pointer !rounded-button whitespace-nowrap"
              />
            </Badge>
          </div>
        </Header>

        {/* Mobile Menu Drawer */}
        <Drawer
          title="Menü"
          placement="left"
          onClose={toggleMobileMenu}
          visible={mobileMenuVisible}
          width={280}
        >
          <Menu mode="vertical" className="border-0">
            <Menu.Item key="home" icon={<HomeOutlined />}>
              Anasayfa
                </Menu.Item>
            <Menu.Item key="products" icon={<AppstoreOutlined />}>
              Ürünler
            </Menu.Item>
            <Menu.Item key="about" icon={<InfoCircleOutlined />}>
              Hakkımızda
            </Menu.Item>
            <Menu.Item key="contact" icon={<PhoneOutlined />}>
              İletişim
            </Menu.Item>
          </Menu>
          <Divider />
          <Input.Search
            placeholder="Ürün ara..."
            className="w-full mb-4"
            suffix={<SearchOutlined className="text-gray-400" />}
          />
        </Drawer>

        {/* Cart Drawer */}
        <Drawer
          title="Sepetim"
          placement="right"
          onClose={toggleCart}
          visible={cartVisible}
          width={320}
          footer={cart.length > 0 ? (
            <div>
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Toplam:</span>
                <span className="font-bold text-red-600">{calculateTotal().toLocaleString('tr-TR')} ₺</span>
              </div>
              <Button type="primary" block className="bg-green-600 hover:bg-green-700 !rounded-button whitespace-nowrap" onClick={handleOrder}>
                Sepeti Onayla
              </Button>
              <Button block className="mt-2 !rounded-button whitespace-nowrap" onClick={toggleCart}>
                Sepete Git
              </Button>
            </div>
          ) : null}
        >
          {cart.length > 0 ? (
            <div>
              {cart.map(item => (
                <div key={item.id} className="flex mb-4 pb-4 border-b">
                  <div className="w-20 h-20 overflow-hidden">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      onError={e => { e.currentTarget.src = '/assets/no-image.png'; }}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium mb-1">{item.name}</h4>
                    <p className="text-red-600 font-semibold mb-1">{item.price.toLocaleString('tr-TR')} ₺</p>
                    <div className="flex items-center">
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => handleCartItemQuantity(item, item.quantity - 1)}
                        className="border-gray-300 !rounded-button whitespace-nowrap"
                      />
                      <span className="mx-2 text-sm">{item.quantity}</span>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleCartItemQuantity(item, item.quantity + 1)}
                        className="border-gray-300 !rounded-button whitespace-nowrap"
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleCartItemRemove(item)}
                        className="ml-auto !rounded-button whitespace-nowrap"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Sepetinizde ürün bulunmamaktadır."
            />
          )}
        </Drawer>

        {/* Settings Drawer */}
        <Drawer
          title="Ayarlar"
          placement="right"
          onClose={toggleSettings}
          visible={settingsVisible}
          width={320}
        >
          <Settings onLogout={() => {
            setSettingsVisible(false);
            setIsAuthenticated(false);
          }} />
        </Drawer>

        <Content className="pt-20">
          {/* Banner Carousel */}
          <Carousel
            autoplay
            effect="fade"
            arrows
            prevArrow={<Button icon={<LeftOutlined />} className="carousel-arrow carousel-arrow-prev !rounded-button whitespace-nowrap" />}
            nextArrow={<Button icon={<RightOutlined />} className="carousel-arrow carousel-arrow-next !rounded-button whitespace-nowrap" />}
            className="banner-carousel"
          >
            {[
              ...bannerImages,
              {
                image: "https://readdy.ai/api/search-image?query=Professional%20automotive%20workshop%20interior%20with%20modern%20equipment%20and%20tools%2C%20showing%20various%20car%20parts%20and%20maintenance%20areas.%20Clean%2C%20well-lit%20environment%20with%20organized%20shelves%20of%20auto%20parts.%20High-end%20professional%20setting%20with%20pristine%20white%20background&width=1440&height=500&seq=26&orientation=landscape",
                title: "Profesyonel Servis",
                description: "Uzman ekibimizle kaliteli hizmet garantisi"
              },
              {
                image: "https://readdy.ai/api/search-image?query=Modern%20car%20engine%20parts%20display%20with%20focus%20on%20performance%20components.%20Professional%20automotive%20showroom%20setting%20with%20dramatic%20lighting.%20Clean%2C%20organized%20presentation%20of%20high-quality%20mechanical%20parts%20against%20elegant%20background&width=1440&height=500&seq=27&orientation=landscape",
                title: "Motor Parçaları",
                description: "Orijinal motor ve şanzıman parçaları"
              },
              {
                image: "https://readdy.ai/api/search-image?query=Luxury%20car%20exterior%20parts%20collection%20featuring%20headlights%2C%20mirrors%2C%20and%20body%20panels.%20Professional%20automotive%20display%20with%20modern%20lighting.%20Premium%20quality%20components%20arranged%20elegantly%20against%20sophisticated%20background&width=1440&height=500&seq=28&orientation=landscape",
                title: "Dış Aksamlar",
                description: "Geniş dış aksam parça seçenekleri"
              },
              {
                image: "https://readdy.ai/api/search-image?query=High-end%20brake%20system%20components%20and%20suspension%20parts%20displayed%20professionally.%20Modern%20automotive%20showcase%20with%20technical%20atmosphere.%20Premium%20quality%20mechanical%20parts%20presentation%20with%20clean%20background&width=1440&height=500&seq=29&orientation=landscape",
                title: "Fren Sistemleri",
                description: "Güvenilir fren ve süspansiyon parçaları"
              },
              {
                image: "https://readdy.ai/api/search-image?query=Interior%20car%20parts%20and%20accessories%20professionally%20displayed.%20Modern%20automotive%20retail%20environment%20with%20elegant%20lighting.%20Premium%20dashboard%20components%20and%20electronic%20parts%20against%20sophisticated%20background&width=1440&height=500&seq=30&orientation=landscape",
                title: "İç Aksamlar",
                description: "Konfor ve kullanım için iç aksam parçaları"
              }
            ].map((banner, index) => (
              <div key={index}>
                <div className="relative h-[500px]">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    onError={e => { e.currentTarget.src = '/assets/no-image.png'; }}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                    <div className="text-white p-8 md:p-16 max-w-lg">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4">{banner.title}</h2>
                      <p className="text-lg md:text-xl mb-6">{banner.description}</p>
                      <Button
                        type="primary"
                        size="large"
                        className="bg-red-600 hover:bg-red-700 border-none !rounded-button whitespace-nowrap"
                        onClick={() => window.location.href = '#products'}
                      >
                        Hemen İncele
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
          {/* Categories */}
          <div id="products" className="py-12 px-4 md:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-2">Kategoriler</h2>
              <p className="text-gray-600 text-center mb-8">Aracınız için ihtiyacınız olan tüm parçalar</p>
              <Row gutter={[24, 24]}>
                {categories.map((category, index) => (
                  <Col xs={24} md={12} key={index}>
                    <Card
                      hoverable
                      className="overflow-hidden h-full relative p-0 border-none shadow-md"
                      bodyStyle={{ padding: 0 }}
                      cover={null}
                    >
                      <div
                        className="h-64 w-full relative flex items-end"
                        style={{
                          backgroundImage: `url(${category.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          minHeight: '16rem',
                          borderRadius: '12px 12px 0 0',
                        }}
                      >
                        <div className="absolute inset-0 bg-black/40 rounded-t-lg"></div>
                        <div className="relative z-10 p-6">
                          <div className="text-2xl font-bold text-white mb-2">{category.name}</div>
                          <div className="text-white mb-4">{category.description}</div>
                          <Button
                            type="primary"
                            className="bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                            onClick={() => {
                              const categoryProducts = products.filter(p => p.category === category.name);
                              Modal.info({
                                title: `${category.name} Ürünleri`,
                                width: 1000,
                                icon: null,
                                okText: 'Kapat',
                                content: (
                                  <div className="py-4">
                                    <Row gutter={[24, 24]}>
                                      {categoryProducts.map(product => (
                                        <Col xs={24} sm={12} key={product.id}>
                                          <Card
                                            hoverable
                                            className="h-full"
                                            cover={
                                              <Carousel autoplay className="product-carousel">
                                                {product.images.map((imgSrc, imgIndex) => (
                                                  <div key={imgIndex}>
                                                    <img
                                                      alt={`${product.name} - Görsel ${imgIndex + 1}`}
                                                      src={imgSrc}
                                                      onError={e => { e.currentTarget.src = '/assets/no-image.png'; }}
                                                      className="w-full h-48 object-cover object-top"
                                                    />
                                                  </div>
                                                ))}
                                              </Carousel>
                                            }
                                          >
                                            <Card.Meta
                                              title={<span className="text-base font-semibold">{product.name}</span>}
                                              description={
                                                <div className="mt-2">
                                                  <div className="text-lg font-bold text-red-600 mb-2">
                                                    {product.price.toLocaleString('tr-TR')} ₺
                                                  </div>
                                                  <div className="flex items-center">
                                                    <span className={`w-3 h-3 rounded-full mr-2 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    <span className="text-sm text-gray-600">
                                                      {product.stock > 0 ? `Stokta (${product.stock})` : 'Tükendi'}
                                                    </span>
                                                  </div>
                                                </div>
                                              }
                                            />
                                            <Button
                                              type="primary"
                                              block
                                              onClick={() => {
                                                addToCart(product);
                                                notification.success({
                                                  message: 'Ürün sepete eklendi',
                                                  description: `${product.name} sepetinize eklendi.`,
                                                });
                                              }}
                                              disabled={product.stock <= 0}
                                              className="mt-4 bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                                            >
                                              Sepete Ekle
                                            </Button>
                                          </Card>
                                        </Col>
                                      ))}
                                    </Row>
                                  </div>
                                )
                              });
                            }}
                          >
                            Kategoriyi Görüntüle
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
          {/* Brands */}
          <div className="py-12 px-4 md:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-2">Markalar</h2>
              <p className="text-gray-600 text-center mb-8">Çalıştığımız otomobil markaları</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                {brands.map((brand, index) => (
                  <div
                    key={index}
                    className="text-center transition-transform hover:scale-110 cursor-pointer"
                    onClick={() => {
                      setSelectedBrand(brand.name);
                      setBrandModalVisible(true);
                    }}
                  >
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-3 overflow-hidden">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        onError={e => { e.currentTarget.src = '/assets/no-image.png'; }}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    <h3 className="font-semibold">{brand.name}</h3>
                  </div>
                ))}
                <Modal
                  title={`${selectedBrand || ''} Yedek Parçaları`}
                  visible={brandModalVisible}
                  onCancel={() => setBrandModalVisible(false)}
                  footer={null}
                  width={1000}
                  className="brand-products-modal"
                >
                  {selectedBrand && (
                      <div>
                      <Row gutter={[24, 24]}>
                        {brands.find(b => b.name === selectedBrand)?.products.map(product => (
                          <Col xs={24} sm={12} key={product.id}>
                            <Card
                              hoverable
                              className="h-full"
                              cover={
                                <Carousel autoplay className="product-carousel">
                                  {product.images.map((imgSrc, imgIndex) => (
                                    <div key={imgIndex}>
                                      <img
                                        alt={`${product.name} - Görsel ${imgIndex + 1}`}
                                        src={imgSrc}
                                        onError={e => { e.currentTarget.src = '/assets/no-image.png'; }}
                                        className="w-full h-48 object-cover object-top"
                                      />
                                    </div>
                                  ))}
                                </Carousel>
                              }
                            >
                              <Card.Meta
                                title={<span className="text-base font-semibold">{product.name}</span>}
                                description={
                                  <div className="mt-2">
                                    <div className="text-lg font-bold text-red-600 mb-2">
                                      {product.price.toLocaleString('tr-TR')} ₺
                                    </div>
                                    <div className="flex items-center">
                                      <span className={`w-3 h-3 rounded-full mr-2 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      <span className="text-sm text-gray-600">
                                        {product.stock > 0 ? `Stokta (${product.stock})` : 'Tükendi'}
                                      </span>
                                    </div>
                                  </div>
                                }
                              />
                              <Button
                                type="primary"
                                block
                                onClick={() => {
                                  addToCart(product);
                                  notification.success({
                                    message: 'Ürün sepete eklendi',
                                    description: `${product.name} sepetinize eklendi.`,
                                  });
                                }}
                                disabled={product.stock <= 0}
                                className="mt-4 bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                              >
                                Sepete Ekle
                              </Button>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </Modal>
              </div>
            </div>
          </div>
          {/* Featured Products */}
          <div className="py-12 px-4 md:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-2">Öne Çıkan Ürünler</h2>
              <p className="text-gray-600 text-center mb-8">En çok tercih edilen yedek parçalar</p>
              <Row gutter={[24, 24]}>
                {(showOnlyNew ? displayedProducts.filter(p => p.isNew) : displayedProducts).map(product => (
                  <Col xs={24} sm={12} lg={6} key={product.id}>
                    <Card
                      hoverable
                      className="h-full flex flex-col"
                      cover={
                        <div className="relative h-48">
                          <Carousel autoplay className="product-carousel">
                            {product.images.map((imgSrc, imgIndex) => (
                              <div key={imgIndex}>
                                <img
                                  alt={`${product.name} - Görsel ${imgIndex + 1}`}
                                  src={imgSrc}
                                  onError={e => { e.currentTarget.src = '/assets/no-image.png'; }}
                                  className="w-full h-48 object-cover object-top"
                                />
                              </div>
                            ))}
                          </Carousel>
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                            <i className="fas fa-images mr-1"></i> 3 Görsel
                          </div>
                          {product.isNew && (
                            <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold shadow">Yeni</div>
                          )}
                        </div>
                      }
                    >
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                            {product.category}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full ml-2">
                            {product.brand}
                          </span>
                        </div>
                        <Card.Meta
                          title={<span className="text-base font-semibold">{product.name}</span>}
                        />
                        <div className="mt-2 mb-4">
                          <span className="text-lg font-bold text-red-600">{product.price.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-2 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-sm text-gray-600">
                              {product.stock > 0 ? `Stokta (${product.stock})` : 'Tükendi'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="primary"
                        block
                        onClick={() => handleProductClick(product)}
                        disabled={product.stock <= 0}
                        className="mt-4 bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                      >
                        Sepete Ekle
                      </Button>
                    </Card>
                  </Col>
                ))}
              </Row>
              <div className="text-center mt-8">
                {hasMoreProducts ? (
                  <button
                    onClick={showMoreProducts}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-button transition-colors duration-300"
                  >
                    Daha Fazla Ürün Göster
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-600 text-lg font-medium">Tüm ürünler gösterildi</p>
                    <p className="text-gray-500 text-sm">Toplam {totalProductCount} ürün listelendi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Why Choose Us */}
          <div className="py-12 px-4 md:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-2">Neden Bizi Tercih Etmelisiniz?</h2>
              <p className="text-gray-600 text-center mb-8">Müşteri memnuniyeti odaklı hizmet anlayışımız</p>
              <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                  <div className="text-center p-6 h-full bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔧</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Orijinal Parçalar</h3>
                    <p className="text-gray-600">Tüm ürünlerimiz orijinal ve garantilidir. Kaliteden ödün vermiyoruz.</p>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="text-center p-6 h-full bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🚚</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Hızlı Teslimat</h3>
                    <p className="text-gray-600">Siparişleriniz en kısa sürede hazırlanıp adresinize teslim edilir.</p>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="text-center p-6 h-full bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">👨‍🔧</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Teknik Destek</h3>
                    <p className="text-gray-600">Uzman ekibimiz parça seçimi konusunda size yardımcı olmaktan memnuniyet duyar.</p>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
          {/* Contact CTA */}
          <div id="contact" className="py-16 px-4 md:px-8 bg-red-600 text-white">
            <div className="max-w-7xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Aradığınız Parçayı Bulamadınız mı?</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">Bizimle iletişime geçin, aracınız için ihtiyacınız olan parçayı en kısa sürede temin edelim.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  type="primary"
                  size="large"
                  icon={<PhoneOutlined />}
                  className="bg-white text-red-600 hover:bg-gray-100 hover:text-red-700 !rounded-button whitespace-nowrap"
                >
                  0541 632 2634
                </Button>
                <Button
                  type="default"
                  icon={<MailOutlined style={{ fontSize: 20 }} />}
                  style={{ height: 40, padding: '0 16px', display: 'flex', alignItems: 'center' }}
                  onClick={() => setMailModalVisible(true)}
                  className="border-white text-red-600 bg-white hover:bg-gray-100 !rounded-button whitespace-nowrap"
                >
                  E-posta Gönder
                </Button>
              </div>
            </div>
          </div>
        </Content>
        {/* Footer */}
        <Footer className="bg-gray-900 text-white pt-12 pb-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <Row gutter={[48, 32]}>
              <Col xs={24} md={8}>
                <img src={logo} alt="Melfa Oto Logo" className="h-10 w-auto mb-4" style={{objectFit: 'contain'}} />
                <h3 className="text-xl font-bold mb-6">MELFA OTO YEDEK PARÇA</h3>
                <p className="text-gray-400 mb-6">
                  Adana'da otomobil yedek parça ihtiyaçlarınız için güvenilir adres. Fiat, Renault, Dacia, Alfa Romeo ve Jeep markalarına ait orijinal parçalar.
                </p>
                <div className="flex space-x-4">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<FacebookOutlined />}
                    className="text-white hover:bg-blue-600 !rounded-button whitespace-nowrap"
                  />
                  <Button
                    type="text"
                    shape="circle"
                    icon={<InstagramOutlined />}
                    className="text-white hover:bg-pink-600 !rounded-button whitespace-nowrap"
                  />
                  <Button
                    type="text"
                    shape="circle"
                    icon={<TwitterOutlined />}
                    className="text-white hover:bg-blue-400 !rounded-button whitespace-nowrap"
                  />
                  <Button
                    type="text"
                    shape="circle"
                    icon={<LinkedinOutlined />}
                    className="text-white hover:bg-blue-700 !rounded-button whitespace-nowrap"
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <h3 className="text-xl font-bold mb-6">Hızlı Erişim</h3>
                <ul className="space-y-3">
                  <li>
                    <a 
                      href="#header" 
                      onClick={e => {
                        e.preventDefault();
                        handleQuickLinkClick('home');
                      }}
                      className={`transition-colors duration-300 ${
                        activeQuickLink === 'home' 
                          ? 'text-red-500 font-medium' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      data-menu-id="home"
                    >
                      Anasayfa
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#header" 
                      onClick={e => {
                        e.preventDefault();
                        handleQuickLinkClick('products');
                      }}
                      className={`transition-colors duration-300 ${
                        activeQuickLink === 'products' 
                          ? 'text-red-500 font-medium' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      data-menu-id="products"
                    >
                      Ürünler
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#header" 
                      onClick={e => {
                        e.preventDefault();
                        handleQuickLinkClick('about');
                      }}
                      className={`transition-colors duration-300 ${
                        activeQuickLink === 'about' 
                          ? 'text-red-500 font-medium' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      data-menu-id="about"
                    >
                      Hakkımızda
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#header" 
                      onClick={e => {
                        e.preventDefault();
                        handleQuickLinkClick('contact');
                      }}
                      className={`transition-colors duration-300 ${
                        activeQuickLink === 'contact' 
                          ? 'text-red-500 font-medium' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      data-menu-id="contact"
                    >
                      İletişim
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#header" 
                      onClick={e => {
                        e.preventDefault();
                        handleQuickLinkClick('privacy');
                      }}
                      className={`transition-colors duration-300 ${
                        activeQuickLink === 'privacy' 
                          ? 'text-red-500 font-medium' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      data-menu-id="privacy"
                    >
                      Gizlilik Politikası
                    </a>
                  </li>
                </ul>
              </Col>
              <Col xs={24} md={8}>
                <h3 className="text-xl font-bold mb-6">İletişim Bilgileri</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <i className="fas fa-map-marker-alt text-red-500 mr-3 mt-1"></i>
                    <span className="text-gray-400">
                      Fevzipaşa Mah. 48046 Sokak No29A Seyhan/ADANA, Adana, Türkiye 01100
                    </span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-phone text-red-500 mr-3 mt-1"></i>
                    <span className="text-gray-400">0541 632 2634</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-envelope text-red-500 mr-3 mt-1"></i>
                    <span className="text-gray-400">melfaotoyedekparca@gmail.com</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-clock text-red-500 mr-3 mt-1"></i>
                    <span className="text-gray-400">
                      Pazartesi - Cumartesi: 08:30 - 18:30<br />
                      Pazar: Kapalı
                    </span>
                  </li>
                </ul>
              </Col>
            </Row>
            <Divider className="border-gray-800 mt-8 mb-6" />
            <div className="text-center text-gray-500">
              <p>© 2025 MELFA OTO YEDEK PARÇA. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </Footer>
      </Layout>
      <>
        {/* Product Detail Modal */}
        <Modal
          visible={selectedProduct !== null}
          onCancel={() => setSelectedProduct(null)}
          footer={null}
          width={800}
        >
          {selectedProduct && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-1/2">
                <Carousel autoplay className="product-carousel">
                  {selectedProduct.images.map((imgSrc, imgIndex) => (
                    <div key={imgIndex}>
                      <img
                        alt={`${selectedProduct.name} - Görsel ${imgIndex + 1}`}
                        src={imgSrc}
                        onError={e => { e.currentTarget.src = '/assets/no-image.png'; }}
                        className="w-full h-64 object-cover object-top mb-4"
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
              <div className="w-1/2">
                <div className="mb-2">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                    {selectedProduct.category}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full ml-2">
                    {selectedProduct.brand}
                  </span>
                </div>
                <div className="text-lg font-bold text-red-600 mb-2">
                  {selectedProduct.price.toLocaleString('tr-TR')} ₺
                </div>
                <div className="flex items-center mb-4">
                  <span className={`w-3 h-3 rounded-full mr-2 ${selectedProduct.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-gray-600">
                      {selectedProduct.stock > 0 ? `Stokta (${selectedProduct.stock})` : 'Tükendi'}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    block
                    onClick={() => addToCart(selectedProduct)}
                    disabled={selectedProduct.stock <= 0}
                    className="mb-4 bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                  >
                    Sepete Ekle
                  </Button>
                  <Divider>Yorumlar</Divider>
                  <div className="space-y-4">
                    <>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center mb-1">
                          <span className="font-semibold mr-2">Ahmet K.</span>
                          <span className="text-yellow-500">★★★★★</span>
                        </div>
                        <div className="text-gray-600 text-sm">Ürün çok kaliteli ve hızlı kargo için teşekkürler.</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center mb-1">
                          <span className="font-semibold mr-2">Zeynep T.</span>
                          <span className="text-yellow-500">★★★★☆</span>
                        </div>
                        <div className="text-gray-600 text-sm">Tam uyumlu geldi, tavsiye ederim.</div>
                      </div>
                    </>
                  </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Mail Modal */}
        <Modal
          visible={mailModalVisible}
          onCancel={() => setMailModalVisible(false)}
          footer={null}
          title="Bize E-posta Gönderin"
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleMailSend();
            }}
            className="space-y-4"
          >
            <Input
              placeholder="Adınız (isteğe bağlı)"
              value={mailName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMailName(e.target.value)}
              className="!rounded-button"
            />
            <Input
              placeholder="E-posta Adresiniz"
              type="email"
              required
              value={mailEmail}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMailEmail(e.target.value)}
              className="!rounded-button"
            />
            <Input.TextArea
              placeholder="Mesajınız (istek/şikayet)"
              required
              rows={4}
              maxLength={500}
              showCount
              value={mailMessage}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMailMessage(e.target.value)}
              className="!rounded-button"
            />
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
            >
              Gönder
            </Button>
          </form>
        </Modal>

        {/* Mail Success Overlay */}
        {showMailSuccess && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: '40px 32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 320
            }}>
              <CheckCircleFilled style={{ fontSize: 56, color: '#22c55e', marginBottom: 16 }} />
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Mailiniz gönderildi!</div>
              <div style={{ color: '#666', fontSize: 16, textAlign: 'center' }}>
                Talebiniz başarıyla iletildi. En kısa sürede dönüş yapılacaktır.
              </div>
            </div>
          </div>
        )}

        {/* Info Modal */}
        <Modal
          visible={infoModal.visible}
          onCancel={() => setInfoModal({ ...infoModal, visible: false })}
          footer={null}
          title={infoModal.title}
        >
          {infoModal.content}
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          title="Gizlilik Politikası"
          open={privacyModalVisible}
          onCancel={() => setPrivacyModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setPrivacyModalVisible(false)}>
              Kapat
            </Button>
          ]}
          width={800}
        >
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <h3 className="text-lg font-semibold mb-4">Melfa Oto Gizlilik Politikası</h3>
            
            <section className="mb-6">
              <h4 className="text-base font-medium mb-2">1. Veri Sorumlusu</h4>
              <p className="text-gray-700 mb-2">
                Melfa Oto olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verilerinizi işlemekte ve bu verilerinizin güvenliğini sağlamaktayız.
              </p>
            </section>

            <section className="mb-6">
              <h4 className="text-base font-medium mb-2">2. Toplanan Kişisel Veriler</h4>
              <p className="text-gray-700 mb-2">Web sitemizi kullanırken aşağıdaki kişisel verileriniz toplanabilir:</p>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Ad, soyad, e-posta adresi, telefon numarası</li>
                <li>Adres bilgileri</li>
                <li>Sipariş geçmişi</li>
                <li>Ödeme bilgileri</li>
                <li>IP adresi ve çerez bilgileri</li>
              </ul>
            </section>

            <section className="mb-6">
              <h4 className="text-base font-medium mb-2">3. Kişisel Verilerin İşlenme Amaçları</h4>
              <p className="text-gray-700 mb-2">Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Siparişlerinizin işlenmesi ve teslimatı</li>
                <li>Müşteri hizmetleri ve destek sağlanması</li>
                <li>Ürün ve hizmetlerimizin geliştirilmesi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Size özel teklifler ve kampanyalar sunulması</li>
              </ul>
            </section>

            <section className="mb-6">
              <h4 className="text-base font-medium mb-2">4. Kişisel Verilerin Korunması</h4>
              <p className="text-gray-700 mb-2">
                Kişisel verilerinizin güvenliği için uygun teknik ve idari önlemler alınmaktadır. Verileriniz şifrelenerek saklanmakta ve yetkisiz erişime karşı korunmaktadır.
              </p>
            </section>

            <section className="mb-6">
              <h4 className="text-base font-medium mb-2">5. Kişisel Verilerin Aktarımı</h4>
              <p className="text-gray-700 mb-2">
                Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmamaktadır. Sadece siparişlerinizin teslimatı için gerekli olan kargo firmaları gibi hizmet sağlayıcılarla sınırlı bilgi paylaşımı yapılmaktadır.
              </p>
            </section>

            <section className="mb-6">
              <h4 className="text-base font-medium mb-2">6. Haklarınız</h4>
              <p className="text-gray-700 mb-2">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
              </ul>
            </section>

            <section className="mb-6">
              <h4 className="text-base font-medium mb-2">7. İletişim</h4>
              <p className="text-gray-700 mb-2">
                Gizlilik politikamız hakkında sorularınız veya haklarınızı kullanmak için talepleriniz için bizimle iletişime geçebilirsiniz:
              </p>
              <p className="text-gray-700">
                E-posta: info@melfaoto.com<br />
                Adres: [Şirket Adresi]<br />
                Telefon: [Telefon Numarası]
              </p>
            </section>

            <section>
              <p className="text-gray-700 text-sm">
                Son güncelleme tarihi: {new Date().toLocaleDateString('tr-TR')}
              </p>
            </section>
          </div>
        </Modal>

        {/* Order Modal */}
        <Modal
          title="Teslimat Bilgileri"
          open={orderModalVisible}
          onCancel={() => setOrderModalVisible(false)}
          onOk={handleOrderSubmit}
          confirmLoading={orderLoading}
          okText="Siparişi Onayla"
          cancelText="İptal"
        >
          <Form
            form={orderForm}
            layout="vertical"
            name="orderForm"
          >
            <Form.Item
              name="name"
              label="Ad Soyad"
              rules={[{ required: true, message: 'Lütfen adınızı girin!' }]}
            >
              <Input placeholder="Adınız Soyadınız" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Telefon"
              rules={[{ required: true, message: 'Lütfen telefon numaranızı girin!' }, { pattern: /^\d{10,15}$/, message: 'Geçerli bir telefon numarası girin!' }]}
            >
              <Input placeholder="5xxxxxxxxx" maxLength={15} />
            </Form.Item>
            <Form.Item
              name="address"
              label="Adres"
              rules={[{ required: true, message: 'Lütfen adresinizi girin!' }]}
            >
              <Input.TextArea placeholder="Teslimat adresiniz" rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Order Summary Modal */}
        <Modal
          title="Sipariş Özeti"
          open={orderSummaryModalVisible}
          onCancel={() => setOrderSummaryModalVisible(false)}
          footer={[
            <Button key="ok" type="primary" onClick={() => setOrderSummaryModalVisible(false)}>
              Tamam
            </Button>
          ]}
        >
          {orderSummary && (
            <div>
              <div style={{marginBottom: 16}}>
                <b>Sipariş Takip Kodu:</b> <span style={{color:'#dc2626', fontWeight:600}}>{orderSummary.code}</span>
              </div>
              <div style={{marginBottom: 16}}>
                <b>Ad Soyad:</b> {orderSummary.name}<br/>
                <b>Telefon:</b> {orderSummary.phone}<br/>
                <b>Adres:</b> {orderSummary.address}
              </div>
              <div style={{marginBottom: 16}}>
                <b>Ürünler:</b>
                <ul style={{margin:0, paddingLeft:20}}>
                  {orderSummary.items.map((item: any) => (
                    <li key={item.id}>{item.name} x {item.quantity} ({item.price.toLocaleString('tr-TR')} ₺)</li>
                  ))}
                </ul>
              </div>
              <div>
                <b>Toplam Tutar:</b> <span style={{color:'#dc2626', fontWeight:600}}>{orderSummary.total.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>
          )}
        </Modal>
      </>
    </>
  );
};

export default App;