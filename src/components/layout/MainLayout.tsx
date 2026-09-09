import { Outlet } from 'react-router-dom'
import Header from './Header'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'
import Footer from './Footer'

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MobileHeader />

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}

export default MainLayout