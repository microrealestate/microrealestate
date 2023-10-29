import ApplicationBar from '@/components/bars/application-bar';
import { EnvironmentBar } from '@/components/bars/environment-bar';

export async function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <EnvironmentBar />
      <ApplicationBar />
    </header>
  );
}
