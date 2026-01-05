export function measurePerformance(name: string, fn: () => void) {
  if (typeof window === "undefined" || !window.performance) return fn();

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-measure`;

  performance.mark(startMark);
  const result = fn();
  performance.mark(endMark);

  try {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure && process.env.NODE_ENV === "development") {
      console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
    }
  } catch (error) {
    console.error("Performance measurement failed:", error);
  }

  return result;
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (typeof window === "undefined" || !window.performance) return fn();

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-measure`;

  performance.mark(startMark);
  const result = await fn();
  performance.mark(endMark);

  try {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure && process.env.NODE_ENV === "development") {
      console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
    }
  } catch (error) {
    console.error("Performance measurement failed:", error);
  }

  return result;
}

export function reportWebVitals() {
  if (typeof window === "undefined") return;

  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metricName = entry.name;
          const value = Math.round(
            "duration" in entry ? entry.duration : (entry as any).value,
          );

          if (process.env.NODE_ENV === "development") {
            console.log(`📊 ${metricName}: ${value}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ["measure", "navigation", "paint"] });
    } catch (error) {
      console.error("Web Vitals reporting failed:", error);
    }
  }
}

export function clearPerformanceMarks(name?: string) {
  if (typeof window === "undefined" || !window.performance) return;

  if (name) {
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(`${name}-measure`);
  } else {
    performance.clearMarks();
    performance.clearMeasures();
  }
}

export function getMemoryUsage() {
  if (
    typeof window === "undefined" ||
    !(performance as any).memory
  )
    return null;

  const memory = (performance as any).memory;
  return {
    usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2),
    totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2),
    jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2),
  };
}
