import { ShaderAnimation } from '@/components/ui/shader-lines';

// Standalone integration example. The portfolio uses the shader without a heading.
export default function DemoOne() {
  return (
    <div className="relative flex h-[650px] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-black">
      <ShaderAnimation />
      <span className="pointer-events-none z-10 text-center text-7xl leading-none font-semibold tracking-tighter whitespace-pre-wrap text-white">
        Shader Lines
      </span>
    </div>
  );
}
