import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { connectToDatabase } from '@/lib/db';
import Academy from '@/lib/models/Academy';
import AcademyPublicPage from '@/views/academy/AcademyPublicPage';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const academy: any = await Academy.findOne({ slug, isActive: true }).select('name theme.tagline description').lean();

  if (!academy) {
    return {
      title: 'Academy Not Found',
    };
  }

  return {
    title: academy.name,
    description: academy.theme?.tagline || academy.description || `Welcome to ${academy.name}`,
  };
}

export default async function AcademySlugPage({ params }: Props) {
  const { slug } = await params;
  
  await connectToDatabase();
  
  const academy = await Academy.findOne({ slug, isActive: true }).lean();
  
  if (!academy) {
    notFound();
  }

  return <AcademyPublicPage academy={JSON.parse(JSON.stringify(academy))} />;
}
