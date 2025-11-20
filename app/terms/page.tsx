import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Focus India Online's website for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Disclaimer</h2>
            <p>
              The materials on Focus India Online's website are provided on an 'as is' basis. Focus India Online makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Limitations</h2>
            <p>
              In no event shall Focus India Online or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Focus India Online's website could include technical, typographical, or photographic errors. Focus India Online does not warrant that any of the materials on the website are accurate, complete, or current.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Links</h2>
            <p>
              Focus India Online has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Modifications</h2>
            <p>
              Focus India Online may revise these terms of service for the website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
