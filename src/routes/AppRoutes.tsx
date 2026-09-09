import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from '../components/common/ProtectedRoute'
import AdminRoute from '../components/common/AdminRoute'
import Spinner from '../components/common/Spinner'
import { trackPageView } from '../lib/analytics/track'

// ---------- Public / Customer pages ----------
const ComingSoon = lazy(() => import('../pages/public/ComingSoon'))
const Home = lazy(() => import('../pages/public/Home'))
const Shop = lazy(() => import('../pages/public/Shop'))
const Category = lazy(() => import('../pages/public/Category'))
const Search = lazy(() => import('../pages/public/Search'))
const ProductDetail = lazy(() => import('../pages/public/ProductDetail'))
const Cart = lazy(() => import('../pages/public/Cart'))
const Checkout = lazy(() => import('../pages/public/Checkout'))
const OrderConfirmation = lazy(() => import('../pages/public/OrderConfirmation'))
const Login = lazy(() => import('../pages/public/Login'))
const Register = lazy(() => import('../pages/public/Register'))
const ForgotPassword = lazy(() => import('../pages/public/ForgotPassword'))
const About = lazy(() => import('../pages/public/About'))
const Contact = lazy(() => import('../pages/public/Contact'))
const DeliveryInfo = lazy(() => import('../pages/public/DeliveryInfo'))
const Returns = lazy(() => import('../pages/public/Returns'))
const Privacy = lazy(() => import('../pages/public/Privacy'))
const Terms = lazy(() => import('../pages/public/Terms'))

// ---------- Account pages ----------
const Account = lazy(() => import('../pages/account/Account'))
const Orders = lazy(() => import('../pages/account/Orders'))
const OrderDetail = lazy(() => import('../pages/account/OrderDetail'))
const Addresses = lazy(() => import('../pages/account/Addresses'))

// ---------- Admin pages ----------
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('../pages/admin/Dashboard'))
const Categories = lazy(() => import('../pages/admin/Categories'))
const Products = lazy(() => import('../pages/admin/Products'))
const ProductForm = lazy(() => import('../pages/admin/ProductForm'))
const AdminOrders = lazy(() => import('../pages/admin/Orders'))
const AdminOrderDetail = lazy(() => import('../pages/admin/OrderDetail'))
const Customers = lazy(() => import('../pages/admin/Customers'))
const Coupons = lazy(() => import('../pages/admin/Coupons'))
const LegalPages = lazy(() => import('../pages/admin/LegalPages'))

/**
 * পুরো পেজ জুড়ে ফুল-স্ক্রিন ফলব্যাক — lazy chunk লোড হওয়ার সময় দেখাবে।
 * MainLayout/AdminLayout-এর বাইরে বসানো, কারণ layout নিজেও lazy বাউন্ডারির ভেতরে না।
 */
function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

const AppRoutes = () => {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ---------- Public / Customer routes ---------- */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />

          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/delivery-information" element={<DeliveryInfo />} />
          <Route path="/returns-refunds" element={<Returns />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ---------- Protected customer account routes ---------- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<Account />} />
            <Route path="/account/orders" element={<Orders />} />
            <Route path="/account/orders/:orderId" element={<OrderDetail />} />
            <Route path="/account/addresses" element={<Addresses />} />
          </Route>

          <Route path="*" element={<ComingSoon pageName="পেজ পাওয়া যায়নি (404)" />} />
        </Route>

        {/* ---------- Admin routes ---------- */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/:id" element={<ProductForm />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/coupons" element={<Coupons />} />
            <Route path="/admin/settings" element={<ComingSoon pageName="সেটিংস" />} />
            <Route path="/admin/legal-pages" element={<LegalPages />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default AppRoutes