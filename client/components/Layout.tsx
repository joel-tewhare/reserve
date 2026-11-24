import { Outlet } from 'react-router'

export default function Layout() {
  return (
    <div className="shell">
      <Outlet />
    </div>
  )
}
