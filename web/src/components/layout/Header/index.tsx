import HeaderNavigation from '../../ui/HeaderNavigation'

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-padding-top">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-foreground">Kitchen Mix</h1>
        </div>

        <HeaderNavigation />
      </div>
    </header>
  )
}
