import ApplicationBar from '@/components/bars/application-bar';
import { EnvironmentBar } from '@/components/bars/environment-bar';

export async function AppHeader() {
  return (
    <header className="bg-card shadow sticky top-0 z-40 w-full border-b">
      <EnvironmentBar />
      <ApplicationBar />
    </header>
  );
}
