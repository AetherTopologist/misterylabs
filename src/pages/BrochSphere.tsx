import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BrochSpherePrototype } from "@/components/brochSphere/BrochSpherePrototype";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BrochSphere() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container py-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Broch Sphere</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-6">
          <BrochSpherePrototype />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
