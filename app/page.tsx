import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-svh bg-gradient-to-br from-primary/10 to-primary/5">
      <header className="border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/digilink-logo.png"
              alt="Digilink IT Solutions"
              width={200}
              height={45}
              className="h-12 w-auto"
            />
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-foreground">Manage Your Subscriptions Effortlessly</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track, organize, and get timely alerts for all your client subscriptions in one place. Never miss a renewal
            date again.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <FeatureCard
              icon="📊"
              title="Track Subscriptions"
              description="Manage all your client subscriptions in one centralized dashboard"
            />
            <FeatureCard
              icon="🔔"
              title="Smart Alerts"
              description="Get automatic notifications before subscriptions expire"
            />
            <FeatureCard
              icon="📈"
              title="Analytics"
              description="Monitor subscription status and renewal dates at a glance"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-background border border-border rounded-lg hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
