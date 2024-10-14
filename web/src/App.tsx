import SettingsCard from 'components/SettingsCard';
import InfoCard from 'components/InfoCard';
import Canvas from 'components/Canvas';

export default function App() {
  return (
    <>
      <div className="flex flex-col items-start gap-4 xl:w-[300px]">
        <SettingsCard />
        <InfoCard />
      </div>
      <Canvas />
    </>
  );
}
