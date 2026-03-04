let sdkStarted = false;

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    if (!sdkStarted && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      const runtimeRequire = eval("require") as (moduleId: string) => unknown;
      const { NodeSDK } = runtimeRequire("@opentelemetry/sdk-node") as {
        NodeSDK: new (options: Record<string, unknown>) => { start: () => void };
      };
      const { OTLPTraceExporter } = runtimeRequire("@opentelemetry/exporter-trace-otlp-http") as {
        OTLPTraceExporter: new (options: Record<string, unknown>) => unknown;
      };

      const tracingSdk = new NodeSDK({
        traceExporter: new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")}/v1/traces`,
        }),
      });

      tracingSdk.start();
      sdkStarted = true;
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}