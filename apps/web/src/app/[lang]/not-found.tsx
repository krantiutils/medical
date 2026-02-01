import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
      <Card decorator="red" decoratorPosition="top-right" className="max-w-md w-full">
        <CardContent className="text-center py-12">
          <div className="text-8xl font-black text-primary-red mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Not Found</h1>
          <p className="text-foreground/60 mb-6">
            The professional you are looking for could not be found.
          </p>
          <Link href="/">
            <Button variant="primary">
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
