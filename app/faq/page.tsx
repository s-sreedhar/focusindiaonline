import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is the delivery time?',
      answer: 'We deliver within 3-5 business days across India. Express delivery options are available for select areas.'
    },
    {
      question: 'Do you provide original books?',
      answer: 'Yes, we only sell 100% authentic and original books directly from authorized publishers.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of purchase if the book is in unused condition. Please contact our support team for assistance.'
    },
    {
      question: 'How can I track my order?',
      answer: 'Once your order is dispatched, you will receive a tracking ID via email. You can track your order using that ID.'
    },
    {
      question: 'Do you offer discounts for bulk orders?',
      answer: 'Yes, we offer special discounts for bulk orders. Please contact us at +919959594444 for more details.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <Footer />
    </div>
  );
}
