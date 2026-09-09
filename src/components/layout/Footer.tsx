import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="hidden border-t border-gray-200 bg-white md:block">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-lg font-bold text-[color:var(--color-deep-green)]">
              Sirat Organic Mart
            </h3>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              প্রাকৃতিক ও অর্গানিক পণ্যের বিশ্বস্ত অনলাইন স্টোর।
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">সাহায্য</h4>
            <ul className="space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              <li>
                <Link to="/contact" className="hover:text-[color:var(--color-emerald)]">
                  যোগাযোগ
                </Link>
              </li>
              <li>
                <Link
                  to="/delivery-information"
                  className="hover:text-[color:var(--color-emerald)]"
                >
                  ডেলিভারি তথ্য
                </Link>
              </li>
              <li>
                <Link
                  to="/returns-refunds"
                  className="hover:text-[color:var(--color-emerald)]"
                >
                  রিটার্ন ও রিফান্ড
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">আইনি তথ্য</h4>
            <ul className="space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              <li>
                <Link to="/about" className="hover:text-[color:var(--color-emerald)]">
                  আমাদের সম্পর্কে
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[color:var(--color-emerald)]">
                  প্রাইভেসি পলিসি
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[color:var(--color-emerald)]">
                  শর্তাবলী
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-[color:var(--color-text-secondary)]">
          © {new Date().getFullYear()} Sirat Organic Mart. সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  )
}

export default Footer