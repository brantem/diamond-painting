import Settings from "components/Settings";
import Canvas from "components/Canvas";

export default function App() {
  return (
    <div className="flex h-full max-xl:flex-col bg-neutral-50">
      <Settings />

      <Canvas />
    </div>
  );
}
