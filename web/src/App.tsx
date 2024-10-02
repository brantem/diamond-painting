import SettingsCard from 'components/SettingsCard';
import InfoCard from 'components/InfoCard';
import Canvas from 'components/Canvas';

export default function App() {
  return (
    <div className="flex h-full bg-neutral-50 max-xl:flex-col">
      <div className="flex flex-col items-start gap-4 p-4 max-xl:justify-between max-xl:pb-0 md:flex-row xl:flex-col xl:pr-0">
        <SettingsCard />
        <InfoCard />
      </div>

      <Canvas />
    </div>
  );
}
