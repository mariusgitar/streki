import React, { Children, createContext, useContext, useEffect, useMemo, useState } from 'react'

const RouterContext = createContext({
  navigate: () => {},
  pathname: '/',
})

export function BrowserRouter({ children }) {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/')

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname || '/')
    }

    window.addEventListener('popstate', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const value = useMemo(
    () => ({
      pathname,
      navigate: (to) => {
        if (to === pathname) {
          return
        }

        window.history.pushState({}, '', to)
        setPathname(to)
      },
    }),
    [pathname],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function Routes({ children }) {
  const { pathname } = useContext(RouterContext)
  const routes = Children.toArray(children)
  const matchedRoute = routes.find((child) => React.isValidElement(child) && child.props.path === pathname)

  return matchedRoute ?? null
}

export function Route({ element }) {
  return element ?? null
}

export function Link({ to, onClick, children, ...props }) {
  const { navigate } = useContext(RouterContext)

  const handleClick = (event) => {
    onClick?.(event)

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      props.target === '_blank' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
