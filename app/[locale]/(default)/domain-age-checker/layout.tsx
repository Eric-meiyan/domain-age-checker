import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Domain Age Checker - Check Domain Age Of any Website',
  description: 'Check domain registration date, age, and expiration time. Free bulk domain age checker tool with accurate RDAP data.',
  keywords: 'domain age, domain checker, WHOIS, RDAP, domain registration, domain expiration',
};

export default function DomainAgeCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}