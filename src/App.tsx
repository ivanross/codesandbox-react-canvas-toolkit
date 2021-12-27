import { useLayoutEffect, useRef, useState } from "react";
import { useWindowSize } from "react-use";
import * as C from "canova";
import { useConst } from "./hooks/useConst";
import { useControls } from "leva";

export function scaleByDevicePixelRatio(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  maxDpr = 4
) {
  const dpr = Math.min(maxDpr, window.devicePixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const context = canvas.getContext("2d");
  context?.scale(dpr, dpr);
}

interface CanvasProps {
  width: number;
  height: number;
  loop?: boolean;
  maxDpr?: number;
}

interface CanvasEvent {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  time: number;
}

interface CanvasLoopOptions {
  draw?: (ev: CanvasEvent) => void;
  onResize?: (ev: CanvasEvent) => void;
}

const noop = () => {};
function useCanvas(props: CanvasProps, options: CanvasLoopOptions) {
  const { width, height, maxDpr = 4, loop: shouldLoop = false } = props;
  const { draw = noop, onResize } = options;

  const ref = useRef<HTMLCanvasElement>(null);

  const internal = useConst(() => ({
    startTime: Date.now(),

    // @ts-ignore ts(1056)
    get time() {
      return (Date.now() - this.startTime) / 1000;
    }
  }));

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    scaleByDevicePixelRatio(canvas, width, height, maxDpr);

    const createEvent = (): CanvasEvent => ({
      canvas,
      width,
      height,
      time: internal.time
    });

    onResize?.(createEvent());

    let cancel = false;
    const loop = () => {
      draw?.(createEvent());
      requestAnimationFrame(() => !cancel && shouldLoop && loop());
    };

    loop();

    return () => {
      cancel = true;
    };
  }, [width, height, maxDpr, shouldLoop, draw]);
  return ref;
}

export default function App() {
  const { fill } = useControls({ fill: "teal" });

  const size = useWindowSize();
  const ref = useCanvas(
    { ...size, loop: true },
    {
      draw: (e) => {
        const t = e.time;
        const r = 100 + Math.cos(t * 10) * 10;

        C.draw(e.canvas, [
          C.rect(0, 0, e.width, e.height, { fill: "black" }),
          C.circle(
            e.width / 2 + r * Math.cos(t),
            e.height / 2 + r * Math.sin(t),
            r / 4,
            { fill }
          )
        ]);
      },
      onResize: (d) => console.log("resize")
    }
  );

  return <canvas ref={ref} />;
}
